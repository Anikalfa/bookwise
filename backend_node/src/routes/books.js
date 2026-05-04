const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Interaction = require('../models/Interaction');
const recommender = require('../services/recommender');

// ── Helper: get userId from request ──────────────────────────────────────────
function uid(req) { return req.userId; }

// ── GET /books/search?q= ─────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
    const q = (req.query.q || '').trim();
    try {
        let books;
        if (q) {
            const userId = uid(req) || req.query.user_id;
            if (userId) {
                // Log search interaction (fire and forget)
                Interaction.create({ user_id: userId, action: 'search', query: q }).catch(e => console.error('Search log error:', e));
            }

            // Split by space and create a regex for each term
            const terms = q.split(/\s+/).filter(t => t.length > 0);
            const termQueries = terms.map(term => {
                const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                return { $or: [{ book_title: re }, { author: re }] };
            });

            books = await Book.find({ $and: termQueries })
                .sort({ average_rating: -1 })
                .limit(40)
                .lean();
        } else {
            books = await Book.find()
                .sort({ rating_count: -1 })
                .limit(30)
                .lean();
        }
        res.json(books.map(b => Book.toFrontend(b)));
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── GET /books/browse ─────────────────────────────────────────────────────────
router.get('/browse', async (req, res) => {
    const { author_id, category_id, publisher_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    try {
        let filter = {};
        if (author_id) filter.author_id = author_id;
        else if (category_id) filter.category_id = category_id;
        else if (publisher_id) filter.publisher_id = publisher_id;

        const { sort } = req.query;
        let sortObj = { average_rating: -1 }; // Default: top-rated
        if (sort === 'new') sortObj = { _id: -1 };
        else if (sort === 'popular') sortObj = { rating_count: -1 };

        const books = await Book.find(filter)
            .sort(sortObj)
            .limit(limit)
            .lean();
        res.json(books.map(b => Book.toFrontend(b)));
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── GET /books/:book_id/my-rating ──────────────────────────────────────────
router.get('/:book_id/my-rating', async (req, res) => {
    const userId = uid(req) || req.query.user_id;
    if (!userId) return res.status(400).json({ detail: 'user_id required' });
    try {
        const interaction = await Interaction.findOne({ user_id: userId, book_id: req.params.book_id, action: 'rate' }).lean();
        res.json(interaction || { rating: 0, review: '' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── POST /books/unrate ───────────────────────────────────────────────────────
router.post('/unrate', async (req, res) => {
    const { book_id } = req.body;
    const userId = uid(req) || req.body.user_id;
    if (!book_id || !userId) return res.status(400).json({ detail: 'book_id and user_id required' });

    try {
        const existing = await Interaction.findOne({ user_id: userId, book_id, action: 'rate' });
        if (!existing) return res.json({ message: 'No rating found' });

        const oldRating = existing.rating;
        await Interaction.deleteOne({ _id: existing._id });

        // Update book avg_rating and rating_count
        await Book.findOneAndUpdate(
            { book_id },
            [
                {
                    $set: {
                        average_rating: {
                            $cond: {
                                if: { $gt: ['$rating_count', 1] },
                                then: { $divide: [{ $subtract: [{ $multiply: ['$average_rating', '$rating_count'] }, oldRating] }, { $subtract: ['$rating_count', 1] }] },
                                else: 0
                            }
                        },
                        rating_count: { $max: [0, { $subtract: ['$rating_count', 1] }] },
                    },
                },
            ]
        );

        res.json({ message: 'Rating removed' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── POST /books/rate ─────────────────────────────────────────────────────────
router.post('/rate', async (req, res) => {
    const { book_id, rating, review } = req.body;
    const userId = uid(req) || req.body.user_id;

    if (!book_id || !rating) return res.status(400).json({ detail: 'book_id and rating required' });
    if (!userId) return res.status(400).json({ detail: 'user_id required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ detail: 'Rating must be 1-5' });

    try {
        const existing = await Interaction.findOne({ user_id: userId, book_id, action: 'rate' });

        if (existing) {
            const oldRating = existing.rating;
            existing.rating = rating;
            existing.review = review || null;
            await existing.save();

            // Update book avg_rating (rating_count stays same)
            await Book.findOneAndUpdate(
                { book_id },
                [
                    {
                        $set: {
                            average_rating: {
                                $divide: [
                                    { $add: [{ $subtract: [{ $multiply: ['$average_rating', '$rating_count'] }, oldRating] }, rating] },
                                    '$rating_count'
                                ]
                            }
                        },
                    },
                ]
            );
        } else {
            // New rating
            await Interaction.create({ user_id: userId, book_id, action: 'rate', rating, review: review || null });

            // Update book avg_rating and rating_count
            await Book.findOneAndUpdate(
                { book_id },
                [
                    {
                        $set: {
                            average_rating: { $divide: [{ $add: [{ $multiply: ['$average_rating', '$rating_count'] }, rating] }, { $add: ['$rating_count', 1] }] },
                            rating_count: { $add: ['$rating_count', 1] },
                        },
                    },
                ]
            );
        }

        // Update recommender model if rating >= 4
        if (rating >= 4) {
            const book = await Book.findOne({ book_id }, 'categories').lean();
            if (book) recommender.updateUserPreference(userId, book_id, book.categories);
        }

        res.json({ message: 'Rating saved' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── Bookshelf: Toggle & Get ──────────────────────────────────────────────────
router.post('/toggle-bookshelf', async (req, res) => {
    const { book_id } = req.body;
    const userId = uid(req) || req.body.user_id;

    if (!book_id || !userId) return res.status(400).json({ detail: 'book_id and user_id required' });

    try {
        const existing = await Interaction.findOne({ user_id: userId, book_id, action: 'bookshelf' });
        if (existing) {
            await Interaction.deleteOne({ _id: existing._id });
            return res.json({ status: 'removed', message: 'Removed from bookshelf' });
        } else {
            await Interaction.create({ user_id: userId, book_id, action: 'bookshelf' });
            return res.json({ status: 'added', message: 'Added to bookshelf' });
        }
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

router.get('/bookshelf', async (req, res) => {
    const userId = uid(req) || req.query.user_id;
    if (!userId) return res.status(400).json({ detail: 'user_id required' });

    try {
        const bookshelfInteractions = await Interaction.find({ user_id: userId, action: 'bookshelf' }).sort({ created_at: -1 }).lean();
        const bookIds = bookshelfInteractions.map(i => i.book_id);
        const books = await Book.find({ book_id: { $in: bookIds } }).lean();

        // Sort books in the order they were added to bookshelf
        const bookMap = {};
        for (const b of books) bookMap[b.book_id] = b;
        const result = bookIds.map(id => bookMap[id]).filter(Boolean);

        res.json(result.map(b => Book.toFrontend(b)));
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── GET /books/:book_id ───────────────────────────────────────────────────────
router.get('/:book_id', async (req, res) => {
    try {
        const book = await Book.findOne({ book_id: req.params.book_id }).lean();
        if (!book) return res.status(404).json({ detail: 'Book not found' });
        res.json(Book.toFrontend(book));
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ── POST /books/:book_id/click ────────────────────────────────────────────────
router.post('/:book_id/click', async (req, res) => {
    const { book_id } = req.params;
    const userId = uid(req) || req.body?.user_id;

    if (!userId) return res.status(400).json({ detail: 'user_id required' });

    try {
        await Interaction.create({ user_id: userId, book_id, action: 'click' });

        // Fire-and-forget: update recommender model
        const book = await Book.findOne({ book_id }, 'category_id categories').lean();
        if (book) {
            const cats = book.categories?.length ? book.categories : (book.category_id ? [book.category_id] : []);
            recommender.updateUserPreference(userId, book_id, cats);
        }

        res.json({ message: 'Click recorded' });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
