"""
BookWise Python Recommender Bridge — LightGCN Edition.

Node.js spawns this process ONCE at startup. Commands are sent as
newline-delimited JSON to stdin; results are returned as newline-delimited
JSON to stdout.

Command shapes:
  {"action":"recommend",  "user_id":"...", "k":12, "exclude":["id1",...]}
  {"action":"update",     "user_id":"...", "book_id":"...", "categories":["c1",...]}
  {"action":"top_cats",   "user_id":"...", "k":3}
  {"action":"ping"}

Response shapes:
  {"result": [...]}   or   {"result": "ok"}   or   {"error": "..."}
"""

import sys
import json
import os
from typing import List, Set, Dict

# Import the upgraded model class from the and backend folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend"))
from recommender import LightGCNRecommender

def main():
    model_path = os.environ.get("MODEL_PATH", "../backend/lightgcn_model.pkl")
    
    # Use the upgraded class
    model = LightGCNRecommender()
    sys.stderr.write(f"[recommender.py] Loading model from {model_path}...\n")
    if not model.load(model_path):
        sys.stderr.write("[recommender.py] ERROR: Model failed to load.\n")
        sys.stderr.flush()
        # Still signal ready but in error state
    
    # Signal ready to Node.js
    sys.stderr.flush()
    print(json.dumps({"result": "ready"}), flush=True)

    for raw_line in sys.stdin:
        raw_line = raw_line.strip()
        if not raw_line:
            continue
        try:
            cmd = json.loads(raw_line)
            action = cmd.get("action")

            if action == "ping":
                print(json.dumps({"result": "pong"}), flush=True)

            elif action == "recommend":
                result = model.recommend(
                    user_id=cmd["user_id"],
                    k=cmd.get("k", 12),
                    exclude_books=set(cmd.get("exclude", [])),
                    interaction_ids=cmd.get("interaction_ids", cmd.get("item_ids", [])),
                    interaction_cat_ids=cmd.get("interaction_cat_ids", cmd.get("category_ids", [])),
                    target_cat_id=cmd.get("target_cat_id")
                )
                print(json.dumps({"result": result}), flush=True)

            elif action == "top_cats":
                result = model.get_user_top_categories(cmd["user_id"], k=cmd.get("k", 3))
                # Map to just IDs for the legacy bridge expectation if needed
                cat_ids = [c["category_id"] for c in result]
                print(json.dumps({"result": cat_ids}), flush=True)

            elif action == "update":
                # Logic handled in-memory if needed, but usually just a no-op for trained models
                print(json.dumps({"result": "ok"}), flush=True)

            elif action == "check_user":
                u_id = str(cmd["user_id"])
                is_trained = u_id in model.user_id_map
                print(json.dumps({"result": "trained" if is_trained else "dynamic"}), flush=True)

            else:
                print(json.dumps({"error": f"Unknown action: {action}"}), flush=True)

        except Exception as e:
            sys.stderr.write(f"[recommender.py] Runtime Error: {e}\n")
            import traceback
            traceback.print_exc(file=sys.stderr)
            sys.stderr.flush()
            print(json.dumps({"error": str(e)}), flush=True)

if __name__ == "__main__":
    main()
