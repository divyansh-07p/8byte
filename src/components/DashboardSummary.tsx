'use client';

import { PortfolioSummary } from '@/types/portfolio';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface DashboardSummaryProps {
  portfolio: PortfolioSummary | null;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
  isStale?: boolean;
}

export function DashboardSummary({ portfolio, lastUpdated, loading, error, isStale }: DashboardSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>Error loading portfolio: {error}</span>
        </div>
        <button 
          className="text-red-700 hover:text-red-900 text-sm font-medium underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!portfolio) {
    return (
      <div className="text-gray-500 text-center py-8">
        No portfolio data available
      </div>
    );
  }
  
  const isPositive = (portfolio.totalGainLoss ?? 0) >= 0;
  const gainLossColor = isPositive ? 'text-green-600' : 'text-red-600';
  const gainLossBg = isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  
  const cards = [
    {
      label: 'Total Investment',
      value: formatCurrency(portfolio.totalInvestment),
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Current Value',
      value: formatCurrency(portfolio.totalPresentValue),
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgClass: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      label: 'Total Gain/Loss',
      value: formatCurrency(portfolio.totalGainLoss),
      icon: (
        <svg className={`w-6 h-6 ${gainLossColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgClass: gainLossBg + ' border-gray-200',
    },
    {
      label: 'Portfolio Return',
      value: formatPercent(portfolio.totalGainLossPercent),
      icon: (
        <svg className={`w-6 h-6 ${gainLossColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bgClass: gainLossBg + ' border-gray-200',
    },
  ];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className={`rounded-lg border p-6 ${card.bgClass} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{card.label}</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{card.value}</p>
              </div>
              <div className="p-2 bg-white/50 rounded-lg">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 gap-2 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--'}
          {isStale && <span className="text-amber-600">(stale)</span>}
        </span>
        <span className="text-gray-400">
          {portfolio.sectorSummaries.length} sectors • {portfolio.sectorSummaries.reduce((sum, s) => sum + s.holdings.length, 0)} holdings
        </span>
      </div>
    </div>
  );
}