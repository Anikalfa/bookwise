const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Interaction = require('../models/Interaction');
const recommender = require('../services/recommender');
const path = require('path');
const fs = require('fs');

// Helper: load category name map from disk (cached)
let _catMap = null;
function getCatMap() {
    if (_catMap) return _catMap;
    const DATA_PATH = path.resolve(__dirname, '..', '..', process.env.DATA_PATH || '../backend');
    for (const name of ['category.json', 'categories.json']) {
        const p = path.join(DATA_PATH, name);
        if (fs.existsSync(p)) {
            const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
            _catMap = {};
            for (const c of raw) {
                const id = String(c.category_id || '').trim();
                if (id) _catMap[id] = (c.category_name || c.name || '').trim();
            }
            return _catMap;
        }
    }
    return (_catMap = {});
}

// ── GET /me/history?user_id= ─────────────────────────────────────────────────
router.get('/history', async (req, res) => {
    const userId = (req.userId || req.query.user_id)?.toLowerCase();
    if (!userId) return res.status(400).json({ detail: 'user_id required' });

    try {
        const interactions = await Interaction.aggregate([
            { $match: { user_id: userId, book_id: { $ne: null } } },
            { $sort: { created_at: -1 } },
            { $group: { _id: '$book_id', latest: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$latest' } },
            { $sort: { created_at: -1 } },
            { $limit: 20 }
        ]);

        const bookIds = [...new Set(interactions.map(i => i.book_id))];
        const bookDocs = await Book.find({ book_id: { $in: bookIds } }, 'book_id book_title author cover_url').lean();
        const bookMap = {};
        for (const b of bookDocs) bookMap[b.book_id] = Book.toFrontend(b);

        const result = interactions.map(i => ({
            ...i,
            title: bookMap[i.book_id]?.title || null,
            author: bookMap[i.book_id]?.author || null,
            cover_url: bookMap[i.book_id]?.cover_url || null,
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── GET /me/analytics?user_id= ───────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
    const userId = (req.userId || req.query.user_id)?.toLowerCase();
    if (!userId) return res.status(400).json({ detail: 'user_id required' });

    try {
        const catMap = getCatMap();

        // ── 1. Basic counts ──
        const [uniqueClickDocs, ratings, searches, bookshelf] = await Promise.all([
            Interaction.distinct('book_id', { user_id: userId, action: 'click', book_id: { $ne: null } }),
            Interaction.countDocuments({ user_id: userId, action: 'rate' }),
            Interaction.countDocuments({ user_id: userId, action: 'search' }),
            Interaction.countDocuments({ user_id: userId, action: 'bookshelf' }),
        ]);
        const clicks = uniqueClickDocs.length;
        const totalInteractions = clicks + ratings + searches + bookshelf;

        // ── 2. All clicked book IDs + full book details ──
        const allClickedBookIds = await Interaction.distinct('book_id', { user_id: userId, action: 'click', book_id: { $ne: null } });
        const allClickedBooksRaw = await Book.find(
            { book_id: { $in: allClickedBookIds } },
            'book_id book_title author publisher publisher_id cover_url category_id categories'
        ).lean();
        const allClickedBooks = allClickedBooksRaw.map(b => Book.toFrontend(b));

        // ── 3. Unique counts ──
        const uniqueAuthors = new Set();
        const uniquePublishers = new Set();
        const uniqueCategories = new Set();
        for (const b of allClickedBooks) {
            if (b.author) uniqueAuthors.add(b.author);
            if (b.publisher) uniquePublishers.add(b.publisher);
            for (const cid of (b.categories || [])) {
                const name = catMap[String(cid)];
                if (name) uniqueCategories.add(name);
            }
        }

        // ── 4. Most Viewed Books (top 6 compact) ──
        const topViewedAgg = await Interaction.aggregate([
            { $match: { user_id: userId, action: 'click', book_id: { $ne: null } } },
            { $group: { _id: '$book_id', views: { $sum: 1 }, last_viewed: { $max: '$created_at' } } },
            { $sort: { views: -1 } },
            { $limit: 6 }
        ]);
        const topBookMap = {};
        for (const b of allClickedBooks) topBookMap[b.book_id] = b;
        const mostViewedBooks = topViewedAgg.map(t => ({
            book_id: t._id,
            views: t.views,
            last_viewed: t.last_viewed,
            title: topBookMap[t._id]?.title || 'Unknown',
            author: topBookMap[t._id]?.author || 'Unknown',
            cover_url: topBookMap[t._id]?.cover_url || null,
        }));

        // ── 5. Author breakdown (top 8, with book titles) ──
        const authorBooks = {};
        for (const b of allClickedBooks) {
            const a = b.author || 'Unknown';
            if (!authorBooks[a]) authorBooks[a] = [];
            authorBooks[a].push(b.title);
        }
        const favoriteAuthors = Object.entries(authorBooks)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8)
            .map(([name, titles]) => ({ name, books_explored: titles.length, book_titles: titles.slice(0, 3) }));

        // ── 6. Publisher breakdown (top 8) ──
        const pubCounts = {};
        for (const b of allClickedBooks) {
            const p = b.publisher || 'Unknown';
            pubCounts[p] = (pubCounts[p] || 0) + 1;
        }
        const publisherBreakdown = Object.entries(pubCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, count]) => {
                const total = allClickedBooks.length || 1;
                return { name, count, pct: Math.round((count / total) * 100) };
            });

        // ── 7. Category breakdown (from actual clicks) ──
        const catCounts = {};
        for (const b of allClickedBooks) {
            for (const cid of (b.categories || [])) {
                const name = catMap[String(cid)] || null;
                if (name) catCounts[name] = (catCounts[name] || 0) + 1;
            }
        }
        const categoryBreakdown = Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, count]) => {
                const total = Object.values(catCounts).reduce((s, v) => s + v, 0) || 1;
                return { name, count, pct: Math.round((count / total) * 100) };
            });

        // ── 8. Search History (deduplicated) ──
        const rawSearches = await Interaction.find({ user_id: userId, action: 'search' })
            .sort({ created_at: -1 }).limit(20).select('query created_at').lean();
        const seenQueries = new Set();
        const searchHistory = [];
        for (const s of rawSearches) {
            const q = (s.query || '').trim().toLowerCase();
            if (q && !seenQueries.has(q)) {
                seenQueries.add(q);
                searchHistory.push({ query: s.query, searched_at: s.created_at });
            }
        }

        // ── 9. Personality ──
        let personality = 'New Explorer';
        let personalityDesc = 'You\'re just getting started. Browse more books to unlock your reading personality!';
        if (totalInteractions > 50) {
            personality = 'Power Reader';
            personalityDesc = 'You\'re deeply engaged with the platform. Your reading patterns reveal a sophisticated taste.';
        } else if (searches > 5) {
            personality = 'Curious Explorer';
            personalityDesc = 'You love discovering new content. Your search patterns show a wide range of interests.';
        } else if (clicks > 10) {
            personality = 'Avid Browser';
            personalityDesc = 'You enjoy exploring the library. You tend to browse many books across different topics.';
        } else if (ratings > 3) {
            personality = 'Thoughtful Critic';
            personalityDesc = 'You take the time to rate books. Your feedback helps improve recommendations for everyone.';
        }

        // ── 10. First activity date ──
        const firstInteraction = await Interaction.findOne({ user_id: userId }).sort({ created_at: 1 }).select('created_at').lean();
        const memberSince = firstInteraction?.created_at || new Date();

        // ── 11. Bookshelf preview (recent 6) ──
        const bookshelfInteractionsList = await Interaction.find({ user_id: userId, action: 'bookshelf' }).sort({ created_at: -1 }).limit(6).lean();
        const bookshelfBookIds = bookshelfInteractionsList.map(i => i.book_id);
        const bookshelfBooks = await Book.find({ book_id: { $in: bookshelfBookIds } }, 'book_id book_title author cover_url').lean();
        const bookshelfMap = {};
        for (const b of bookshelfBooks) bookshelfMap[b.book_id] = Book.toFrontend(b);
        const bookshelfPreview = bookshelfBookIds.map(id => bookshelfMap[id]).filter(Boolean);

        res.json({
            stats: {
                clicks, ratings, searches, bookshelf, total: totalInteractions,
                unique_books: allClickedBookIds.length,
                unique_authors: uniqueAuthors.size,
                unique_publishers: uniquePublishers.size,
                unique_categories: uniqueCategories.size,
            },
            most_viewed_books: mostViewedBooks,
            favorite_authors: favoriteAuthors,
            publisher_breakdown: publisherBreakdown,
            category_breakdown: categoryBreakdown,
            search_history: searchHistory,
            bookshelf_preview: bookshelfPreview,
            personality: { name: personality, description: personalityDesc },
            member_since: memberSince,
        });
    } catch (err) {
        console.error('[/me/analytics] Error:', err.message, err.stack);
        res.status(500).json({ detail: err.message });
    }
});

// ── GET /me/dashboard?user_id= ───────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    const userId = (req.userId || req.query.user_id)?.toLowerCase();
    if (!userId) return res.status(400).json({ detail: 'user_id required' });

    try {
        // ── Stats ──────────────────────────────────────────────────────────────
        const [uniqueClicks, totalRatings, neuralStatus] = await Promise.all([
            Interaction.distinct('book_id', { user_id: userId, action: 'click', book_id: { $ne: null } }),
            Interaction.countDocuments({ user_id: userId, action: 'rate' }),
            recommender.checkUser(userId)
        ]);
        const totalClicksCount = uniqueClicks.length;

        const avgResult = await Interaction.aggregate([
            { $match: { user_id: userId, action: 'rate' } },
            { $group: { _id: null, avg: { $avg: '$rating' } } },
        ]);
        const avgRating = avgResult[0]?.avg ? Math.round(avgResult[0].avg * 100) / 100 : null;

        // ── Rated books (with book details) ────────────────────────────────────
        const ratedInteractions = await Interaction.find({ user_id: userId, action: 'rate' })
            .sort({ created_at: -1 })
            .limit(20)
            .lean();

        const ratedBookIds = [...new Set(ratedInteractions.map(i => i.book_id))];
        const ratedBookDocs = await Book.find({ book_id: { $in: ratedBookIds } }, 'book_id book_title author cover_url average_rating rating_count').lean();
        const ratedBookMap = {};
        for (const b of ratedBookDocs) ratedBookMap[b.book_id] = Book.toFrontend(b);

        const ratedBooks = ratedInteractions.map(i => ({
            ...ratedBookMap[i.book_id],
            rating_given: i.rating,
            created_at: i.created_at,
        })).filter(b => !!b.book_id);

        // ── Recent clicks (deduplicated history) ───────────────────────────────
        const clickInteractions = await Interaction.aggregate([
            { $match: { user_id: userId, action: 'click', book_id: { $ne: null } } },
            { $sort: { created_at: -1 } },
            { $group: { _id: '$book_id', latest: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$latest' } },
            { $sort: { created_at: -1 } },
            { $limit: 12 }
        ]);

        const clickBookIds = [...new Set(clickInteractions.map(i => i.book_id))];
        const clickBookDocs = await Book.find({ book_id: { $in: clickBookIds } }, 'book_id book_title author cover_url').lean();
        const clickBookMap = {};
        for (const b of clickBookDocs) clickBookMap[b.book_id] = Book.toFrontend(b);

        const recentClicks = clickInteractions.map(i => {
            const b = clickBookMap[i.book_id] || {};
            return {
                book_id: i.book_id,
                created_at: i.created_at,
                title: b.title || 'Unknown Title',
                author: b.author || 'Unknown Author',
                cover_url: b.cover_url || null,
            };
        });

        // ── Deep Reading DNA Analysis (Weighted Category Preferences) ─────────
        const catMap = getCatMap();
        const catCounts = {};
        
        // Fetch ALL interactions for a complete profile
        const allInteractions = await Interaction.find({ user_id: userId, book_id: { $ne: null } }).lean();
        const allBookIds = [...new Set(allInteractions.map(i => i.book_id))];
        const allBookDocs = await Book.find({ book_id: { $in: allBookIds } }, 'book_id category_id categories').lean();
        const bookDataMap = {};
        for(const b of allBookDocs) bookDataMap[b.book_id] = b;

        for (const i of allInteractions) {
            const b = bookDataMap[i.book_id];
            if (!b) continue;
            
            const cats = b.categories?.length ? b.categories : (b.category_id ? [b.category_id] : []);
            const weight = i.action === 'rate' ? (i.rating / 2) : 1;

            for (const c of cats) {
                const name = catMap[c] || c;
                catCounts[name] = (catCounts[name] || 0) + weight;
            }
        }

        const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const totalWeight = sortedCats.reduce((s, [, v]) => s + v, 0) || 1;
        const catPrefs = sortedCats.map(([name, count]) => ({
            name,
            pct: Math.round((count / totalWeight) * 100),
        }));

        const isCold = catPrefs.length === 0;
        const recExplanation = {
            algorithm: neuralStatus === 'trained' ? 'LightGCN Neural Profile' : 'Dynamic Neural Profile',
            is_cold_start: isCold,
            neural_status: neuralStatus,
            total_interactions: allInteractions.length,
            model_trained: recommender.isLoaded(),
            message: neuralStatus === 'trained' 
                ? 'Your recommendations are powered by a pre-trained neural embedding from your long-term history.'
                : 'Since your profile is new, we generated a dynamic neural vector based on your recent activity.'
        };

        res.json({
            username: userId,
            stats: {
                total_clicks: totalClicksCount,
                total_ratings: totalRatings,
                avg_rating_given: avgRating,
            },
            rated_books: ratedBooks,
            recent_clicks: recentClicks,
            category_preferences: catPrefs,
            rec_explanation: recExplanation,
        });

    } catch (err) {
        console.error('[/me/dashboard]', err.message);
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
