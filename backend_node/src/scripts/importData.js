/**
 * BookWise Data Import Script
 * Usage: node --max-old-space-size=4096 src/scripts/importData.js
 *
 * Reads book.json, author.json, category.json, publisher.json from DATA_PATH
 * and seeds the MongoDB `books` collection.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const DATA_PATH = path.resolve(__dirname, '..', '..', process.env.DATA_PATH || '../backend');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookwise';
const BATCH_SIZE = 500;

// ── Helpers ──────────────────────────────────────────────────────────────────
function findFile(...names) {
    for (const name of names) {
        const p = path.join(DATA_PATH, name);
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function loadJSON(file) {
    console.log(`  Loading ${path.basename(file)} (${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} MB)…`);
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

async function insertBatch(Model, docs) {
    if (!docs.length) return 0;
    try {
        const result = await Model.collection.insertMany(docs, { ordered: false });
        return result.insertedCount || 0;
    } catch (err) {
        if (err.insertedCount) return err.insertedCount;
        if (err.result && err.result.nInserted) return err.result.nInserted;
        if (err.code === 11000) return 0;
        return 0;
    }
}



// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n📚 BookWise — MongoDB Data Import');
    console.log('═'.repeat(48));
    console.log(`  DATA_PATH : ${DATA_PATH}`);
    console.log(`  MONGO_URI : ${MONGO_URI}\n`);

    // ── Connect ─────────────────────────────────────────────────────────────
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const Book = require('../models/Book');

    // ── Step 1: Load author map (author_id → name) ──────────────────────────
    console.log('── Step 1: Loading author map…');
    const authorFile = findFile('author.json', 'authors.json');
    const authorMap = new Map();
    if (authorFile) {
        const authors = loadJSON(authorFile);
        for (const a of authors) {
            const id = String(a.author_id || '').trim();
            const name = (a.author_name || a.author || a.name || '').trim();
            if (id) authorMap.set(id, name);
        }
        console.log(`  ✓ ${authorMap.size} authors loaded\n`);
    } else {
        console.log('  ⚠ author.json not found — author names will be placeholders\n');
    }

    // ── Step 2: Clear existing books ─────────────────────────────────────────
    console.log('── Step 2: Clearing existing books…');
    await Book.deleteMany({});
    console.log('  ✓ Books collection cleared\n');

    // ── Step 3: Load & import books in batches ────────────────────────────────
    const bookFile = findFile('book.json', 'books.json');
    if (!bookFile) {
        console.error('✗ book.json not found in', DATA_PATH);
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log('── Step 3: Importing books…');
    const rawBooks = loadJSON(bookFile);
    console.log(`  Raw records: ${rawBooks.length.toLocaleString()}`);

    let loaded = 0, skipped = 0;
    let batch = [];

    for (const b of rawBooks) {
        const bookId = String(b.book_id || '').trim();
        const title = (b.book_title || b.title || '').trim();
        if (!bookId || !title) { skipped++; continue; }

        const authorId = String(b.author_id || '').trim();
        const publisherId = String(b.publisher_id || '').trim();
        const categoryId = String(b.category_id || '').trim();

        const price = parseFloat(b.book_price || b.price) || null;
        const offerPrice = parseFloat(b.offer_price) || null;
        const pages = parseInt(b.book_pages) || null;
        const avgRating = parseFloat(b.average_rating) || 0;
        const ratingCnt = parseInt(b.rating_count) || 0;

        batch.push({
            book_id: bookId,
            title,
            author: authorMap.get(authorId) || (authorId ? `Author #${authorId}` : 'Unknown'),
            author_id: authorId,
            publisher_id: publisherId,
            cover_url: 'https://www.rokomari.com/files/200/images/Books/default_book_cover.jpg',
            description: (b.book_summary || '').trim(),
            avg_rating: avgRating,
            rating_count: ratingCnt,
            categories: categoryId ? [categoryId] : [],
            publication_year: null,
            pages,
            price,
            offer_price: offerPrice,
            book_url: (b.book_url || '').trim(),
        });

        if (batch.length >= BATCH_SIZE) {
            loaded += await insertBatch(Book, batch);
            batch = [];
            if (loaded % 5000 === 0) process.stdout.write(`\r  Inserted: ${loaded.toLocaleString()} books…`);
        }
    }

    // Final batch
    if (batch.length) loaded += await insertBatch(Book, batch);

    console.log(`\n  ✓ Books inserted : ${loaded.toLocaleString()}`);
    console.log(`  ✓ Books skipped  : ${skipped.toLocaleString()}`);

    // ── Step 4: Ensure indexes ─────────────────────────────────────────────
    console.log('\n── Step 4: Ensuring indexes…');
    await Book.ensureIndexes();
    console.log('  ✓ Indexes created');

    // ── Done ───────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(48));
    console.log('✅ Import complete!');
    console.log(`   Total in DB: ${(await Book.countDocuments()).toLocaleString()} books`);
    console.log('   Run: npm start\n');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('\n✗ Import failed:', err.message);
    mongoose.disconnect().then(() => process.exit(1));
});
