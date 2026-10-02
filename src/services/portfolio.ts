import { Holding, PortfolioHolding, SectorSummary, PortfolioSummary, MarketData } from '@/types/portfolio';
import { INITIAL_HOLDINGS } from '@/lib/portfolio-data';
import { fetchCMP } from './yahooFinance';
import { fetchMultipleGoogleFinanceData } from './googleFinance';

export function calculatePortfolioHolding(holding: Holding, cmp: number | null): PortfolioHolding {
  const calculatedInvestment = holding.purchasePrice * holding.quantity;
  const calculatedPresentValue = cmp !== null ? cmp * holding.quantity : null;
  const calculatedGainLoss = calculatedPresentValue !== null ? calculatedPresentValue - calculatedInvestment : null;
  const calculatedGainLossPercent = calculatedGainLoss !== null && calculatedInvestment !== 0 
    ? (calculatedGainLoss / calculatedInvestment) * 100 
    : null;
  
  return {
    ...holding,
    calculatedInvestment,
    calculatedPresentValue,
    calculatedGainLoss,
    calculatedGainLossPercent,
    calculatedPortfolioPercent: 0,
  };
}

export function calculateSectorSummaries(holdings: PortfolioHolding[]): SectorSummary[] {
  const sectorMap = new Map<string, PortfolioHolding[]>();
  
  for (const holding of holdings) {
    const sector = holding.sector;
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, []);
    }
    sectorMap.get(sector)!.push(holding);
  }
  
  const summaries: SectorSummary[] = [];
  
  for (const [sector, sectorHoldings] of sectorMap.entries()) {
    const totalInvestment = sectorHoldings.reduce((sum, h) => sum + h.calculatedInvestment, 0);
    const totalPresentValue = sectorHoldings.reduce((sum, h) => sum + (h.calculatedPresentValue ?? 0), 0);
    const totalGainLoss = sectorHoldings.reduce((sum, h) => sum + (h.calculatedGainLoss ?? 0), 0);
    const totalGainLossPercent = totalInvestment !== 0 ? (totalGainLoss / totalInvestment) * 100 : null;
    
    summaries.push({
      sector,
      holdings: sectorHoldings,
      totalInvestment,
      totalPresentValue: totalPresentValue > 0 ? totalPresentValue : null,
      totalGainLoss: totalGainLoss !== 0 ? totalGainLoss : null,
      totalGainLossPercent,
    });
  }
  
  return summaries.sort((a, b) => b.totalInvestment - a.totalInvestment);
}

export function calculatePortfolioSummary(
  holdings: PortfolioHolding[],
  sectorSummaries: SectorSummary[]
): PortfolioSummary {
  const totalInvestment = holdings.reduce((sum, h) => sum + h.calculatedInvestment, 0);
  const totalPresentValue = holdings.reduce((sum, h) => sum + (h.calculatedPresentValue ?? 0), 0);
  const totalGainLoss = holdings.reduce((sum, h) => sum + (h.calculatedGainLoss ?? 0), 0);
  const totalGainLossPercent = totalInvestment !== 0 ? (totalGainLoss / totalInvestment) * 100 : null;
  
  return {
    totalInvestment,
    totalPresentValue: totalPresentValue > 0 ? totalPresentValue : null,
    totalGainLoss: totalGainLoss !== 0 ? totalGainLoss : null,
    totalGainLossPercent,
    sectorSummaries,
    lastUpdated: new Date(),
  };
}

export async function fetchMarketData(holdings: Holding[]): Promise<MarketData[]> {
  const symbols = holdings.map(h => ({ symbol: h.symbol, exchange: h.exchange }));
  
  const [cmpData, googleData] = await Promise.allSettled([
    fetchCMP(symbols),
    fetchMultipleGoogleFinanceData(symbols),
  ]);
  
  const cmpMap = cmpData.status === 'fulfilled' ? cmpData.value : new Map<string, number | null>();
  const googleMap = googleData.status === 'fulfilled' ? googleData.value : new Map<string, { peRatio: number | null; latestEarnings: number | null }>();
  
  return holdings.map(holding => ({
    symbol: holding.symbol,
    cmp: cmpMap.get(holding.symbol) ?? null,
    peRatio: googleMap.get(holding.symbol)?.peRatio ?? null,
    latestEarnings: googleMap.get(holding.symbol)?.latestEarnings ?? null,
  }));
}

export async function buildPortfolioSummary(): Promise<PortfolioSummary> {
  const holdings = INITIAL_HOLDINGS;
  const marketData = await fetchMarketData(holdings);
  
  const marketDataMap = new Map(marketData.map(m => [m.symbol, m]));
  
  const portfolioHoldings: PortfolioHolding[] = holdings.map(holding => {
    const market = marketDataMap.get(holding.symbol);
    const cmp = market?.cmp ?? holding.cmp;
    const calculated = calculatePortfolioHolding(holding, cmp);
    
    return {
      ...calculated,
      peRatio: market?.peRatio ?? holding.peRatio,
      latestEarnings: market?.latestEarnings ?? holding.latestEarnings,
    };
  });
  
  const sectorSummaries = calculateSectorSummaries(portfolioHoldings);
  const summary = calculatePortfolioSummary(portfolioHoldings, sectorSummaries);
  
  return summary;
}

export function getStaticHoldings(): Holding[] {
  return INITIAL_HOLDINGS;
}