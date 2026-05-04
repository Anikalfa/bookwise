const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const DATA_PATH = path.resolve(__dirname, '..', '..', process.env.DATA_PATH || '../backend');

// ── In-memory cache (loaded once on first request) ───────────────────────────
const _cache = {};

function loadJSON(filename, altFilename) {
    const key = filename;
    if (_cache[key]) return _cache[key];

    for (const name of [filename, altFilename].filter(Boolean)) {
        const p = path.join(DATA_PATH, name);
        if (fs.existsSync(p)) {
            _cache[key] = JSON.parse(fs.readFileSync(p, 'utf-8'));
            return _cache[key];
        }
    }
    return [];
}

// ── GET /meta/authors ────────────────────────────────────────────────────────
router.get('/authors', (req, res) => {
    const raw = loadJSON('author.json', 'authors.json');
    const out = raw
        .map(a => ({
            author_id: String(a.author_id || '').trim(),
            name: (a.author_name || a.author || a.name || '').trim(),
        }))
        .filter(a => a.author_id && a.name);
    res.json(out);
});

// ── GET /meta/categories ─────────────────────────────────────────────────────
router.get('/categories', (req, res) => {
    const raw = loadJSON('category.json', 'categories.json');
    const out = raw
        .map(c => ({
            category_id: String(c.category_id || '').trim(),
            name: (c.category_name || c.name || '').trim(),
        }))
        .filter(c => c.category_id && c.name);
    res.json(out);
});

// ── GET /meta/categories/map ─────────────────────────────────────────────────
router.get('/categories/map', (req, res) => {
    const raw = loadJSON('category.json', 'categories.json');
    const map = {};
    for (const c of raw) {
        const id = String(c.category_id || '').trim();
        if (id) map[id] = (c.category_name || c.name || '').trim();
    }
    res.json(map);
});

// ── GET /meta/publishers ─────────────────────────────────────────────────────
router.get('/publishers', (req, res) => {
    const raw = loadJSON('publisher.json', 'publishers.json');
    const out = raw
        .map(p => ({
            publisher_id: String(p.publisher_id || '').trim(),
            name: (p.publisher_name || p.publisher || p.name || '').trim(),
        }))
        .filter(p => p.publisher_id && p.name);
    res.json(out);
});

module.exports = router;
