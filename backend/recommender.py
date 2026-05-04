import pickle
import os
import torch
import torch.nn as nn
import random
from typing import List, Set, Dict, Optional
from collections import defaultdict

class KnowledgeAwareLightGCN:
    """
    Upgraded LightGCN that incorporates Categories, Authors, and Publishers
    as semantic nodes in a heterogeneous graph.
    """

    def __init__(self):
        self.user_id_map = {}
        self.book_id_map = {}
        self.cat_id_map = {}
        self.auth_id_map = {}
        self.pub_id_map = {}
        
        self.book_ids = []
        self.cat_ids = []
        self.auth_ids = []
        self.pub_ids = []
        
        self.final_user_emb = None
        self.final_item_emb = None
        self.final_cat_emb = None
        self.final_auth_emb = None
        
        self.train_user_book = {} # user_idx -> [book_idx, ...]
        self.book_to_cat = None
        self._is_fitted = False

    def load(self, path: str):
        if not os.path.exists(path):
            print(f"[KG-LightGCN] Error: Model not found at {path}")
            return False
            
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
            
            self.user_id_map = data["user_id_map"]
            self.book_id_map = data["book_id_map"]
            self.book_ids = data["book_ids"]
            
            self.cat_id_map = data.get("cat_id_map", {})
            self.auth_id_map = data.get("auth_id_map", {})
            self.pub_id_map = data.get("pub_id_map", {})
            
            self.cat_ids = data.get("cat_ids", [])
            self.auth_ids = data.get("auth_ids", [])
            
            self.final_user_emb = data["final_user_emb"]
            self.final_item_emb = data["final_item_emb"]
            self.final_cat_emb = data.get("final_cat_emb")
            self.final_auth_emb = data.get("final_auth_emb")
            
            self.train_user_book = data.get("train_user_book", {})
            self.book_to_cat = data.get("book_to_cat")
            self._is_fitted = True
            
            print(f"[KG-LightGCN] Model loaded. Users: {len(self.user_id_map)}, Books: {len(self.book_ids)}, Categories: {len(self.cat_id_map)}")
            return True
        except Exception as e:
            print(f"[KG-LightGCN] Failed to load model: {e}")
            import traceback
            traceback.print_exc()
            return False

    def recommend(self, user_id: str, k: int = 12, exclude_books: Set[str] = None, 
                  interaction_ids: List[str] = None, interaction_cat_ids: List[str] = None,
                  target_cat_id: str = None) -> List[str]:
        """
        Main recommendation logic with Category Boosting.
        """
        if not self._is_fitted: return []
        
        user_id = str(user_id)
        user_emb = None
        
        # 1. Base Embedding from trained user node
        if user_id in self.user_id_map:
            u_idx = self.user_id_map[user_id]
            user_emb = self.final_user_emb[u_idx]
            
        # 2. Hybrid Boost: Blend with real-time interaction embeddings
        if interaction_ids:
            valid_indices = [self.book_id_map[bid] for bid in interaction_ids if bid in self.book_id_map]
            if valid_indices:
                interacted_embs = self.final_item_emb[valid_indices]
                recent_profile = interacted_embs.mean(dim=0)
                if user_emb is not None:
                    user_emb = (user_emb + recent_profile) / 2
                else:
                    user_emb = recent_profile
                    
        if user_emb is None: return []

        # 3. Neural Scoring (Base Scores)
        scores = torch.mv(self.final_item_emb, user_emb)
        
        # 4. Neural Category & Author Boosting (Frequency Aware)
        # We want to boost categories based on how often the user interacts with them
        interaction_cat_ids = interaction_cat_ids or []
        active_cats = defaultdict(int)
        for cid in interaction_cat_ids: active_cats[str(cid)] += 1
        if target_cat_id: active_cats[str(target_cat_id)] += 5 # High weight for UI filter
        
        # 4. Neural Category Partitioning (Strict Relevance)
        # Instead of just boosting, we strictly separate books into RELEVANT and GENERAL
        active_cats = defaultdict(int)
        for cid in (interaction_cat_ids or []): active_cats[str(cid)] += 1
        if target_cat_id: active_cats[str(target_cat_id)] += 5
        
        relevant_indices = []
        general_indices = []
        
        if active_cats and self.book_to_cat is not None:
            # Identitfy category indices for user interests
            interest_cat_idxs = {self.cat_id_map[cid] for cid in active_cats if cid in self.cat_id_map}
            
            if interest_cat_idxs:
                # Optimized separation using boolean indexing
                cat_indices = self.book_to_cat
                is_relevant = torch.zeros(len(cat_indices), dtype=torch.bool)
                for c_idx in interest_cat_idxs:
                    is_relevant = is_relevant | (cat_indices == c_idx)
                
                # Separate indices
                all_indices = torch.arange(len(scores))
                relevant_indices = all_indices[is_relevant]
                general_indices = all_indices[~is_relevant]
                
                # Assign extremely high base scores to relevant items to force them to the top
                # (Neural similarity still determines rank within the relevant group)
                scores[is_relevant] += 1000.0
                # Subtract baseline from irrelevant ones to push them down
                scores[~is_relevant] -= 1000.0
        
        # 5. Masking
        scores = scores.clone()
        if exclude_books:
            for bid in exclude_books:
                if bid in self.book_id_map:
                    idx = self.book_id_map[bid]
                    if idx < len(scores): scores[idx] -= 2000.0
                    
        # 6. Final Results with Dynamic Variety Shuffle
        # We find a larger candidate pool
        pool_size = min(k * 5, len(scores))
        
        # Add a tiny bit of random noise to scores to prevent "stuck" order on identical matches
        # but keep it small enough that it doesn't break true relevance
        noise = torch.randn_like(scores) * 0.01 
        scores = scores + noise
        
        _, top_indices = torch.topk(scores, pool_size)
        
        all_candidates = []
        for idx in top_indices.tolist():
            if scores[idx] > -500.0:
                all_candidates.append(str(self.book_ids[idx]))
                
        if not all_candidates: return []

        # DYNAMIC VARIETY: Strictly relevant Top 3
        # 1. Take the absolute top 3 and lock them in place (Strict Relevance)
        locked = all_candidates[:3]
        
        # 2. Shuffle everything else from the rest of the pool (Diversity/Discovery)
        remaining_pool = all_candidates[3:]
        random.shuffle(remaining_pool)
        
        return (locked + remaining_pool)[:k]

    def get_user_top_categories(self, user_id: str, k: int = 3) -> List[dict]:
        if not self._is_fitted or self.final_cat_emb is None:
            return []
            
        user_id = str(user_id)
        if user_id not in self.user_id_map:
            return []
            
        user_idx = self.user_id_map[user_id]
        user_emb = self.final_user_emb[user_idx]
        
        cat_scores = torch.mv(self.final_cat_emb, user_emb)
        vals, idxs = torch.topk(cat_scores, min(k, len(self.cat_ids)))
        
        results = []
        for i in range(len(idxs)):
            cat_idx = idxs[i].item()
            results.append({
                "category_id": self.cat_ids[cat_idx],
                "score": float(vals[i].item())
            })
        return results

    def update_user_preference(self, user_id: str, book_id: str, categories: List[str]):
        pass

LightGCNRecommender = KnowledgeAwareLightGCN
