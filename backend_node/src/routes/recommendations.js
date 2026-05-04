const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Interaction = require('../models/Interaction');
const recommender = require('../services/recommender');

// ── Fallback: return globally popular books ──────────────────────────────────
async function getPopularBooks(excludeBookIds = [], k = 12) {
    const excludeSet = new Set(excludeBookIds.map(String));
    const books = await Book.find({
        book_id: { $nin: Array.from(excludeSet) }
    })
        .sort({ rating_count: -1, average_rating: -1 })
        .limit(k)
        .lean();
    return books.map(b => Book.toFrontend(b));
}

// ── GET /recommendations?user_id= ──────────────────────────────────────────
router.get('/', async (req, res) => {
    const userId = req.userId || req.query.user_id;
    const targetCatId = req.query.category_id; // Added: capture target category
    if (!userId) return res.status(400).json({ detail: 'user_id required' });

    try {
        // ── Get seen books to exclude ─────────────────────────────────────────
        const seenDocs = await Interaction.distinct('book_id', { user_id: userId });

        if (seenDocs.length === 0) {
            // TRUE COLD START: Return nothing, the frontend should hide the carousel
            return res.json({ recommendations: [], reason: '', is_cold_start: true });
        }

        // ── Get recent interactions (Clicks + Ratings >= 3) ───────────────────
        const recentInteractions = await Interaction.find({
            user_id: userId,
            action: { $in: ['click', 'rate'] },
            $or: [{ action: 'click' }, { action: 'rate', rating: { $gte: 3 } }],
            book_id: { $ne: null }
        })
            .sort({ created_at: -1 })
            .limit(20)
            .lean();
        const interactionIds = recentInteractions.map(i => String(i.book_id));

        // ── CATEGORICAL NEURAL FALLBACK (DIVERSITY STRATEGY) ────────────────
        // Fetch categories of these interactions to find "neural style-proxies"
        const interactionBooks = await Book.find({ book_id: { $in: interactionIds } }, 'category_id categories').lean();
        const interactionCatIds = new Set();
        for (const b of interactionBooks) {
            if (b.categories?.length) b.categories.forEach(c => interactionCatIds.add(String(c)));
            else if (b.category_id) interactionCatIds.add(String(b.category_id));
        }

        // Diversity Strategy: Find 5 popular books PER category that are likely in our 15k model.
        // This prevents globally popular categories (like Religious) from burying niche ones (like Agriculture).
        const proxySeeds = [];
        if (interactionCatIds.size > 0) {
            const catArray = Array.from(interactionCatIds);
            const proxyBatches = await Promise.all(catArray.map(catId => 
                Book.find({
                    $or: [{ category_id: String(catId) }, { categories: String(catId) }],
                    book_id: { $nin: interactionIds }
                })
                .sort({ rating_count: -1 })
                .limit(5)
                .select('book_id')
                .lean()
            ));
            proxyBatches.flat().forEach(b => proxySeeds.push(String(b.book_id)));
        }

        // ── Try LightGCN model ────────────────────────────────────────────────
        let bookIds = [];
        let usedModel = false;
        try {
            // Combine actual clicks and categorical style-proxies
            const allSeeds = [...new Set([...interactionIds, ...proxySeeds])];
            
            bookIds = await recommender.getRecommendations(
                userId, 
                seenDocs, 
                30, 
                allSeeds,      // Enhanced seed list
                Array.from(interactionCatIds), // Pass categories for potential boosting
                targetCatId    // Active UI filter
            );
            usedModel = bookIds && bookIds.length > 0;
        } catch (modelErr) {
            console.warn('[/recommendations] Model error, falling back to popular:', modelErr.message);
        }

        // ── Fallback: popular books ──────────────────────────────────────────
        // (If targetCatId is present, we could also boost popular books here, but let's focus on model first)
        if (!usedModel) {
            const popular = await getPopularBooks(seenDocs, 12);
            return res.json({
                recommendations: popular,
                reason: 'Popular books you might enjoy',
                is_cold_start: true,
                total_interactions: seenDocs.length,
            });
        }

        // ── Fetch book documents ──────────────────────────────────────────────
        const bookDocs = await Book.find({ book_id: { $in: bookIds } }).lean();
        const bookMap = {};
        for (const b of bookDocs) {
            bookMap[String(b.book_id)] = {
                ...Book.toFrontend(b),
                categories: b.categories?.map(String) || (b.category_id ? [String(b.category_id)] : [])
            };
        }

        let ordered = bookIds.map(id => bookMap[String(id)]).filter(Boolean);

        // ── Category Boosting Logic ──────────────────────────────────────────
        if (targetCatId && ordered.length > 0) {
            const boostingId = String(targetCatId);
            const matches = ordered.filter(b => b.categories?.includes(boostingId));
            const others = ordered.filter(b => !b.categories?.includes(boostingId));
            
            // Re-order: Matches first, then others
            ordered = [...matches, ...others];
        }

        // Limit to final count
        const finalRecs = ordered.slice(0, 12);

        if (finalRecs.length === 0) {
            const popular = await getPopularBooks(seenDocs, 12);
            return res.json({
                recommendations: popular,
                reason: 'Popular books you might enjoy',
                is_cold_start: true,
                total_interactions: seenDocs.length,
            });
        }

        return res.json({
            recommendations: finalRecs,
            reason: targetCatId ? 'Tailored to your current interest' : 'Personalized picks for you',
            is_cold_start: false,
            total_interactions: seenDocs.length,
        });

    } catch (err) {
        console.error('[/recommendations]', err.message);
        res.status(500).json({ detail: err.message });
    }
});

module.exports = router;
