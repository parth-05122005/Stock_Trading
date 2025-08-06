const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const db = require('./src/config/db');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');

// Import controllers to share price data
const { updatePrices } = require('./src/controllers/tradeController');

const app = express();
const server = http.createServer(app);
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/portfolio', portfolioRoutes);

// WebSocket Server
const wss = new WebSocket.Server({ server });

let stocks = {
    "RELIANCE": { name: "Reliance Industries", price: 2850.00 },
    "TCS": { name: "Tata Consultancy Services", price: 3850.00 },
    "HDFCBANK": { name: "HDFC Bank Ltd", price: 1550.00 },
    "INFY": { name: "Infosys Ltd", price: 1450.00 }
};

function simulateStockUpdates() {
    setInterval(() => {
        for (const symbol in stocks) {
            const stock = stocks[symbol];
            const changePercent = (Math.random() * 2 - 1) * 0.01;
            stock.price = Math.max(500, stock.price + stock.price * changePercent);
            
            // Share the updated prices with the tradeController
            updatePrices(stocks);

            const update = { symbol: symbol, price: stock.price.toFixed(2) };
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(update));
                }
            });
        }
    }, 2000);
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.send(JSON.stringify({ type: 'initial', data: stocks }));
    ws.on('close', () => console.log('Client disconnected'));
});

async function startServer() {
    try {
        await db.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected successfully.');
        simulateStockUpdates();
        server.listen(port, () => {
            console.log(`🚀 Trading platform backend listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to the database.', error);
        process.exit(1);
    }
}

startServer();