import { Holding } from '@/types/portfolio';
import { loadPortfolioFromCSV } from './csv-loader';
import { parseNumber, normalizeSymbol } from './csv-parser';

const sectorNormalizeMap: Record<string, string> = {
  'FinancialSector': 'Financial Services',
  'TechSector': 'Technology',
  'Consumer': 'Consumer',
  'Power': 'Power',
  'PipeSector': 'Pipe Sector',
  'Others': 'Others',
};

export function getInitialHoldings(): Holding[] {
  const rawHoldings = loadPortfolioFromCSV();
  
  return rawHoldings.map((raw, index) => {
    const sector = sectorNormalizeMap[raw.sector] || raw.sector || 'Others';
    
    return {
      id: `holding-${index}`,
      name: raw.particulars,
      symbol: normalizeSymbol(raw.nseBse, raw.particulars),
      purchasePrice: raw.purchasePrice,
      quantity: raw.qty,
      investment: raw.investment,
      portfolioPercent: raw.portfolioPercent,
      exchange: raw.nseBse.startsWith('5') ? 'BSE' : 'NSE',
      sector: sector,
      cmp: raw.cmp || null,
      presentValue: raw.presentValue || null,
      gainLoss: raw.gainLoss || null,
      gainLossPercent: raw.gainLossPercent || null,
      peRatio: parseNumber(raw.peRatio),
      latestEarnings: parseNumber(raw.latestEarnings),
      marketCap: raw.marketCap ? parseNumber(raw.marketCap) : null,
    };
  });
}

export const INITIAL_HOLDINGS = getInitialHoldings();

export function getSectors(): string[] {
  const sectors = new Set<string>();
  INITIAL_HOLDINGS.forEach(h => sectors.add(h.sector));
  return Array.from(sectors).sort();
}