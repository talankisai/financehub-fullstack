import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Market data routes
  app.get('/api/market/indices', async (req, res) => {
    try {
      const indices = await storage.getMarketIndices();
      res.json(indices);
    } catch (error) {
      console.error("Error fetching market indices:", error);
      res.status(500).json({ message: "Failed to fetch market indices" });
    }
  });

  // Stock routes
  app.get('/api/stocks', async (req, res) => {
    try {
      const stocks = await storage.getStocks();
      res.json(stocks);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  app.get('/api/stocks/:id', async (req, res) => {
    try {
      const stock = await storage.getStock(parseInt(req.params.id));
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // Currency routes
  app.get('/api/currencies', async (req, res) => {
    try {
      const pairs = await storage.getCurrencyPairs();
      res.json(pairs);
    } catch (error) {
      console.error("Error fetching currency pairs:", error);
      res.status(500).json({ message: "Failed to fetch currency pairs" });
    }
  });

  app.put('/api/currencies/:symbol/margin', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { margin } = req.body;
      if (typeof margin !== 'number' || margin < 0) {
        return res.status(400).json({ message: "Invalid margin value" });
      }

      await storage.updateCurrencyMargin(req.params.symbol, margin);
      res.json({ message: "Margin updated successfully" });
    } catch (error) {
      console.error("Error updating currency margin:", error);
      res.status(500).json({ message: "Failed to update currency margin" });
    }
  });

  // News routes
  app.get('/api/news', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const news = await storage.getNewsArticles(limit);
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Favorites routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemType, itemId } = req.body;
      
      if (!itemType || !itemId) {
        return res.status(400).json({ message: "itemType and itemId are required" });
      }

      const favorite = await storage.addUserFavorite({
        userId,
        itemType,
        itemId,
      });
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:itemType/:itemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemType, itemId } = req.params;
      
      await storage.removeUserFavorite(userId, itemType, itemId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // For demo purposes, return mock user data
      const mockUsers = [
        { id: '1', name: 'John Trader', email: 'john.trader@company.com', role: 'Regular User' },
        { id: '2', name: 'Sarah Admin', email: 'sarah.admin@company.com', role: 'Administrator' },
        { id: '3', name: 'Mike Analyst', email: 'mike.analyst@company.com', role: 'Premium User' },
      ];
      res.json(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    // Send initial data
    const sendMarketUpdate = async () => {
      try {
        const [stocks, currencies, indices, news] = await Promise.all([
          storage.getStocks(),
          storage.getCurrencyPairs(),
          storage.getMarketIndices(),
          storage.getNewsArticles(10),
        ]);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'market_update',
            data: {
              stocks,
              currencies,
              indices,
              news,
              timestamp: new Date().toISOString(),
            },
          }));
        }
      } catch (error) {
        console.error('Error sending market update:', error);
      }
    };

    // Send initial update
    sendMarketUpdate();

    // Set up periodic updates (every 4 seconds as per requirements)
    const updateInterval = setInterval(sendMarketUpdate, 4000);

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clearInterval(updateInterval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(updateInterval);
    });
  });

  // Initialize sample data
  initializeSampleData();

  return httpServer;
}

// Initialize sample data for demonstration
async function initializeSampleData() {
  try {
    // Sample market indices
    const sampleIndices = [
      { name: 'S&P 500', symbol: 'SPX', value: '4547.38', change: '54.23', changePercent: '1.20' },
      { name: 'NASDAQ', symbol: 'IXIC', value: '14221.71', change: '-71.23', changePercent: '-0.50' },
      { name: 'DOW JONES', symbol: 'DJI', value: '35630.68', change: '280.15', changePercent: '0.80' },
      { name: 'VIX', symbol: 'VIX', value: '18.42', change: '0.02', changePercent: '0.10' },
    ];

    for (const index of sampleIndices) {
      await storage.upsertMarketIndex(index);
    }

    // Sample stocks
    const sampleStocks = [
      {
        symbol: 'AAPL',
        company: 'Apple Inc.',
        price: '175.43',
        change: '3.64',
        changePercent: '2.10',
        volume: '47.2M',
        marketCap: '$2.75T',
        peRatio: '28.5',
        high52: '199.62',
        low52: '124.17',
      },
      {
        symbol: 'MSFT',
        company: 'Microsoft Corp.',
        price: '378.85',
        change: '-2.15',
        changePercent: '-0.60',
        volume: '23.1M',
        marketCap: '$2.81T',
        peRatio: '32.1',
        high52: '384.30',
        low52: '212.43',
      },
      {
        symbol: 'GOOGL',
        company: 'Alphabet Inc.',
        price: '2847.63',
        change: '-22.41',
        changePercent: '-0.80',
        volume: '18.9M',
        marketCap: '$1.84T',
        peRatio: '25.8',
        high52: '2950.10',
        low52: '2193.62',
      },
      {
        symbol: 'TSLA',
        company: 'Tesla Inc.',
        price: '248.91',
        change: '12.34',
        changePercent: '5.20',
        volume: '62.7M',
        marketCap: '$789B',
        peRatio: '78.2',
        high52: '299.29',
        low52: '138.80',
      },
      {
        symbol: 'NVDA',
        company: 'NVIDIA Corp.',
        price: '452.28',
        change: '8.92',
        changePercent: '2.00',
        volume: '34.5M',
        marketCap: '$1.12T',
        peRatio: '65.4',
        high52: '502.66',
        low52: '180.68',
      },
    ];

    for (const stock of sampleStocks) {
      await storage.upsertStock(stock);
    }

    // Sample currency pairs
    const sampleCurrencies = [
      {
        symbol: 'EUR/USD',
        base: 'EUR',
        quote: 'USD',
        rate: '1.084200',
        change: '0.001300',
        changePercent: '0.12',
        margin: '0.25',
      },
      {
        symbol: 'GBP/USD',
        base: 'GBP',
        quote: 'USD',
        rate: '1.215600',
        change: '-0.000973',
        changePercent: '-0.08',
        margin: '0.30',
      },
      {
        symbol: 'USD/JPY',
        base: 'USD',
        quote: 'JPY',
        rate: '149.850000',
        change: '0.360000',
        changePercent: '0.24',
        margin: '0.20',
      },
      {
        symbol: 'AUD/USD',
        base: 'AUD',
        quote: 'USD',
        rate: '0.645500',
        change: '-0.000968',
        changePercent: '-0.15',
        margin: '0.35',
      },
    ];

    for (const currency of sampleCurrencies) {
      await storage.upsertCurrencyPair(currency);
    }

    // Sample news articles
    const sampleNews = [
      {
        title: 'Fed Signals Potential Rate Cuts in 2024 as Inflation Shows Signs of Cooling',
        summary: 'Federal Reserve officials hint at possible interest rate reductions next year as consumer price index shows encouraging downward trend...',
        content: 'Full article content here...',
        source: 'Reuters',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: 'Tech Stocks Rally as AI Sector Continues Strong Performance',
        summary: 'Major technology companies see significant gains as artificial intelligence investments drive market confidence and quarterly earnings exceed expectations...',
        content: 'Full article content here...',
        source: 'MarketWatch',
        imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        title: 'Oil Prices Surge on OPEC+ Production Cut Announcement',
        summary: 'Crude oil futures jump 3% following OPEC+ decision to extend production cuts through Q2 2024, supporting global energy market stability...',
        content: 'Full article content here...',
        source: 'Bloomberg',
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        title: 'Major Banks Report Strong Q4 Earnings Amid Rising Interest Rates',
        summary: 'Leading financial institutions benefit from higher net interest margins, with several banks beating analyst expectations for fourth quarter performance...',
        content: 'Full article content here...',
        source: 'Financial Times',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=150',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
    ];

    for (const article of sampleNews) {
      await storage.upsertNewsArticle(article);
    }

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}
