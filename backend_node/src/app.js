require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// ── User-ID extractor (no auth — accepts header, query, or body) ─────────────
// Attaches req.userId if provided; routes that need it will validate.
app.use((req, res, next) => {
    // Try header, then Bearer token (mock-token-ID), then query, then body
    let authId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer mock-token-')) {
        authId = req.headers.authorization.split('Bearer mock-token-')[1];
    }

    req.userId =
        req.headers['x-user-id'] ||
        authId ||
        req.query.user_id ||
        (req.body && req.body.user_id) ||
        null;
    next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', require('./routes/auth'));
app.use('/meta', require('./routes/meta'));
app.use('/books', require('./routes/books'));
app.use('/recommendations', require('./routes/recommendations'));
app.use('/me', require('./routes/profile'));

// ── Frontend ─────────────────────────────────────────────────────────────────
const FRONTEND_DIR = path.resolve(__dirname, '..', '../frontend_react/dist');
app.use(express.static(FRONTEND_DIR));

app.get('*', (req, res, next) => {
    // Exclude API routes - they should have been handled or should 404
    if (req.path.startsWith('/auth') || req.path.startsWith('/meta') ||
        req.path.startsWith('/books') || req.path.startsWith('/recommendations') ||
        req.path.startsWith('/me')) {
        return next();
    }
    const indexFile = path.join(FRONTEND_DIR, 'index.html');
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    res.send('<h1>Frontend not found (Run npm run build first)</h1>');
});

// ── Health / Debug ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    const recommender = require('./services/recommender');
    res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1, model_loaded: recommender.isLoaded() });
});

app.get('/debug', async (req, res) => {
    try {
        const Book = require('./models/Book');
        const Interaction = require('./models/Interaction');
        const [books, interactions] = await Promise.all([
            Book.countDocuments(),
            Interaction.countDocuments(),
        ]);
        res.json({
            status: 'ok',
            books,
            interactions,
            endpoints: [
                '/meta/authors', '/meta/categories', '/meta/categories/map', '/meta/publishers',
                '/books/search', '/books/browse', '/books/:id', '/books/:id/click', '/books/rate',
                '/recommendations', '/me/dashboard', '/me/history',
            ],
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── MongoDB + Server startup ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookwise';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('[MongoDB] Connected to', MONGO_URI);
        // Pre-warm the Python recommender process
        require('./services/recommender').warmup();
        app.listen(PORT, () => console.log(`[Server] BookWise API running on http://127.0.0.1:${PORT}`));
    })
    .catch(err => {
        console.error('[MongoDB] Connection failed:', err.message);
        process.exit(1);
    });

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGINT', () => {
    require('./services/recommender').shutdown();
    mongoose.disconnect().then(() => process.exit(0));
});
