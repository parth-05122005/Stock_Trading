# ��� APEX TRADER — Stock Trade Simulator
# 🚀 [Live Demo](https://apex-trader-frontend.vercel.app)

A full-stack real-time stock trading simulator built with React, Node.js, PostgreSQL, and WebSockets. Practice trading with live market data from the Finnhub API without risking real money.

---

## ✨ Features

- ��� JWT-based user authentication (register/login)
- ��� Each new user starts with ₹1,00,000 virtual cash
- ��� Real-time stock prices via Finnhub API (REST polling every 15s)
- ��� Live price broadcasting to frontend via WebSockets
- ��� Buy and sell stocks with instant balance updates
- ��� Portfolio tracking with holdings and P&L per position
- ��� Protected routes — dashboard only accessible when logged in

---

LIVE LINK: https://apex-trader-frontend.vercel.app/

## ��� Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Lucide Icons |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Real-time | WebSockets (ws), Finnhub API |
| HTTP Client | Axios |

---

## ��� Project Structure

```
KITE/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # PostgreSQL pool connection
│   │   ├── controllers/
│   │   │   ├── authController.js  # Register & login logic
│   │   │   ├── tradeController.js # Buy & sell stock logic
│   │   │   └── portfolioController.js # Fetch user portfolio
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # JWT verification
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── tradeRoutes.js
│   │   │   └── portfolioRoutes.js
│   │   └── index.js               # Express app + WebSocket server
│   ├── .env                       # Environment variables (never commit)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── auth.jsx           # Axios calls to auth endpoints
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── hooks/
    │   │   └── useStocks.jsx      # WebSocket price hook
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── Dashboard.jsx
    │   ├── routes/
    │   │   └── AppRoutes.jsx
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL
- A free [Finnhub API key](https://finnhub.io/)

---

### 1. Database Setup

Open pgAdmin or psql and run:

```sql
CREATE DATABASE apex_trader;

\c apex_trader

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    balance NUMERIC(12, 2) DEFAULT 100000.00
);

CREATE TABLE holdings (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    stock_symbol VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    average_price NUMERIC(10, 2) NOT NULL,
    UNIQUE(account_id, stock_symbol)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    stock_symbol VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(4) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_long_random_secret_key
FINNHUB_API_KEY=your_finnhub_api_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Backend runs on `http://localhost:3001`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## ��� API Endpoints

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |

### Portfolio
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/portfolio` | Get balance and holdings | Yes |

### Trade
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/trade/buy` | Buy shares | Yes |
| POST | `/api/trade/sell` | Sell shares | Yes |

**Request body for buy/sell:**
```json
{
    "symbol": "AAPL",
    "quantity": 5
}
```

**Authorization header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## ��� Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | backend/.env | PostgreSQL password |
| `JWT_SECRET` | backend/.env | Secret key for signing JWTs |
| `FINNHUB_API_KEY` | backend/.env | Your Finnhub API key |
| `FRONTEND_URL` | backend/.env | Allowed CORS origin |
| `VITE_API_URL` | frontend/.env | Backend base URL |

---

## ��� WebSocket

The backend runs a WebSocket server on the same port as the REST API (`ws://localhost:3001`).

**On connection**, the server sends an initial price snapshot:
```json
{
    "type": "initial",
    "data": {
        "AAPL": { "name": "AAPL", "price": 273.53 },
        "TSLA": { "name": "TSLA", "price": 405.31 }
    }
}
```

**Live updates** are broadcast every 15 seconds:
```json
{ "symbol": "AAPL", "price": "274.12" }
```

---

## ��� Deployment Checklist

- [ ] Remove `NODE_TLS_REJECT_UNAUTHORIZED = '0'` from `index.js`
- [ ] Set all environment variables on your hosting platform
- [ ] Update `FRONTEND_URL` in backend `.env` to your real domain
- [ ] Update `VITE_API_URL` in frontend `.env` to your real backend URL
- [ ] Run `npm run build` in the frontend folder
- [ ] Use PM2 to manage the backend process: `pm2 start src/index.js --name apex-trader`
- [ ] Make sure `.env` files are in `.gitignore` and never committed

---

## ��� Testing with Thunder Client

1. **Register** — `POST http://localhost:3001/api/auth/register` with `{ "email": "...", "password": "..." }`
2. **Login** — `POST http://localhost:3001/api/auth/login` — copy the token from the response
3. **Portfolio** — `GET http://localhost:3001/api/portfolio` with `Authorization: Bearer <token>`
4. **Buy** — `POST http://localhost:3001/api/trade/buy` with token + `{ "symbol": "AAPL", "quantity": 2 }`
5. **Sell** — `POST http://localhost:3001/api/trade/sell` with token + `{ "symbol": "AAPL", "quantity": 1 }`

---

## ��� License

ISC
