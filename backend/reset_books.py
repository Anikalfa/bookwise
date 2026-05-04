"""
reset_books.py
──────────────
Clears the books table and reloads it from books.json.
Run this once after placing books.json (and optionally authors.json)
in the same folder as this script.

Usage:
    python reset_books.py
"""

import sqlite3
import json
from pathlib import Path

DB_PATH       = Path(__file__).parent / "bookwise.db"
BOOKS_JSON    = Path(__file__).parent / "book.json"
AUTHORS_JSON  = Path(__file__).parent / "author.json"


def load_author_map():
    if not AUTHORS_JSON.exists():
        print("[*] author.json not found — author names will show as 'Author #<id>'")
        return {}
    with open(AUTHORS_JSON, "r", encoding="utf-8") as f:
        raw = json.load(f)
    author_map = {}
    if isinstance(raw, list):
        for a in raw:
            aid   = str(a.get("author_id", "")).strip()
            aname = (a.get("author_name") or a.get("name") or "").strip()
            if aid:
                author_map[aid] = aname
    elif isinstance(raw, dict):
        author_map = {str(k): v for k, v in raw.items()}
    print(f"[*] Loaded {len(author_map)} author names")
    return author_map


def run():
    if not BOOKS_JSON.exists():
        print(f"[ERROR] books.json not found at: {BOOKS_JSON}")
        print("  Please copy your books.json into the backend/ folder and re-run.")
        return

    author_map = load_author_map()

    with open(BOOKS_JSON, "r", encoding="utf-8") as f:
        raw_books = json.load(f)

    print(f"[*] Read {len(raw_books)} books from books.json")

    conn = sqlite3.connect(str(DB_PATH))

    # Wipe existing books (keeps user data / interactions intact)
    conn.execute("DELETE FROM books")
    conn.commit()
    print("[*] Cleared old books from database")

    books_data = []
    skipped = 0
    for b in raw_books:
        book_id = str(b.get("book_id", "")).strip()
        title   = (b.get("book_title") or "").strip()
        if not book_id or not title:
            skipped += 1
            continue

        author_id   = str(b.get("author_id", "")).strip()
        author      = author_map.get(author_id, f"Author #{author_id}" if author_id else "Unknown")
        cover_url   = "https://www.rokomari.com/files/200/images/Books/default_book_cover.jpg"
        description = (b.get("book_summary") or "").strip()
        avg_rating  = float(b.get("average_rating") or 0)
        rating_count= int(b.get("rating_count") or 0)
        category_id = str(b.get("category_id", "")).strip()
        categories  = json.dumps([category_id]) if category_id else "[]"
        pages       = b.get("book_pages")
        pages       = int(pages) if pages else None

        books_data.append((
            book_id, title, author, cover_url, description,
            avg_rating, rating_count, categories, None, pages
        ))

    conn.executemany(
        "INSERT OR IGNORE INTO books "
        "(book_id,title,author,cover_url,description,avg_rating,rating_count,categories,publication_year,pages) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        books_data
    )
    conn.commit()
    conn.close()

    print(f"[✓] Inserted {len(books_data)} books  (skipped {skipped} with missing id/title)")
    print("[✓] Done! Restart your FastAPI server and the site will show your books.")


if __name__ == "__main__":
    run()
