import { cache, generateCacheKey } from './cache';
import yahooFinance from 'yahoo-finance2';

const CACHE_TTL = 30000; // 30 seconds for market data

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number | null;
}

function formatSymbolForYahoo(symbol: string, exchange: string): string {
  if (exchange === 'BSE') {
    return `${symbol}.BO`;
  }
  return `${symbol}.NS`;
}

export async function fetchCMP(symbols: Array<{ symbol: string; exchange: string }>): Promise<Map<string, number | null>> {
  const cacheKey = generateCacheKey('yahoo-cmp', symbols.map(s => s.symbol).sort().join(','));
  const cached = cache.get<Map<string, number | null>>(cacheKey);
  if (cached) return cached;

  const yahooSymbols = symbols.map(s => formatSymbolForYahoo(s.symbol, s.exchange));
  
  try {
    const quotes = await yahooFinance.quote(yahooSymbols) as YahooQuote[];
    const result = new Map<string, number | null>();
    
    for (const quote of quotes) {
      const originalSymbol = symbols.find(s => 
        formatSymbolForYahoo(s.symbol, s.exchange) === quote.symbol
      )?.symbol;
      
      if (originalSymbol && quote.regularMarketPrice != null) {
        result.set(originalSymbol, quote.regularMarketPrice);
      }
    }
    
    for (const s of symbols) {
      if (!result.has(s.symbol)) {
        result.set(s.symbol, null);
      }
    }
    
    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Yahoo Finance fetch error:', error);
    const result = new Map<string, number | null>();
    for (const s of symbols) {
      result.set(s.symbol, null);
    }
    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}

export async function fetchSingleCMP(symbol: string, exchange: string): Promise<number | null> {
  const result = await fetchCMP([{ symbol, exchange }]);
  return result.get(symbol) ?? null;
}