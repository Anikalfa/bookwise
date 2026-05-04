<div align="center">

# 📚 BookWise

### An AI-Powered Personalized Book Recommendation Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![LightGCN](https://img.shields.io/badge/LightGCN-Neural_AI-FF6B6B?style=for-the-badge&logo=pytorch&logoColor=white)](https://arxiv.org/abs/2002.02126)

</div>

---

## 🎬 Demo

https://github.com/Anikalfa/bookwise/blob/main/demo/demo.mp4

> *Live walkthrough of BookWise — personalized recommendations, user profiling, and real-time AI inference.*

---

## ✨ Features

- 🧠 **Neural Recommendations** — LightGCN graph-based collaborative filtering model trained on real book interaction data
- 🔥 **Cold-Start Handling** — Category-weighted neural boosting for new users with no prior history
- 🎯 **Personalized Carousels** — Dynamic "Top Picks", "Trending", and category-based shelves updated in real-time
- 👤 **User Profiles & History** — Track unique book views, reading activity, and personalized dashboards
- 🔍 **Smart Search & Filtering** — Browse by category, author, rating, and publication year
- 📱 **Responsive UI** — Fully responsive with dark-mode aesthetics and smooth Framer Motion animations
- 🔐 **Authentication** — JWT-based session management with secure login/register flows
- ⚡ **AI Fallback System** — Multi-model routing with automatic fallback to prevent service interruption

---

## 🏗️ Architecture

```
bookwise/
├── frontend_react/          # React 19 + Vite + TailwindCSS frontend
│   └── src/
│       ├── components/      # UI components (Navbar, Carousel, Drawer, etc.)
│       ├── context/         # Global AppContext for state management
│       └── App.jsx          # Root app with routing
│
├── backend_node/            # Node.js + Express REST API
│   └── src/
│       ├── routes/          # Auth, Books, Profile, Recommendations, Meta
│       ├── models/          # Mongoose schemas (User, Book)
│       ├── services/        # AI proxy & recommendation bridge
│       └── app.js           # Express server entry point
│
├── backend/                 # Python FastAPI — AI Inference Server
│   ├── main.py              # FastAPI app with recommendation endpoints
│   ├── recommender.py       # LightGCN inference logic
│   ├── train_kg_lightgcn.py # Model training script
│   └── lightgcn_model.pkl   # Trained model (not included — see setup)
│
└── model_training/          # Standalone model training utilities
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TailwindCSS 4, Framer Motion, Recharts |
| **Backend API** | Node.js, Express.js, Mongoose |
| **AI Server** | Python, FastAPI, Uvicorn |
| **ML Model** | LightGCN (Graph Neural Network), PyTorch |
| **Database** | MongoDB (Atlas), SQLite (local dev) |
| **Auth** | JWT, UUID session tokens |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- MongoDB Atlas account (or local MongoDB)
- PyTorch (CPU or CUDA)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Anikalfa/bookwise.git
cd bookwise
```

---

### 2. Python AI Server Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

> ⚠️ **Note:** The trained model file (`lightgcn_model.pkl`) and book data (`book.json`) are not included due to file size. You can retrain the model using:
> ```bash
> python train_kg_lightgcn.py
> ```

Start the AI server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 3. Node.js Backend Setup

```bash
cd backend_node
npm install
```

Create a `.env` file in `backend_node/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AI_SERVER_URL=http://localhost:8000
```

Start the backend:

```bash
npm run dev
```

---

### 4. Frontend Setup

```bash
cd frontend_react
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🧠 How the AI Works

BookWise uses **LightGCN** (Light Graph Convolutional Network), a state-of-the-art collaborative filtering model:

1. **Graph Construction** — User-book interactions are modeled as a bipartite graph
2. **Message Passing** — LightGCN propagates embeddings across the graph without feature transformation
3. **Personalization** — Each user gets a unique embedding vector that captures their reading preferences
4. **Category Boosting** — For cold-start users, category-level neural embeddings are weighted to ensure relevant recommendations
5. **Real-time Inference** — The Python FastAPI server performs sub-second inference and returns ranked book lists

---

## 📸 Screenshots

> _Coming soon_

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by [Md. Anik Chowdhury](https://github.com/Anikalfa)

</div>
