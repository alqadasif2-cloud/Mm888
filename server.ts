import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const DATA_DIR = path.resolve(process.cwd(), 'data');
  const DATA_FILE = path.join(DATA_DIR, 'cloud_sync.json');

  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create data dir:', e);
    }
  }

  // Live Commodities & Gold/Silver/Oil Market Proxy
  app.get('/api/commodities', async (_req, res) => {
    try {
      const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
      const [silverRes, oilRes, goldRes] = await Promise.allSettled([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=5d', { headers }).then(r => r.json()),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d', { headers }).then(r => r.json()),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', { headers }).then(r => r.json()),
      ]);

      const results: Record<string, { price: number; high: number; low: number; change: number }> = {};

      if (silverRes.status === 'fulfilled' && silverRes.value?.chart?.result?.[0]?.meta) {
        const m = silverRes.value.chart.result[0].meta;
        results['XAGUSDm'] = {
          price: m.regularMarketPrice,
          high: m.regularMarketDayHigh || m.fiftyTwoWeekHigh || m.regularMarketPrice,
          low: m.regularMarketDayLow || m.fiftyTwoWeekLow || m.regularMarketPrice,
          change: m.regularMarketChangePercent || 0,
        };
      }

      if (oilRes.status === 'fulfilled' && oilRes.value?.chart?.result?.[0]?.meta) {
        const m = oilRes.value.chart.result[0].meta;
        results['USOILm'] = {
          price: m.regularMarketPrice,
          high: m.regularMarketDayHigh || m.fiftyTwoWeekHigh || m.regularMarketPrice,
          low: m.regularMarketDayLow || m.fiftyTwoWeekLow || m.regularMarketPrice,
          change: m.regularMarketChangePercent || 0,
        };
      }

      if (goldRes.status === 'fulfilled' && goldRes.value?.chart?.result?.[0]?.meta) {
        const m = goldRes.value.chart.result[0].meta;
        results['XAUUSDm'] = {
          price: m.regularMarketPrice,
          high: m.regularMarketDayHigh || m.fiftyTwoWeekHigh || m.regularMarketPrice,
          low: m.regularMarketDayLow || m.fiftyTwoWeekLow || m.regularMarketPrice,
          change: m.regularMarketChangePercent || 0,
        };
      }

      res.json(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  // Persistent Sync API
  app.get('/api/sync', (req, res) => {
    try {
      const clientId = (req.query.clientId as string) || 'default';
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const allData = JSON.parse(raw);
        if (allData[clientId]) {
          return res.json({ success: true, data: allData[clientId] });
        }
      }
      res.json({ success: true, data: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/sync', (req, res) => {
    try {
      const { clientId = 'default', accounts, positions, historyDeals } = req.body;
      let allData: Record<string, unknown> = {};
      if (fs.existsSync(DATA_FILE)) {
        try {
          allData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        } catch {
          allData = {};
        }
      }
      allData[clientId] = {
        accounts,
        positions,
        historyDeals,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(allData, null, 2), 'utf-8');
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MT5 Server running at http://localhost:${PORT}`);
  });
}

startServer();
