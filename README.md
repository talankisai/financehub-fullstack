# Stock Market Dashboard

A modern, full-stack financial dashboard built with React, Express, and PostgreSQL. Features real-time stock data, currency exchange rates, market indices, and financial news.

## Features

- **Stock Market Data**: View real-time stock prices, market cap, and trading volumes
- **Currency Exchange**: Track major currency pairs with live exchange rates
- **Market Indices**: Monitor key market indicators like S&P 500, NASDAQ, and VIX
- **Financial News**: Stay updated with the latest financial news and market insights
- **User Favorites**: Save and track your preferred stocks and currencies
- **Admin Panel**: Manage market data and system settings
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI components
- TanStack Query for data fetching
- Wouter for routing
- Recharts for data visualization

**Backend:**
- Node.js with Express
- PostgreSQL database with Neon
- Drizzle ORM
- Passport.js for authentication
- WebSocket for real-time updates

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stock-market-dashboard.git
cd stock-market-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run check` - Type check TypeScript

## Project Structure

```
├── client/          # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/          # Backend Express server
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database operations
│   └── auth.ts      # Authentication logic
├── shared/          # Shared types and schemas
└── package.json     # Dependencies and scripts
```

## API Endpoints

- `GET /api/stocks` - Get all stocks
- `GET /api/currencies` - Get currency pairs
- `GET /api/market/indices` - Get market indices
- `GET /api/news` - Get financial news
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:id` - Remove from favorites

## Authentication

The application uses Replit Auth for user authentication. Users can log in to save favorites and access personalized features.

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and profiles
- `stocks` - Stock market data
- `currency_pairs` - Currency exchange rates
- `market_indices` - Market index data
- `news_articles` - Financial news articles
- `user_favorites` - User's saved items

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Deployment

### Replit (Recommended)
This project is optimized for Replit deployment with built-in PostgreSQL support.

### Manual Deployment
1. Build the project: `npm run build`
2. Set up a PostgreSQL database
3. Configure environment variables
4. Start the server: `npm start`

## Support

If you have any questions or issues, please open an issue on GitHub.