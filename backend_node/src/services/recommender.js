/**
 * Python Recommender Bridge Service
 *
 * Spawns ONE persistent Python process (recommend.py) at startup.
 * Communicates via newline-delimited JSON on stdin/stdout.
 * This avoids reloading model.pkl (~4MB) on every request.
 */

const { spawn } = require('child_process');
const path = require('path');

const PYTHON = process.env.PYTHON_PATH || 'python';
const MODEL_PATH = path.resolve(__dirname, '..', '..', process.env.MODEL_PATH || '../backend/lightgcn_model.pkl');
const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'recommend.py');
const TIMEOUT_MS = 30000; // 30s — LightGCN model is ~44MB, needs more time to load

let _proc = null;   // child_process handle
let _ready = false;  // model loaded signal received
let _callbacks = [];     // queue of {resolve, reject, timer} waiting for responses
let _buf = '';     // stdout line buffer

// ── Start the Python process ──────────────────────────────────────────────────
function start() {
    if (_proc) return;

    _proc = spawn(PYTHON, [SCRIPT], {
        env: { ...process.env, MODEL_PATH },
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    // stdout: newline-delimited JSON responses
    _proc.stdout.on('data', chunk => {
        _buf += chunk.toString();
        let nl;
        while ((nl = _buf.indexOf('\n')) !== -1) {
            const line = _buf.slice(0, nl).trim();
            _buf = _buf.slice(nl + 1);
            if (!line) continue;
            try {
                const msg = JSON.parse(line);
                // First line is the "ready" signal
                if (!_ready && msg.result === 'ready') { _ready = true; console.log('[Recommender] Python model ready.'); continue; }
                const cb = _callbacks.shift();
                if (cb) { clearTimeout(cb.timer); cb.resolve(msg); }
            } catch (e) {
                console.error('[Recommender] Bad JSON from Python:', line);
            }
        }
    });

    // stderr: Python logs → forward to console
    _proc.stderr.on('data', d => process.stderr.write('[Python] ' + d.toString()));

    _proc.on('exit', (code) => {
        console.warn(`[Recommender] Python process exited (code ${code}). Restarting in 2s…`);
        _proc = null;
        _ready = false;
        _callbacks.forEach(cb => { clearTimeout(cb.timer); cb.reject(new Error('Recommender process died')); });
        _callbacks = [];
        setTimeout(start, 2000);
    });
}

// ── Send a command and wait for the response ──────────────────────────────────
function call(cmd) {
    return new Promise((resolve, reject) => {
        if (!_proc || !_ready) return reject(new Error('Recommender not ready'));

        const timer = setTimeout(() => {
            const idx = _callbacks.findIndex(c => c.reject === reject);
            if (idx !== -1) _callbacks.splice(idx, 1);
            reject(new Error('Recommender timeout'));
        }, TIMEOUT_MS);

        _callbacks.push({ resolve, reject, timer });
        _proc.stdin.write(JSON.stringify(cmd) + '\n');
    });
}

// ── Public API ────────────────────────────────────────────────────────────────
async function getRecommendations(userId, excludeBookIds = [], k = 12, interactionIds = [], interactionCatIds = [], targetCatId = null) {
    try {
        const res = await call({
            action: 'recommend',
            user_id: String(userId),
            k,
            exclude: excludeBookIds,
            item_ids: interactionIds,
            category_ids: interactionCatIds,
            target_cat_id: targetCatId
        });
        return res.result || [];
    } catch (err) {
        console.error('[Recommender] getRecommendations error:', err.message);
        return [];
    }
}

async function updateUserPreference(userId, bookId, categories = []) {
    try {
        await call({ action: 'update', user_id: String(userId), book_id: String(bookId), categories });
    } catch (err) {
        console.error('[Recommender] updateUserPreference error:', err.message);
    }
}

async function getUserTopCategories(userId, k = 3) {
    try {
        const res = await call({ action: 'top_cats', user_id: String(userId), k });
        return res.result || [];
    } catch (err) {
        console.error('[Recommender] getUserTopCategories error:', err.message);
        return [];
    }
}

async function checkUser(userId) {
    try {
        const res = await call({ action: 'check_user', user_id: String(userId) });
        return res.result || 'unknown';
    } catch (err) {
        console.error('[Recommender] checkUser error:', err.message);
        return 'error';
    }
}

function warmup() { start(); }

function isLoaded() { return _ready; }

function shutdown() {
    if (_proc) { try { _proc.stdin.end(); } catch (_) { } }
}

module.exports = { getRecommendations, updateUserPreference, getUserTopCategories, checkUser, warmup, isLoaded, shutdown };
