"""
BookWise FastAPI Backend  v2.0
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
Then open: http://127.0.0.1:8000
"""

import sqlite3
import hashlib
import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import secrets

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from recommender import LightGCNRecommender

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="BookWise API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

security = HTTPBearer()
BASE = Path(__file__).parent
FRONTEND_DIST = BASE.parent / "frontend_react" / "dist"
FRONTEND_PATH = FRONTEND_DIST / "index.html"
MODEL_PATH    = BASE / "lightgcn_model.pkl"
DB_PATH       = BASE / "bookwise.db"

# Mount static assets from the React build
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="static-assets")

# ── Frontend ───────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    if FRONTEND_PATH.exists():
        return HTMLResponse(content=FRONTEND_PATH.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Frontend not found</h1>")

# ── Model ──────────────────────────────────────────────────────────────────────
_recommender = None

def get_recommender():
    global _recommender
    if _recommender is None:
        _recommender = LightGCNRecommender()
        if MODEL_PATH.exists():
            _recommender.load(str(MODEL_PATH))
    return _recommender

# Removed _demo_model as it relied on old categorical structure.

# ── DB helpers ─────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def _load_author_map():
    path = next((BASE / n for n in ["author.json","authors.json"] if (BASE / n).exists()), None)
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    amap = {}
    if isinstance(raw, list):
        for a in raw:
            aid = str(a.get("author_id","")).strip()
            nm  = (a.get("author_name") or a.get("author") or a.get("name") or "").strip()
            if aid: amap[aid] = nm
    elif isinstance(raw, dict):
        amap = {str(k): v for k, v in raw.items()}
    return amap

def _load_json(name, *alt_names):
    for n in [name, *alt_names]:
        p = BASE / n
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
    return []

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            preferred_genres TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id TEXT NOT NULL,
            action TEXT NOT NULL,
            rating INTEGER,
            review TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS books (
            book_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            author TEXT,
            cover_url TEXT,
            description TEXT,
            avg_rating REAL DEFAULT 0,
            rating_count INTEGER DEFAULT 0,
            categories TEXT DEFAULT '[]',
            publication_year INTEGER,
            pages INTEGER
        );
    """)
    for col, td in [("author_id","TEXT"),("publisher_id","TEXT"),
                    ("price","REAL"),("offer_price","REAL"),("book_url","TEXT")]:
        try:
            conn.execute(f"ALTER TABLE books ADD COLUMN {col} {td}")
        except Exception:
            pass
    try:
        conn.execute("ALTER TABLE interactions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except Exception:
        pass
    conn.commit()
    if conn.execute("SELECT COUNT(*) FROM books").fetchone()[0] == 0:
        _seed_books(conn)
    conn.close()

def _seed_books(conn):
    bp = next((BASE / n for n in ["books.json","book.json"] if (BASE / n).exists()), None)
    if not bp:
        print("[DB] No books.json found — using demo data.")
        demo = [
            ("1","The Alchemist","Paulo Coelho","","",4.7,2100000,'["1"]',1988,208,"1","1",None,None,""),
            ("2","1984","George Orwell","","",4.7,3200000,'["2"]',1949,328,"2","2",None,None,""),
        ]
        conn.executemany(_INS, demo); conn.commit(); return

    print(f"[DB] Seeding from {bp.name}")
    with open(bp,"r",encoding="utf-8") as f:
        raw = json.load(f)
    amap = _load_author_map()
    rows, skip = [], 0
    for b in raw:
        bid   = str(b.get("book_id","")).strip()
        title = (b.get("book_title") or "").strip()
        if not bid or not title: skip += 1; continue
        aid  = str(b.get("author_id","")).strip()
        pid  = str(b.get("publisher_id","")).strip()
        auth = amap.get(aid, f"Author #{aid}" if aid else "Unknown")
        cat  = str(b.get("category_id","")).strip()
        cats = json.dumps([cat]) if cat else "[]"
        pg   = b.get("book_pages"); pg = int(pg) if pg else None
        pr   = b.get("book_price") or b.get("price"); pr = float(pr) if pr else None
        op   = b.get("offer_price"); op = float(op) if op else None
        rows.append((bid,title,auth,
                     "https://www.rokomari.com/files/200/images/Books/default_book_cover.jpg",
                     (b.get("book_summary") or "").strip(),
                     float(b.get("average_rating") or 0), int(b.get("rating_count") or 0),
                     cats, None, pg, aid, pid, pr, op,
                     (b.get("book_url") or "").strip()))
    conn.executemany(_INS, rows); conn.commit()
    print(f"[DB] ✓ {len(rows)} books loaded (skipped {skip})")

_INS = ("INSERT OR IGNORE INTO books "
        "(book_id,title,author,cover_url,description,avg_rating,rating_count,categories,"
        "publication_year,pages,author_id,publisher_id,price,offer_price,book_url) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")

# ── Auth helpers ───────────────────────────────────────────────────────────────
def _hash(pw):   return hashlib.sha256(pw.encode()).hexdigest()
def _session(uid):
    tok = secrets.token_urlsafe(32)
    exp = datetime.utcnow() + timedelta(days=7)
    conn = get_db()
    conn.execute("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)",
                 (tok, uid, exp.isoformat()))
    conn.commit(); conn.close()
    return tok

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    conn = get_db()
    row  = conn.execute("SELECT user_id FROM sessions WHERE token=? AND expires_at>?",
                        (creds.credentials, datetime.utcnow().isoformat())).fetchone()
    conn.close()
    if not row: raise HTTPException(401, "Invalid or expired token")
    return row["user_id"]

# ── Pydantic models ────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str; email: str; password: str; preferred_genres: List[str] = []

class LoginRequest(BaseModel):
    username: str; password: str

class RatingRequest(BaseModel):
    book_id: str; rating: int; review: Optional[str] = None

# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    init_db(); get_recommender()

# ── Auth ───────────────────────────────────────────────────────────────────────
@app.post("/auth/register")
def register(req: RegisterRequest):
    conn = get_db()
    try:
        conn.execute("INSERT INTO users (username,email,password_hash,preferred_genres) VALUES (?,?,?,?)",
                     (req.username, req.email, _hash(req.password), json.dumps(req.preferred_genres)))
        conn.commit()
        uid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    except sqlite3.IntegrityError:
        conn.close(); raise HTTPException(400, "Username or email already exists")
    conn.close()
    return {"token": _session(uid), "user_id": uid, "username": req.username}

@app.post("/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    u = conn.execute("SELECT id,username FROM users WHERE username=? AND password_hash=?",
                     (req.username, _hash(req.password))).fetchone()
    conn.close()
    if not u: raise HTTPException(401, "Invalid credentials")
    return {"token": _session(u["id"]), "user_id": u["id"], "username": u["username"]}

@app.post("/auth/logout")
def logout(creds: HTTPAuthorizationCredentials = Depends(security)):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE token=?", (creds.credentials,))
    conn.commit(); conn.close()
    return {"message": "Logged out"}

# ── Meta: Author / Category / Publisher ────────────────────────────────────────
@app.get("/meta/authors")
def meta_authors(user_id: int = Depends(get_current_user)):
    raw = _load_json("author.json", "authors.json")
    out = []
    for a in raw:
        aid  = str(a.get("author_id", "")).strip()
        name = (a.get("author_name") or a.get("author") or a.get("name") or "").strip()
        if aid and name:
            out.append({"author_id": aid, "name": name})
    return out

@app.get("/meta/categories")
def meta_categories(user_id: int = Depends(get_current_user)):
    raw = _load_json("category.json", "categories.json")
    out = []
    for c in raw:
        cid  = str(c.get("category_id", "")).strip()
        name = (c.get("category_name") or c.get("name") or "").strip()
        if cid and name:
            out.append({"category_id": cid, "name": name})
    return out

@app.get("/meta/categories/map")
def meta_categories_map(user_id: int = Depends(get_current_user)):
    """Returns {category_id: name} dict for resolving IDs to names in the UI."""
    raw = _load_json("category.json", "categories.json")
    return {str(c.get("category_id","")): (c.get("category_name") or c.get("name",""))
            for c in raw if c.get("category_id")}

@app.get("/meta/publishers")
def meta_publishers(user_id: int = Depends(get_current_user)):
    raw = _load_json("publisher.json", "publishers.json")
    out = []
    for p in raw:
        pid  = str(p.get("publisher_id", "")).strip()
        name = (p.get("publisher_name") or p.get("publisher") or p.get("name") or "").strip()
        if pid and name:
            out.append({"publisher_id": pid, "name": name})
    return out

# ── Books ──────────────────────────────────────────────────────────────────────
@app.get("/books/search")
def search_books(q: str = "", user_id: int = Depends(get_current_user)):
    conn = get_db()
    if q:
        books = conn.execute("SELECT * FROM books WHERE title LIKE ? OR author LIKE ? LIMIT 30",
                             (f"%{q}%", f"%{q}%")).fetchall()
    else:
        books = conn.execute("SELECT * FROM books ORDER BY rating_count DESC LIMIT 30").fetchall()
    conn.close()
    return [dict(b) for b in books]

@app.get("/books/browse")
def browse_books(
    author_id:    Optional[str] = Query(None),
    category_id:  Optional[str] = Query(None),
    publisher_id: Optional[str] = Query(None),
    limit: int = Query(30, le=100),
    user_id: int = Depends(get_current_user)
):
    conn = get_db()
    if author_id:
        rows = conn.execute("SELECT * FROM books WHERE author_id=? ORDER BY avg_rating DESC LIMIT ?",
                            (author_id, limit)).fetchall()
    elif category_id:
        rows = conn.execute("SELECT * FROM books WHERE categories LIKE ? ORDER BY avg_rating DESC LIMIT ?",
                            (f'%"{category_id}"%', limit)).fetchall()
    elif publisher_id:
        rows = conn.execute("SELECT * FROM books WHERE publisher_id=? ORDER BY avg_rating DESC LIMIT ?",
                            (publisher_id, limit)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM books ORDER BY avg_rating DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/books/{book_id}")
def get_book(book_id: str, user_id: int = Depends(get_current_user)):
    conn = get_db()
    b = conn.execute("SELECT * FROM books WHERE book_id=?", (book_id,)).fetchone()
    conn.close()
    if not b: raise HTTPException(404, "Book not found")
    return dict(b)

@app.post("/books/{book_id}/click")
def click_book(book_id: str, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute("INSERT INTO interactions (user_id,book_id,action) VALUES (?,?,'click')", (user_id, book_id))
    conn.commit()
    b = conn.execute("SELECT categories FROM books WHERE book_id=?", (book_id,)).fetchone()
    conn.close()
    if b:
        get_recommender().update_user_preference(str(user_id), book_id, json.loads(b["categories"]))
    return {"message": "Click recorded"}

@app.post("/books/rate")
def rate_book(req: RatingRequest, user_id: int = Depends(get_current_user)):
    if not (1 <= req.rating <= 5): raise HTTPException(400, "Rating must be 1-5")
    conn = get_db()
    conn.execute("INSERT INTO interactions (user_id,book_id,action,rating,review) VALUES (?,?,'rate',?,?)",
                 (user_id, req.book_id, req.rating, req.review))
    conn.execute("UPDATE books SET avg_rating=(avg_rating*rating_count+?)/(rating_count+1),"
                 "rating_count=rating_count+1 WHERE book_id=?", (req.rating, req.book_id))
    conn.commit()
    b = conn.execute("SELECT categories FROM books WHERE book_id=?", (req.book_id,)).fetchone()
    conn.close()
    if b and req.rating >= 4:
        get_recommender().update_user_preference(str(user_id), req.book_id, json.loads(b["categories"]))
    return {"message": "Rating saved"}

# ── Recommendations ────────────────────────────────────────────────────────────
@app.get("/recommendations")
def recommendations(user_id: int = Depends(get_current_user)):
    conn  = get_db()
    model = get_recommender()

    # Count total interactions for this user (clicks + ratings)
    total_interactions = conn.execute(
        "SELECT COUNT(*) FROM interactions WHERE user_id=?", (user_id,)
    ).fetchone()[0]

    # TRUE COLD START: user has zero interactions → return empty list
    # Frontend will show a welcome/onboarding screen instead of random books
    if total_interactions == 0:
        conn.close()
        return {
            "recommendations": [],
            "reason": "",
            "is_cold_start": True,
            "total_interactions": 0,
            "top_categories": []
        }

    # ── User has interactions ─────────────────────────────────────────

    # 1. Actual interactions
    interactions = conn.execute(
        "SELECT book_id FROM interactions WHERE user_id=? AND (action='click' OR (action='rate' AND rating >= 3)) ORDER BY created_at DESC LIMIT 20",
        (user_id,)
    ).fetchall()
    interaction_ids = [str(r["book_id"]) for r in interactions]
    
    # 2. Find categories of these interactions for style-proxies
    proxy_seeds = []
    if interaction_ids:
        ph    = ",".join("?" * len(interaction_ids))
        inter_books = conn.execute(f"SELECT categories FROM books WHERE book_id IN ({ph})", interaction_ids).fetchall()
        
        target_cats = set()
        for row in inter_books:
            try:
                for c in json.loads(row["categories"]): target_cats.add(str(c))
            except: pass
            
        # For each category, find 5 highly rated books to use as "neural style-proxies"
        for cid in list(target_cats)[:10]: # Limit to 10 categories to avoid too many queries
            rows = conn.execute(
                "SELECT book_id FROM books WHERE categories LIKE ? ORDER BY rating_count DESC LIMIT 5",
                (f'%"{cid}"%',)
            ).fetchall()
            proxy_seeds.extend([str(r["book_id"]) for r in rows])
            
    all_seeds = list(set(interaction_ids + proxy_seeds))
    
    exclude  = {str(r["book_id"]) for r in conn.execute(
                "SELECT DISTINCT book_id FROM interactions WHERE user_id=?", (user_id,))}
    
    # ── Get LightGCN Recommendations ───────────────────────────────────
    book_ids = model.recommend(str(user_id), k=12, exclude_books=exclude, interaction_ids=all_seeds)

    # Model has no predictions yet (very few interactions, categories not built up)
    if not book_ids:
        conn.close()
        return {
            "recommendations": [],
            "reason": "Once you explore more books, we'll show personalized picks here!",
            "is_cold_start": False,
            "total_interactions": total_interactions,
            "top_categories": []
        }

    ph    = ",".join("?" * len(book_ids))
    books = conn.execute(f"SELECT * FROM books WHERE book_id IN ({ph})", book_ids).fetchall()
    top_c = model.get_user_top_categories(str(user_id))
    conn.close()
    bmap    = {b["book_id"]: dict(b) for b in books}
    ordered = [bmap[bid] for bid in book_ids if bid in bmap]
    return {
        "recommendations": ordered,
        "reason": "Based on your reading preferences",
        "is_cold_start": False,
        "total_interactions": total_interactions,
        "top_categories": top_c
    }

@app.get("/me/history")
def my_history(user_id: int = Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT i.*,b.title,b.author,b.cover_url FROM interactions i "
                        "LEFT JOIN books b ON i.book_id=b.book_id "
                        "WHERE i.user_id=? ORDER BY i.created_at DESC LIMIT 20", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/me/dashboard")
def my_dashboard(user_id: int = Depends(get_current_user)):
    """Full profile + recommendation explanation dashboard for the current user."""
    conn  = get_db()
    model = get_recommender()
    uid   = str(user_id)

    # ── Interaction counts ────────────────────────────────────────────
    total_clicks = conn.execute(
        "SELECT COUNT(*) FROM interactions WHERE user_id=? AND action='click'", (user_id,)
    ).fetchone()[0]
    total_ratings = conn.execute(
        "SELECT COUNT(*) FROM interactions WHERE user_id=? AND action='rate'", (user_id,)
    ).fetchone()[0]
    avg_given = conn.execute(
        "SELECT AVG(rating) FROM interactions WHERE user_id=? AND action='rate'", (user_id,)
    ).fetchone()[0]

    # ── Rated books (with book details) ──────────────────────────────
    rated_rows = conn.execute(
        "SELECT i.book_id, i.rating, i.review, i.created_at, "
        "b.title, b.author, b.cover_url, b.avg_rating "
        "FROM interactions i LEFT JOIN books b ON i.book_id=b.book_id "
        "WHERE i.user_id=? AND i.action='rate' ORDER BY i.created_at DESC LIMIT 20",
        (user_id,)
    ).fetchall()
    rated_books = [dict(r) for r in rated_rows]

    # ── Recent clicks ─────────────────────────────────────────────────
    click_rows = conn.execute(
        "SELECT i.book_id, i.created_at, b.title, b.author, b.cover_url "
        "FROM interactions i LEFT JOIN books b ON i.book_id=b.book_id "
        "WHERE i.user_id=? AND i.action='click' ORDER BY i.created_at DESC LIMIT 12",
        (user_id,)
    ).fetchall()
    recent_clicks = [dict(r) for r in click_rows]

    # ── Category counts from history (for candidate genre selection) ──────
    cat_counts = {}
    rows = conn.execute(
        "SELECT b.categories FROM interactions i JOIN books b ON i.book_id=b.book_id WHERE i.user_id=?", 
        (user_id,)
    ).fetchall()
    for row in rows:
        try:
            for cid in json.loads(row["categories"]):
                cat_counts[str(cid)] = cat_counts.get(str(cid), 0) + 1
        except: pass

    # ── Category preferences derived from Neural Centroids (True Style Mapping) ─────
    model = get_recommender()
    user_emb = None
    
    # Get recent interaction IDs
    recent_inter_ids = [str(r["book_id"]) for r in recent_clicks]
    rated_inter_ids = [str(r["book_id"]) for r in rated_books]
    all_all_ids = list(set(recent_inter_ids + rated_inter_ids))

    # 1. Get user embedding
    if uid in model.user_id_map:
        user_idx = model.user_id_map[uid]
        if user_idx < model.final_user_emb.size(0):
            user_emb = model.final_user_emb[user_idx]
            
    if user_emb is None and all_all_ids:
        # Aggregated embedding from history for new/unmapped users
        valid_indices = [model.book_id_map[bid] for bid in all_all_ids if bid in model.book_id_map]
        if valid_indices:
            user_emb = model.final_item_emb[valid_indices].mean(dim=0)
            
    neural_cat_results = []
    if user_emb is not None:
        # Use existing cat_counts to prioritize which genres to analyze neurally
        candidate_cids = list(cat_counts.keys())
        if not candidate_cids: # Fallback for extremely cold start
            candidate_cids = ["1", "2", "3", "4", "5"] 

        for cid in candidate_cids:
            # Find book indices for this category
            # (Note: In a high-traffic app, we'd pre-calculate these centroids)
            rows_cat = conn.execute("SELECT book_id FROM books WHERE categories LIKE ?", (f'%"{cid}"%',)).fetchall()
            bids = [str(r[0]) for r in rows_cat]
            idxs = [model.book_id_map[bid] for bid in bids if bid in model.book_id_map]
            
            if idxs:
                centroid = model.final_item_emb[idxs].mean(dim=0)
                # Compute cosine similarity
                sim = torch.cosine_similarity(user_emb.unsqueeze(0), centroid.unsqueeze(0)).item()
                # Similarity is [-1, 1], normalize for display
                affinity = max(0, sim)
                neural_cat_results.append((cid, affinity))

    # Sort by neural affinity
    sorted_cats = sorted(neural_cat_results, key=lambda x: x[1], reverse=True)[:10]
    total_affinity = sum(v for _, v in sorted_cats) or 0.001

    # Load category name map
    raw_cats = _load_json("category.json", "categories.json")
    cat_name_map = {str(c.get("category_id","")): (c.get("category_name") or c.get("name",""))
                    for r in [raw_cats] for c in r}

    cat_prefs = [
        {
            "category_id": cid,
            "name": cat_name_map.get(cid, "Category "+cid),
            "neural_affinity": round(score, 4),
            "pct": min(100, round(score / total_affinity * 100)) if total_affinity > 0 else 0
        }
        for cid, score in sorted_cats
    ]

    # ── Recommendation explanation ────────────────────────────────────
    is_cold = total_clicks + total_ratings == 0
    rec_explanation = {
        "algorithm": "LightGCN Neural Matrix Factorization",
        "profile_type": "Neural Signature (Style-Based)",
        "is_cold_start": is_cold,
        "total_interactions": total_clicks + total_ratings,
        "model_trained": model._is_fitted,
        "how_it_works": (
            "We use a Deep Neural Network (LightGCN) to map your reading style into a high-dimensional vector space. "
            "Your 'Top Picks' are generated by finding books that align with your neural signature."
            if not is_cold else
            "You haven't interacted with enough books yet. "
            "Explore more titles to activate your neural recommendation profile!"
        )
    }

    # ── Username lookup ───────────────────────────────────────────────
    uname_row = conn.execute("SELECT username FROM users WHERE id=?", (user_id,)).fetchone()
    uname = uname_row["username"] if uname_row else "User"

    conn.close()
    return {
        "username": uname,
        "stats": {
            "total_clicks":  total_clicks,
            "total_ratings": total_ratings,
            "avg_rating_given": round(avg_given, 2) if avg_given else None
        },
        "rated_books":    rated_books,
        "recent_clicks":  recent_clicks,
        "category_preferences": cat_prefs,
        "rec_explanation": rec_explanation
    }

@app.get("/debug")
def debug_info():
    """Open http://127.0.0.1:8000/debug to see server status."""
    conn = get_db()
    try:
        books_count   = conn.execute("SELECT COUNT(*) FROM books").fetchone()[0]
        users_count   = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        inter_count   = conn.execute("SELECT COUNT(*) FROM interactions").fetchone()[0]
        cols = [r[1] for r in conn.execute("PRAGMA table_info(interactions)").fetchall()]
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()
    m = get_recommender()
    return {
        "status": "ok",
        "books": books_count,
        "users": users_count,
        "interactions": inter_count,
        "interactions_columns": cols,
        "model_fitted": m._is_fitted,
        "endpoints": ["/me/dashboard", "/meta/authors", "/meta/categories",
                      "/meta/categories/map", "/meta/publishers",
                      "/books/browse", "/recommendations"]
    }

@app.get("/health")
def health():
    m = get_recommender()
    return {"status":"ok","model_loaded":m._is_fitted,"model_exists":MODEL_PATH.exists()}