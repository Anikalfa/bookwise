import os
import json
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
from tqdm import tqdm
from collections import defaultdict

# --- CONFIG ---
DATA_FOLDER = r"E:\RokomariBG_Dataset"
METADATA_MAP = r"E:\bookwise\backend\book_metadata_map.json"
OUTPUT_MODEL = r"E:\bookwise\backend\lightgcn_model.pkl"

N_FACTORS = 64
N_LAYERS = 2
N_EPOCHS = 5
LR = 0.001
REG = 1e-4
BATCH_SIZE = 4096
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def load_json(path):
    print(f"Loading {path}...")
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def build_kg_graph():
    user_to_review = load_json(os.path.join(DATA_FOLDER, "user_to_review.json"))
    book_to_review = load_json(os.path.join(DATA_FOLDER, "book_to_review.json"))
    
    r2u = {str(x["review_id"]): str(x["user_id"]) for x in user_to_review}
    r2b = {str(x["review_id"]): str(x["book_id"]) for x in book_to_review}
    
    train_user_book = defaultdict(list)
    for rid, uid in r2u.items():
        if rid in r2b:
            train_user_book[uid].append(r2b[rid])
            
    with open(METADATA_MAP, 'r', encoding='utf-8') as f:
        metadata_map = json.load(f)
        
    user_ids = sorted(list(train_user_book.keys()))
    book_ids = sorted(list({b for books in train_user_book.values() for b in books}))
    
    cat_ids = sorted(list({str(m["category_id"]) for bid, m in metadata_map.items() if m.get("category_id") and bid in book_ids}))
    auth_ids = sorted(list({str(m["author_id"]) for bid, m in metadata_map.items() if m.get("author_id") and bid in book_ids}))
    
    print(f"Stats: {len(user_ids)} Users, {len(book_ids)} Books, {len(cat_ids)} Categories, {len(auth_ids)} Authors")
    
    u_map = {id: i for i, id in enumerate(user_ids)}
    b_map = {id: i for i, id in enumerate(book_ids)}
    c_map = {id: i for i, id in enumerate(cat_ids)}
    a_map = {id: i for i, id in enumerate(auth_ids)}
    
    U, B, C, A = len(user_ids), len(book_ids), len(cat_ids), len(auth_ids)
    N = U + B + C + A
    
    rows, cols = [], []
    for u, books in train_user_book.items():
        u_idx = u_map[u]
        for b in books:
            if b in b_map:
                b_idx = b_map[b]
                rows.append(u_idx); cols.append(U + b_idx)
                rows.append(U + b_idx); cols.append(u_idx)
            
    for b, meta in metadata_map.items():
        if b not in b_map: continue
        b_idx = b_map[b]
        cid, aid = str(meta.get("category_id", "")), str(meta.get("author_id", ""))
        if cid in c_map:
            c_idx = c_map[cid]
            rows.append(U + b_idx); cols.append(U + B + c_idx)
            rows.append(U + B + c_idx); cols.append(U + b_idx)
        if aid in a_map:
            a_idx = a_map[aid]
            rows.append(U + b_idx); cols.append(U + B + C + a_idx)
            rows.append(U + B + C + a_idx); cols.append(U + b_idx)

    edge_index = torch.tensor([rows, cols], dtype=torch.long, device=DEVICE)
    edge_values = torch.ones(edge_index.shape[1], device=DEVICE)
    
    # Normalizing
    print("Normalizing adjacency...")
    deg = torch.zeros(N, device=DEVICE)
    deg.scatter_add_(0, edge_index[0], edge_values)
    deg_inv_sqrt = torch.pow(deg, -0.5)
    deg_inv_sqrt[torch.isinf(deg_inv_sqrt)] = 0.0
    
    A_coo = torch.sparse_coo_tensor(edge_index, edge_values, (N, N), device=DEVICE).coalesce()
    r, c = A_coo.indices()
    v = A_coo.values()
    v_norm = v * deg_inv_sqrt[r] * deg_inv_sqrt[c]
    A_hat = torch.sparse_coo_tensor(torch.stack([r, c]), v_norm, (N, N), device=DEVICE).coalesce()
    
    return {
        "A_hat": A_hat, "u_map": u_map, "b_map": b_map, "c_map": c_map, "a_map": a_map,
        "n_users": U, "n_books": B, "n_cats": C, "n_auths": A,
        "book_ids": book_ids, "cat_ids": cat_ids, "train_user_book": train_user_book,
        "metadata_map": metadata_map # Added for export lookup
    }

class Model(nn.Module):
    def __init__(self, n_nodes, d, n_layers, A_hat):
        super().__init__()
        self.emb = nn.Embedding(n_nodes, d)
        nn.init.xavier_uniform_(self.emb.weight)
        self.A_hat = A_hat
        self.n_layers = n_layers
        
    def forward(self):
        embs = [self.emb.weight]
        x = self.emb.weight
        for _ in range(self.n_layers):
            x = torch.sparse.mm(self.A_hat, x)
            embs.append(x)
        return torch.stack(embs, dim=0).mean(dim=0)

def train():
    data = build_kg_graph()
    U_count, B_count = data["n_users"], data["n_books"]
    N = U_count + B_count + data["n_cats"] + data["n_auths"]
    
    model = Model(N, N_FACTORS, N_LAYERS, data["A_hat"]).to(DEVICE)
    optimizer = optim.Adam(model.parameters(), lr=LR)
    
    user_pos = {data["u_map"][u]: set(data["b_map"][b] for b in books if b in data["b_map"]) for u, books in data["train_user_book"].items()}
    u_list = list(user_pos.keys())
    
    print(f"Training on {DEVICE}...")
    for epoch in range(1, N_EPOCHS + 1):
        random.shuffle(u_list)
        pbar = tqdm(range(0, len(u_list), BATCH_SIZE), desc=f"Epoch {epoch}")
        for start in pbar:
            batch_u = u_list[start : start + BATCH_SIZE]
            if not batch_u: continue
            
            p_b, n_b = [], []
            for u in batch_u:
                p_b.append(random.choice(list(user_pos[u])))
                neg = random.randint(0, B_count - 1)
                while neg in user_pos[u]: neg = random.randint(0, B_count - 1)
                n_b.append(neg)
                
            u_t = torch.tensor(batch_u, device=DEVICE, dtype=torch.long)
            p_t = torch.tensor(p_b, device=DEVICE, dtype=torch.long) + U_count
            n_t = torch.tensor(n_b, device=DEVICE, dtype=torch.long) + U_count
            
            final_embs = model()
            u_e, p_e, n_e = final_embs[u_t], final_embs[p_t], final_embs[n_t]
            
            pos_scores = (u_e * p_e).sum(dim=1)
            neg_scores = (u_e * n_e).sum(dim=1)
            bpr_loss = -torch.log(torch.sigmoid(pos_scores - neg_scores) + 1e-12).mean()
            
            # Reg loss on raw embeddings
            u0, p0, n0 = model.emb(u_t), model.emb(p_t), model.emb(n_t)
            reg_loss = REG * (u0.norm(2).pow(2) + p0.norm(2).pow(2) + n0.norm(2).pow(2)).mean()
            
            loss = bpr_loss + reg_loss
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            pbar.set_postfix(loss=f"{loss.item():.4f}")

    # Final export
    print("Saving model weights...")
    model.eval()
    with torch.no_grad():
        final_embs = model().cpu()
        
    U, B, C = data["n_users"], data["n_books"], data["n_cats"]
    
    # NEW: Create fast lookup tensors for category boosting during inference
    metadata_map = data["metadata_map"]
    book_to_cat = torch.full((B,), -1, dtype=torch.long)
    for b_id, meta in metadata_map.items():
        if b_id in data["b_map"]:
            cid = str(meta.get("category_id", ""))
            if cid in data["c_map"]:
                book_to_cat[data["b_map"][b_id]] = data["c_map"][cid]

    save_data = {
        "user_id_map": data["u_map"], "book_id_map": data["b_map"], "cat_id_map": data["c_map"], "auth_id_map": data["a_map"],
        "book_ids": data["book_ids"], "cat_ids": data["cat_ids"],
        "final_user_emb": final_embs[:U], "final_item_emb": final_embs[U:U+B], 
        "final_cat_emb": final_embs[U+B:U+B+C], "final_auth_emb": final_embs[U+B+C:],
        "train_user_book": {u_idx: list(b_idxs) for u_idx, b_idxs in user_pos.items()},
        "book_to_cat": book_to_cat # Added for inference boosting
    }
    with open(OUTPUT_MODEL, 'wb') as f:
        pickle.dump(save_data, f)
    print(f"✅ Saved to {OUTPUT_MODEL}")

if __name__ == "__main__":
    train()
