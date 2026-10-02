import { cache, generateCacheKey } from './cache';

interface GoogleFinanceData {
  peRatio: number | null;
  latestEarnings: number | null;
}

const CACHE_TTL = 300000; // 5 minutes for fundamental data

async function fetchGoogleFinancePage(symbol: string, exchange: string): Promise<string> {
  const formattedSymbol = exchange === 'BSE' ? `BSE:${symbol}` : `NSE:${symbol}`;
  const url = `https://www.google.com/finance/quote/${formattedSymbol}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 300 },
  });
  
  if (!response.ok) {
    throw new Error(`Google Finance fetch error: ${response.status}`);
  }
  
  return response.text();
}

function parsePEFromHTML(html: string): number | null {
  // Try multiple patterns that Google Finance might use
  const patterns = [
    // Pattern 1: Standard "P/E ratio" label followed by value
    /P\/E\s+ratio[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 2: "P/E ratio (TTM)" 
    /P\/E\s+ratio\s*\(TTM\)[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 3: JSON-LD structured data
    /"priceEarningsRatio"\s*:\s*([\d,]+\.?\d*)/i,
    // Pattern 4: data-attribute style
    /data-field="pe_ratio"[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 5: div with aria-label
    /aria-label="P\/E ratio"[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 6: "P/E" followed by number
    /P\/E\s*[=:]\s*([\d,]+\.?\d*)/i,
    // Pattern 7: Number followed by "P/E" or "PE"
    />([\d,]+\.?\d*)\s*[xX]\s*P\/E\s*</i,
    // Pattern 8: In table row
    /P\/E\s+ratio[^<]*<[^>]*>\s*([\d,]+\.?\d*)\s*</i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(/,/g, '').trim());
      if (!isNaN(value) && value > 0) return value;
    }
  }
  
  return null;
}

function parseEarningsFromHTML(html: string): number | null {
  const patterns = [
    // Pattern 1: EPS (Earnings Per Share) label
    /EPS\s*\(TTM\)[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 2: "Earnings per share" full text
    /Earnings\s+per\s+share[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 3: JSON-LD
    /"earningsPerShare"\s*:\s*([\d,]+\.?\d*)/i,
    // Pattern 4: data attribute
    /data-field="eps"[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 5: In a table/grid
    /EPS[^<]*<[^>]*>\s*([\d,]+\.?\d*)\s*</i,
    // Pattern 6: "EPS (Diluted)" or similar
    /EPS\s*\([^)]+\)[^>]*>\s*([\d,]+\.?\d*)\s*</i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(/,/g, '').trim());
      if (!isNaN(value)) return value;
    }
  }
  
  return null;
}

export async function fetchGoogleFinanceData(symbol: string, exchange: string): Promise<GoogleFinanceData> {
  const cacheKey = generateCacheKey('google-finance', symbol, exchange);
  const cached = cache.get<GoogleFinanceData>(cacheKey);
  if (cached) return cached;
  
  try {
    const html = await fetchGoogleFinancePage(symbol, exchange);
    const peRatio = parsePEFromHTML(html);
    const latestEarnings = parseEarningsFromHTML(html);
    
    // Log if we got data for debugging
    if (peRatio !== null || latestEarnings !== null) {
      console.log(`[Google Finance] ${symbol} (${exchange}): P/E=${peRatio}, EPS=${latestEarnings}`);
    }
    
    const result: GoogleFinanceData = { peRatio, latestEarnings };
    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error(`[Google Finance] Error for ${symbol} (${exchange}):`, error);
    const result: GoogleFinanceData = { peRatio: null, latestEarnings: null };
    cache.set(cacheKey, result, CACHE_TTL);
    return result;
  }
}

export async function fetchMultipleGoogleFinanceData(
  symbols: Array<{ symbol: string; exchange: string }>
): Promise<Map<string, GoogleFinanceData>> {
  const result = new Map<string, GoogleFinanceData>();
  
  // Process with slight delay between requests to avoid rate limiting
  for (const { symbol, exchange } of symbols) {
    const data = await fetchGoogleFinanceData(symbol, exchange);
    result.set(symbol, data);
    
    // Add jitter to delay (100-300ms)
    const delay = 100 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return result;
}