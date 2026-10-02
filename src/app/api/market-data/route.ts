import { NextRequest, NextResponse } from 'next/server';
import { getStaticHoldings } from '@/services/portfolio';
import { fetchCMP } from '@/services/yahooFinance';
import { fetchMultipleGoogleFinanceData } from '@/services/googleFinance';
import { MarketDataApiResponse, MarketData } from '@/types/portfolio';

export async function GET(request: NextRequest): Promise<NextResponse<MarketDataApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    
    let holdings = getStaticHoldings();
    
    if (symbolsParam) {
      const requestedSymbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
      holdings = holdings.filter(h => requestedSymbols.includes(h.symbol.toUpperCase()));
    }
    
    const symbols = holdings.map(h => ({ symbol: h.symbol, exchange: h.exchange }));
    
    const [cmpResult, googleResult] = await Promise.allSettled([
      fetchCMP(symbols),
      fetchMultipleGoogleFinanceData(symbols),
    ]);
    
    const cmpMap = cmpResult.status === 'fulfilled' ? cmpResult.value : new Map<string, number | null>();
    const googleMap = googleResult.status === 'fulfilled' ? googleResult.value : new Map<string, { peRatio: number | null; latestEarnings: number | null }>();
    
    const marketData: MarketData[] = holdings.map(holding => ({
      symbol: holding.symbol,
      cmp: cmpMap.get(holding.symbol) ?? null,
      peRatio: googleMap.get(holding.symbol)?.peRatio ?? null,
      latestEarnings: googleMap.get(holding.symbol)?.latestEarnings ?? null,
    }));
    
    return NextResponse.json({
      data: marketData,
      error: null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to fetch market data',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}