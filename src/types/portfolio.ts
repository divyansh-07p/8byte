export interface RawHolding {
  no: string;
  particulars: string;
  purchasePrice: number;
  qty: number;
  investment: number;
  portfolioPercent: number;
  nseBse: string;
  cmp: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  marketCap: string;
  peRatio: string;
  latestEarnings: string;
  revenueTTM: string;
  ebitdaTTM: string;
  ebitdaPercent: string;
  pat: string;
  patPercent: string;
  cfoMarch24: string;
  cfo5Years: string;
  freeCashFlow5Years: string;
  debtToEquity: string;
  bookValue: string;
  revenue: string;
  ebitda: string;
  profit: string;
  marketCap2: string;
  priceToSales: string;
  cfoToEbitda: string;
  cfoToPat: string;
  priceToBook: string;
  stage2: string;
  salePrice: string;
  abhishek: string;
  sector: string;
}

export interface Holding {
  id: string;
  name: string;
  symbol: string;
  purchasePrice: number;
  quantity: number;
  investment: number;
  portfolioPercent: number;
  exchange: string;
  sector: string;
  cmp: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  marketCap: number | null;
}

export interface MarketData {
  symbol: string;
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  error?: string;
}

export interface PortfolioHolding extends Holding {
  calculatedInvestment: number;
  calculatedPresentValue: number | null;
  calculatedGainLoss: number | null;
  calculatedGainLossPercent: number | null;
  calculatedPortfolioPercent: number;
}

export interface SectorSummary {
  sector: string;
  holdings: PortfolioHolding[];
  totalInvestment: number;
  totalPresentValue: number | null;
  totalGainLoss: number | null;
  totalGainLossPercent: number | null;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number | null;
  totalGainLoss: number | null;
  totalGainLossPercent: number | null;
  sectorSummaries: SectorSummary[];
  lastUpdated: Date | null;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  timestamp: Date;
}

export type PortfolioApiResponse = ApiResponse<PortfolioSummary>;
export type MarketDataApiResponse = ApiResponse<MarketData[]>;