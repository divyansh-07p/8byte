# Portfolio Dashboard

A dynamic portfolio dashboard built with Next.js, React, TypeScript, and Tailwind CSS. Displays portfolio holdings with real-time market data from Yahoo Finance (CMP) and Google Finance (P/E Ratio, Latest Earnings).

## Features

- **Portfolio Management**: View holdings grouped by sector with calculated metrics
- **Real-time Market Data**: Fetches CMP from Yahoo Finance, P/E and Earnings from Google Finance
- **Auto-refresh**: Market data updates automatically every 15 seconds
- **Sector Grouping**: Holdings organized by sector with sector-level summaries
- **Visual Indicators**: Color-coded gain/loss (green/red) with percentage changes
- **Dashboard Summary**: Total investment, current value, total gain/loss, portfolio return %
- **Responsive Design**: Works on desktop and mobile with horizontal scrolling table
- **Error Handling**: Graceful degradation when external APIs fail
- **Caching**: In-memory caching with TTL to reduce external API calls
- **Type Safety**: Full TypeScript coverage with strict types

## Tech Stack

- **Framework**: Next.js 15 (App Router) - `next@16.3.8`
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: Native fetch with Next.js caching
- **External APIs**: 
  - Yahoo Finance (via `yahoo-finance2` npm package - community maintained)
  - Google Finance (unofficial): `https://www.google.com/finance/quote/`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── portfolio/route.ts      # Portfolio summary API
│   │   └── market-data/route.ts    # Market data API
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main dashboard page
├── components/
│   ├── DashboardSummary.tsx        # Summary cards component
│   └── PortfolioTable.tsx          # Sector-grouped holdings table
├── hooks/
│   └── usePortfolio.ts             # Custom hooks for data fetching
├── lib/
│   ├── csv-parser.ts               # CSV parsing utilities
│   ├── formatters.ts               # Currency, number, percentage formatting
│   └── portfolio-data.ts           # Initial portfolio data
├── services/
│   ├── cache.ts                    # In-memory cache with TTL
│   ├── yahooFinance.ts             # Yahoo Finance service (uses yahoo-finance2)
│   ├── googleFinance.ts            # Google Finance service
│   └── portfolio.ts                # Portfolio calculations
└── types/
    └── portfolio.ts                # TypeScript interfaces
```

## Installation

```bash
# Navigate to project directory
cd portfolio-dashboard

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` (no required variables currently):

```bash
cp .env.example .env.local
```

## How Market Data is Obtained

### Yahoo Finance (CMP - Current Market Price)
- **Library**: `yahoo-finance2` (community-maintained npm package)
- **Data**: Regular market price, change, market cap
- **Rate Limit**: No official limits; respectful usage with caching
- **Symbols**: NSE symbols use `.NS` suffix, BSE symbols use `.BO` suffix

### Google Finance (P/E Ratio, Latest Earnings)
- **Endpoint**: `https://www.google.com/finance/quote/NSE:SYMBOL` or `BSE:SYMBOL`
- **Method**: HTML scraping (no official API available)
- **Data**: P/E ratio (TTM), EPS (earnings per share)
- **Rate Limit**: No official limits; requests throttled at 100-300ms intervals with jitter
- **Parsing**: Regex-based extraction from HTML response

## Yahoo Finance Limitations

1. **Unofficial API**: Not officially supported by Yahoo; may change without notice
2. **Rate Limits**: Undocumented; excessive requests may result in IP blocking
3. **Data Delay**: Prices may be delayed by 15+ minutes
4. **Symbol Format**: Requires correct exchange suffix (.NS for NSE, .BO for BSE)
5. **No SLA**: No uptime or data accuracy guarantees

## Google Finance Limitations

1. **No Official API**: Only web scraping available
2. **HTML Structure Changes**: Selectors may break when Google updates their UI
3. **Rate Limiting**: Aggressive scraping may trigger CAPTCHA or IP blocks
4. **Limited Data**: Not all stocks have P/E or EPS data available
5. **Regional Restrictions**: Data availability varies by region

## Caching Strategy

- **Yahoo Finance (CMP)**: 30-second TTL (market data changes frequently)
- **Google Finance (P/E, EPS)**: 5-minute TTL (fundamental data changes infrequently)
- **Portfolio Calculations**: Computed on each request from cached market data
- **Cache Implementation**: In-memory Map with automatic cleanup every 30 seconds
- **Batching**: Multiple symbols fetched in single Yahoo Finance request

## Rate-Limit Handling

1. **Request Batching**: Yahoo Finance supports multiple symbols per request
2. **Request Throttling**: Google Finance requests spaced 100-300ms apart with jitter
3. **Graceful Degradation**: Failed requests return null; UI shows "--" placeholder
4. **Error Isolation**: One failed stock doesn't break entire dashboard
5. **Cache Fallback**: Stale cache served when external APIs fail

## Error Handling

- **Network Errors**: Caught and logged; null values returned
- **Parse Errors**: Regex failures return null; UI shows "--"
- **API Errors**: Non-2xx responses caught; fallback to cached data
- **Missing Data**: Null values propagated; UI displays "--" 
- **Component Errors**: Error boundaries not needed; hooks handle gracefully

## Refresh Mechanism

- **Interval**: 15 seconds (configurable in `usePortfolio.ts`)
- **Scope**: Only market data (CMP, P/E, EPS) refreshed; static holdings unchanged
- **Cleanup**: Intervals cleared on component unmount
- **Loading State**: Subtle loading indicator during refresh
- **Manual Refresh**: "Refresh Now" button for immediate update
- **Online/Offline Detection**: Browser network status monitored
- **Stale Data Indicator**: Shows when data is older than 1 minute

## Calculation Formulas

| Metric | Formula |
|--------|---------|
| Investment | Purchase Price × Quantity |
| Portfolio % | (Investment / Total Portfolio Investment) × 100 |
| Present Value | CMP × Quantity |
| Gain/Loss | Present Value - Investment |
| Gain/Loss % | (Gain/Loss / Investment) × 100 |
| Total Investment | Σ Individual Investments |
| Total Present Value | Σ Individual Present Values |
| Total Gain/Loss | Σ Individual Gain/Loss |
| Portfolio Return % | (Total Gain/Loss / Total Investment) × 100 |

## Portfolio Data (from CSV)

The dashboard uses 26 active holdings across 6 sectors:

| Sector | Stocks | Total Investment |
|--------|--------|-----------------|
| Financial Services | HDFC Bank, Bajaj Finance, ICICI Bank, Bajaj Housing, Savani Financials | ₹3,28,450 |
| Technology | Affle India, LTI Mindtree, KPIT Tech, Tata Tech, BLS E-Services, Tanla | ₹3,37,820 |
| Consumer | Dmart, Tata Consumer, Pidilite | ₹2,63,565 |
| Power | Tata Power, KPI Green, Suzlon, Gensol | ₹1,58,860 |
| Pipe Sector | Hariom Pipes, Astral, Polycab | ₹1,98,656 |
| Others | Clean Science, Deepak Nitrite, Fine Organic, Gravita, SBI Life | ₹2,55,709 |

**Grand Total Investment: ₹15,43,060**

Symbol mapping for API calls:
- NSE symbols (e.g., HDFCBANK, AFFLE) → `.NS` suffix for Yahoo, `NSE:` prefix for Google
- BSE codes (6-digit starting with 5, e.g., 532174, 544252) → `.BO` suffix for Yahoo, `BSE:` prefix for Google

## Known Limitations

1. **No Official APIs**: Relies on unofficial endpoints that may break
2. **HTML Scraping Fragility**: Google Finance parsing may break on UI changes
3. **No Authentication**: Cannot access private/premium data
4. **In-Memory Cache**: Resets on server restart; not suitable for multi-instance deployments
5. **Indian Markets Only**: Symbol formatting assumes NSE/BSE
6. **No Historical Data**: Only current snapshot available
7. **Server-Side Rendering**: Market data fetched at request time; may delay initial load

## Future Improvements

- [ ] Redis/Upstash for distributed caching
- [ ] WebSocket for real-time price updates
- [ ] Historical charts with Recharts
- [ ] User authentication and portfolio persistence
- [ ] Export to CSV/PDF
- [ ] Alert system for price thresholds
- [ ] Dark mode support
- [ ] Unit tests with Jest/Vitest
- [ ] E2E tests with Playwright
- [ ] Official API integration (when available)

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT License - feel free to use for learning or commercial purposes.

## Disclaimer

This project uses unofficial APIs for educational/demo purposes. Not suitable for production trading systems without official data provider agreements.