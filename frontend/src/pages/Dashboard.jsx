import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStocks } from '../hooks/useStocks';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  LayoutDashboard,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { stocks, status } = useStocks(import.meta.env.VITE_WS_URL);

  const [balance, setBalance] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [tradeMessage, setTradeMessage] = useState(null); // { text, success }

  // Fetch real portfolio data on mount
  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        // Token is bad — log out and send back to login
        console.log('Token being sent:', token);
        return;
      }

      const data = await res.json();
      setBalance(data.balance);
      setHoldings(data.holdings ?? []); // ← fallback to empty array
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Show a temporary status message after a trade
  const showMessage = (text, success) => {
    setTradeMessage({ text, success });
    setTimeout(() => setTradeMessage(null), 3000);
  };

  const handleTrade = async (symbol, side) => {
    const quantityStr = window.prompt(
      `How many shares of ${symbol} do you want to ${side.toUpperCase()}?`
    );
    const quantity = parseInt(quantityStr);
    if (!quantity || quantity <= 0) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trade/${side}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, quantity })
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message, true);
        fetchPortfolio(); // Refresh balance + holdings after trade
      } else {
        showMessage(data.message, false);
      }
    } catch (err) {
      showMessage('Trade failed. Check your connection.', false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 font-inter">
      {/* --- NAVIGATION BAR --- */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-emerald-400" />
            <span className="text-xl font-black tracking-tighter text-white">APEX <span className="text-emerald-500">TRADER</span></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <span className={`h-2 w-2 rounded-full ${status.includes('✅') ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              {status}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* --- TRADE MESSAGE TOAST --- */}
        {tradeMessage && (
          <div className={`mb-6 px-5 py-3 rounded-xl text-sm font-semibold border ${tradeMessage.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
            {tradeMessage.text}
          </div>
        )}

        {/* --- TOP ROW: STATISTICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Wallet size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Available Cash</span>
            </div>
            <h3 className="text-3xl font-bold text-white">
              {balance === null ? '...' : `₹${parseFloat(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </h3>
            <p className="text-sm text-gray-500 mt-2">Buying Power Active</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Holdings</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{holdings.length}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {holdings.length === 0 ? 'No positions yet' : holdings.map(h => h.symbol).join(', ')}
            </p>
          </div>

          <div className="bg-gray-900 border border-emerald-500/20 p-6 rounded-2xl bg-gradient-to-br from-gray-900 to-emerald-950/20">
            <h4 className="text-emerald-400 font-bold mb-2">Welcome, {user?.email.split('@')[0]}</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your terminal is ready. Market data is streaming live via WebSockets.
            </p>
            <button className="mt-4 text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              View Analytics <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* --- MARKET SECTION --- */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Market Overview</h2>
            <p className="text-gray-500 text-sm">Real-time prices from Finnhub API</p>
          </div>
          <div className="text-xs text-gray-500 italic">Auto-refreshing...</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.keys(stocks).length > 0 ? (
            Object.entries(stocks).map(([symbol, price]) => (
              <StockCard
                key={symbol}
                symbol={symbol}
                price={price}
                onTrade={handleTrade}
              />
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-600">
              <RefreshCw className="animate-spin mb-4" size={40} />
              <p>Awaiting Market Feed...</p>
            </div>
          )}
        </div>

        {holdings.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-white mb-4">Your Holdings</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 uppercase text-xs tracking-wider">
                    <th className="text-left px-6 py-4">Symbol</th>
                    <th className="text-right px-6 py-4">Quantity</th>
                    <th className="text-right px-6 py-4">Avg. Buy Price</th>
                    <th className="text-right px-6 py-4">Current Price</th>
                    <th className="text-right px-6 py-4">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map(h => {
                    const currentPrice = parseFloat(stocks[h.symbol]) || 0;
                    const pnl = (currentPrice - h.avgPrice) * h.quantity;
                    const isProfit = pnl >= 0;
                    return (
                      <tr key={h.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{h.symbol}</td>
                        <td className="px-6 py-4 text-right text-gray-300">{h.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-300">₹{h.avgPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-gray-300">₹{currentPrice.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}₹{pnl.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Internal Sub-component for Stock Cards
const StockCard = ({ symbol, price, onTrade }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl hover:border-emerald-500/50 transition-all group shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors">{symbol}</h3>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Equity</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono font-bold text-white">₹{parseFloat(price).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onTrade(symbol, 'buy')}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold py-2 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10"
        >
          BUY
        </button>
        <button
          onClick={() => onTrade(symbol, 'sell')}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-xl text-sm border border-gray-700 transition-all"
        >
          SELL
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
