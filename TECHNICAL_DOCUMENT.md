# Technical Document: Portfolio Dashboard

## Architecture Overview

The application follows a clean separation of concerns with distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Hooks      │  │  Components  │  │   Types          │  │
│  │ usePortfolio │  │DashboardSummary│ │ PortfolioSummary│ │
│  │ useMarketData│  │PortfolioTable │  │ Holding, etc.   │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │            │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)               │
│  ┌──────────────────┐  ┌────────────────────────────────┐  │
│  │ /api/portfolio   │  │ /api/market-data               │  │
│  │ - Builds summary │  │ - Fetches CMP from Yahoo       │  │
│  │ - Calculates     │  │ - Fetches P/E, EPS from Google │  │
│  │   metrics        │  │ - Returns normalized data      │  │
│  └────────┬─────────┘  └──────────────┬────────────────┘  │
└───────────┼───────────────────────────┼─────────────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ portfolio.ts │  │yahooFinance  │  │ googleFinance    │  │
│  │ - Calculations│  │ - Batch fetch│  │ - HTML scraping  │  │
│  │ - Sector group│  │ - Symbol fmt │  │ - Regex parsing  │  │
│  │ - Summary     │  │ - Cache      │  │ - Throttle       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐                                           │
│  │ cache.ts     │                                           │
│  │ - TTL cache  │                                           │
│  │ - Auto cleanup│                                          │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## Important Design Decisions

### 1. Unofficial APIs by Design
**Decision**: Use Yahoo Finance and Google Finance unofficial endpoints instead of official paid APIs.

**Rationale**: 
- Assignment explicitly mentions these sources
- No API keys required for demo/educational use
- Demonstrates real-world constraint handling

**Trade-off**: 
- Fragile - endpoints may change
- No SLA or support
- Rate limits undocumented

### 2. Server-Side Data Fetching
**Decision**: All external API calls happen in Next.js API routes (server-side).

**Rationale**:
- Keeps API keys/secrets off client (though none used here)
- Enables caching at server level
- Prevents CORS issues with external APIs
- Allows request batching

**Trade-off**: 
- Slightly higher latency (server→external→server→client)
- More complex than client-side fetching

### 3. In-Memory Caching with TTL
**Decision**: Simple Map-based cache with automatic cleanup.

**Rationale**:
- Zero dependencies
- Sufficient for single-instance deployment
- 30s TTL for CMP, 5min for fundamentals balances freshness vs rate limits

**Trade-off**:
- Cache lost on restart
- Not shared across instances
- For production: Redis/Upstash recommended

### 4. Periodic Refresh (15s) on Client
**Decision**: Client-side interval triggers full portfolio re-fetch.

**Rationale**:
- Requirements specify ~15s updates
- Simple implementation with useEffect cleanup
- Only market data changes; static holdings cached

**Trade-off**:
- Refetches entire portfolio every 15s
- Could optimize to only fetch changed symbols
- Server load scales with connected clients

### 5. Error Isolation
**Decision**: Each stock's market data fetched independently; failures don't cascade.

**Rationale**:
- One bad symbol shouldn't break entire dashboard
- `Promise.allSettled` for parallel fetching with individual error handling
- UI shows "--" for failed stocks with tooltip/error indicator

**Trade-off**:
- More complex than single try-catch
- Slightly more code but better UX

### 6. HTML Scraping for Google Finance
**Decision**: Parse HTML with regex instead of headless browser.

**Rationale**:
- Lightweight, no Puppeteer/Playwright dependency
- Fast enough for low-frequency fundamental data
- Regex patterns cover common HTML structures

**Trade-off**:
- Brittle - breaks on UI changes
- Limited to visible data in initial HTML
- No JavaScript-rendered content

## External API Limitations

### Yahoo Finance
```
Endpoint: https://query1.finance.yahoo.com/v7/finance/quote
Method: GET
Params: symbols=SYMBOL1.NS,SYMBOL2.BO
Response: JSON with quoteResponse.result[]
Limitations:
- Unofficial, no documentation
- May require User-Agent header
- Rate limits unknown
- 15+ minute price delays common
- Symbol format critical (.NS/.BO)
```

### Google Finance
```
Endpoint: https://www.google.com/finance/quote/NSE:SYMBOL
Method: GET
Response: HTML page
Parsing: Regex on static HTML
Limitations:
- No official API
- HTML structure changes frequently
- Aggressive scraping triggers CAPTCHA
- Regional data variations
- P/E and EPS not available for all stocks
```

## Caching Strategy

```typescript
// Cache key structure: "prefix:symbol1,symbol2"
// TTL: 30s (CMP), 300s (P/E, EPS)
// Cleanup: Every 30s removes expired entries

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}
```

**Cache Invalidation**: Time-based only (TTL). No event-driven invalidation.

**Cache Warming**: None - populated on first request.

## Rate Limiting

1. **Yahoo Finance**: Single batched request for all symbols
2. **Google Finance**: Sequential requests with 100ms delay
3. **Client Refresh**: 15s interval prevents excessive API calls
4. **Server Cache**: 30s TTL means max 2 external calls/minute for CMP

## Asynchronous Operations

```
Portfolio Request Flow:
1. GET /api/portfolio
2. portfolio.ts:buildPortfolioSummary()
   a. fetchMarketData() → Promise.allSettled
      i. yahooFinance:fetchCMP() - batched
      ii. googleFinance:fetchMultiple - sequential+throttle
   b. Calculate holdings with fresh market data
   c. Group by sector, compute summaries
3. Return PortfolioSummary
4. Client receives data, updates UI
5. 15s later: repeat from step 1
```

## Error Handling Strategy

| Layer | Approach |
|-------|----------|
| Service | Try-catch per symbol; return null on failure |
| API | Promise.allSettled; partial success OK |
| Hook | Catch errors; set error state; show last good data |
| UI | Display "--" for null; error banner for total failure |

## Performance Decisions

1. **Minimal Re-renders**: Portfolio data fetched once per 15s; components memoized implicitly by React
2. **Batched Requests**: Single Yahoo Finance call for all symbols
3. **Selective Refresh**: Only market data refreshed, not static holdings
4. **Efficient Calculations**: Pure functions, no redundant computation
5. **Lazy Parsing**: Google Finance only parsed when needed

## Trade-offs Summary

| Aspect | Chosen Approach | Alternative Considered |
|--------|-----------------|------------------------|
| API Access | Unofficial endpoints | Official paid APIs (Alpha Vantage, etc.) |
| Caching | In-memory Map | Redis, SWR, React Query |
| Refresh | Client interval | Server-Sent Events, WebSockets |
| Google Finance | HTML scraping | Puppeteer, unofficial npm packages |
| Error Handling | Per-symbol isolation | Global error boundary |
| State Management | React hooks + server state | Zustand, Redux, TanStack Query |

## Limitations

1. **Single Instance Only**: In-memory cache not shared
2. **No Persistence**: Holdings hardcoded from CSV
3. **Indian Markets Only**: NSE/BSE symbol formatting
4. **No Authentication**: Public dashboard
5. **No Tests**: Would need Jest + React Testing Library
6. **Build-Time Data**: CSV embedded in TypeScript file

## Interview Discussion Points

1. **Why Next.js App Router?**: Server components, API routes, built-in caching
2. **Why not TanStack Query?**: Simpler to demonstrate fundamentals; Next.js caching sufficient
3. **How would you scale caching?**: Redis with distributed TTL, cache tags for invalidation
4. **How to handle API changes?**: Versioned adapters, circuit breakers, fallback providers
5. **Why batch Yahoo but not Google?**: Yahoo supports multi-symbol; Google requires separate pages
6. **How to improve refresh efficiency?**: WebSocket for push updates, or SSE
7. **Security considerations?**: No secrets in client, rate limiting, input validation
8. **Testing strategy?**: Unit test calculations, integration test API routes, E2E test UI