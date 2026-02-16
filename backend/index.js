const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');
const db = require('./src/config/db');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const { updatePrices } = require('./src/controllers/tradeController');

const app = express();
const server = http.createServer(app);
const port = 3001;

// --- CONFIGURATION ---
// IMPORTANT: Ensure your key is pasted here correctly.
const FINNHUB_API_KEY = 'd69keapr01qm5rv48bq0d69keapr01qm5rv48bqg'; 

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META','BINANCE:ETHUSDT'];

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/portfolio', portfolioRoutes);

const wss = new WebSocket.Server({ server });

let stocks = {};
SYMBOLS.forEach(symbol => {
    stocks[symbol] = { name: symbol, price: 0 }; 
});

// --- HELPER: Broadcast to Frontend ---
function broadcastUpdate(symbol, price) {
    const update = {
        symbol: symbol,
        price: price.toFixed(2)
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
        }
    });
}

// --- REAL MARKET DATA LOGIC ---
function initRealMarketData() {
    const keyPrefix = FINNHUB_API_KEY ? FINNHUB_API_KEY.substring(0, 4) : "NONE";
    console.log(`DEBUG: Using API Key starting with: [${keyPrefix}...]`);

    if (FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY_HERE' || FINNHUB_API_KEY.length < 5) {
        console.error('❌ ERROR: API Key missing or placeholder detected.');
        return;
    }

    // 1. Initial REST Fetch (Current Snapshot)
    SYMBOLS.forEach(async (symbol) => {
        try {
            const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
            if (response.data && response.data.c) {
                stocks[symbol].price = response.data.c;
                updatePrices(stocks);
                console.log(`[REST] ${symbol} current: $${response.data.c}`);
            }
        } catch (error) {
            console.error(`[REST ERROR] ${symbol}: ${error.message}`);
        }
    });

    // 2. WebSocket for Continuous Price Streams
    const finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

    finnhubSocket.on('open', () => {
        console.log('✅ WS: Connected to Finnhub. Sending subscriptions...');
        SYMBOLS.forEach(symbol => {
            // Log that we are sending the request
            console.log(`📤 Subscribing to: ${symbol}`);
            finnhubSocket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
        });
    });

    finnhubSocket.on('message', (data) => {
        // Convert Buffer to String then Parse
        const message = JSON.parse(data.toString());
        
        // If we receive a ping, the connection is definitely alive
        if (message.type === 'ping') {
            return; // We skip logging pings to keep the console clean
        }

        // --- NEW: Log everything to see the data flow ---
        console.log('📥 Incoming MSG:', JSON.stringify(message));

        if (message.type === 'trade') {
            message.data.forEach(trade => {
                const symbol = trade.s;
                const newPrice = trade.p;
                if (stocks[symbol]) {
                    stocks[symbol].price = newPrice;
                    updatePrices(stocks); 
                    broadcastUpdate(symbol, newPrice);
                }
            });
        }
    });

    finnhubSocket.on('error', (err) => {
        console.error('❌ WS Connection Error:', err.message);
    });

    finnhubSocket.on('close', () => {
        console.log('🔄 WS: Connection closed. Retrying in 15s...');
        setTimeout(initRealMarketData, 15000);
    });
}

// Frontend connections
wss.on('connection', (ws) => {
    console.log('💻 Frontend client connected via WebSocket');
    ws.send(JSON.stringify({ type: 'initial', data: stocks }));
});

async function startServer() {
    try {
        await db.query('SELECT NOW()');
        console.log('✅ PostgreSQL Database Connected.');
        initRealMarketData();
        server.listen(port, () => {
            console.log(`🚀 Trading Server active at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

startServer();