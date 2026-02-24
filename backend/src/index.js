require("dotenv").config();
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const axios = require("axios");
const db = require("./config/db");

// 1. Initialize App first
const app = express();
const server = http.createServer(app);
const port = 3001;

// 2. Import routes
const authRoutes = require("./routes/authRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const { updatePrices } = require("./controllers/tradeController");
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// 3. Middleware (Must come before routes)
app.use(cors({
    origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL
    ].filter(Boolean) // removes undefined if FRONTEND_URL isn't set yet
}));

// app.use(cors);
app.use(express.json()); // Essential for Login/Register to work

// 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);

// --- CONFIGURATION ---
const FINNHUB_API_KEY = process.env.finnhub_key;
const SYMBOLS = [
  "AAPL",
  "TSLA",
  "NVDA",
  "MSFT",
  "AMZN",
  "GOOGL",
  "META",
  "BINANCE:ETHUSDT",
];

const wss = new WebSocket.Server({ server });

let stocks = {};
SYMBOLS.forEach((symbol) => {
  stocks[symbol] = { name: symbol, price: 0 };
});

// --- BROADCAST LOGIC ---
function broadcastUpdate(symbol, price) {
  const update = { symbol, price: price.toFixed(2) };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });
}

// --- REAL MARKET DATA (FINNHUB) ---
function initRealMarketData() {
  if (FINNHUB_API_KEY.length < 5) return;

  // REST Initial Snapshot
  SYMBOLS.forEach(async (symbol) => {
    try {
      const res = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      );
      if (res.data?.c) {
        stocks[symbol].price = res.data.c;
        updatePrices(stocks);
        broadcastUpdate(symbol, res.data.c);
        console.log(`[REST OK] ${symbol}: ${res.data.c}`);
      }
    } catch (err) {
      console.error(`[REST ERR] ${symbol}:`, err.message);
    }
  });

  // WebSocket Stream
  const finnhubSocket = new WebSocket(
    `wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`,
  );

  finnhubSocket.on("open", () => {
    SYMBOLS.forEach((s) =>
      finnhubSocket.send(JSON.stringify({ type: "subscribe", symbol: s })),
    );
  });

  finnhubSocket.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === "trade") {
      msg.data.forEach((trade) => {
        if (stocks[trade.s]) {
          stocks[trade.s].price = trade.p;
          updatePrices(stocks);
          broadcastUpdate(trade.s, trade.p);
        }
      });
    }
  });

  finnhubSocket.on("error", (err) => {
    console.error("[Finnhub WS Error]", err.message);
  });
}

// Frontend WebSocket Connection
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "initial", data: stocks }));
});

async function startServer() {
  try {
    await db.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected");
    initRealMarketData();
    server.listen(port, () =>
      console.log(`🚀 Terminal Active: http://localhost:${port}`),
    );
  } catch (err) {
    console.error("❌ DB Fail:", err.message);
    process.exit(1);
  }
}

startServer();
