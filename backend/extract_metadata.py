import json
import os
from tqdm import tqdm

BOOK_JSON = r"E:\bookwise\backend\book.json"
OUTPUT_JSON = r"E:\bookwise\backend\book_metadata_map.json"

def extract_metadata():
    print(f"Reading {BOOK_JSON}...")
    
    # Using a simple parser for the array of objects structure
    # Since it might be huge, we'll try to load it normally first, if it fails we'll switch to ijson
    try:
        with open(BOOK_JSON, 'r', encoding='utf-8') as f:
            books = json.load(f)
    except MemoryError:
        print("Memory limit reached with json.load. Please ensure you have enough RAM.")
        return

    metadata_map = {}
    
    print("Extracting mappings...")
    for book in tqdm(books):
        bid = str(book.get("book_id"))
        if not bid: continue
        
        metadata_map[bid] = {
            "category_id": str(book.get("category_id")),
            "author_id": str(book.get("author_id")),
            "publisher_id": str(book.get("publisher_id"))
        }

    print(f"Saving mappings for {len(metadata_map)} books to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(metadata_map, f)
    
    print("✅ Done!")

if __name__ == "__main__":
    extract_metadata()
