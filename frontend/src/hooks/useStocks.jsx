// Create a Custom Hook to manage the stock updates. This keeps your UI components clean of messy "socket" logic.
import { useEffect, useState } from 'react';

export const useStocks = (url) => {
  const [stocks, setStocks] = useState({});
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('✅ Connected');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'initial') {
        const prices = {};
        for (const sym in data.data) prices[sym] = data.data[sym].price;
        setStocks(prices);
      } else {
        setStocks(prev => ({ ...prev, [data.symbol]: data.price }));
      }
    };
    ws.onerror = () => setStatus('❌ Connection Error');
    ws.onclose = () => setStatus('🔴 Disconnected');

    return () => ws.close(); // Cleanup on unmount
  }, [url]);

  return { stocks, status };
};