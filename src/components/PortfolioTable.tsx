'use client';

import { Fragment } from 'react';
import { PortfolioHolding, SectorSummary } from '@/types/portfolio';
import { formatCurrency, formatNumber, formatPercent, getGainLossClass } from '@/lib/formatters';

interface PortfolioTableProps {
  sectorSummaries: SectorSummary[];
  loading: boolean;
  error: string | null;
}

function getColumnClassName(col: { width: string; align?: string }): string {
  const alignClass = col.align ? 'text-' + col.align : '';
  return 'px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ' + alignClass + ' ' + col.width;
}

const COLUMNS = [
  { key: 'name', label: 'Particulars', width: 'w-48', align: 'left' },
  { key: 'purchasePrice', label: 'Purchase Price', width: 'w-28', align: 'right' },
  { key: 'quantity', label: 'Qty', width: 'w-16', align: 'right' },
  { key: 'investment', label: 'Investment', width: 'w-28', align: 'right' },
  { key: 'portfolioPercent', label: 'Portfolio %', width: 'w-24', align: 'right' },
  { key: 'exchange', label: 'NSE/BSE', width: 'w-20', align: 'center' },
  { key: 'cmp', label: 'CMP', width: 'w-24', align: 'right' },
  { key: 'presentValue', label: 'Present Value', width: 'w-28', align: 'right' },
  { key: 'gainLoss', label: 'Gain/Loss', width: 'w-28', align: 'right' },
  { key: 'peRatio', label: 'P/E Ratio', width: 'w-20', align: 'right' },
  { key: 'latestEarnings', label: 'Latest Earnings', width: 'w-28', align: 'right' },
];

const SECTOR_COLORS: Record<string, string> = {
  'Financial Services': 'bg-blue-50 border-blue-200 text-blue-900',
  'Technology': 'bg-purple-50 border-purple-200 text-purple-900',
  'Consumer': 'bg-green-50 border-green-200 text-green-900',
  'Power': 'bg-amber-50 border-amber-200 text-amber-900',
  'Pipe Sector': 'bg-orange-50 border-orange-200 text-orange-900',
  'Others': 'bg-gray-50 border-gray-200 text-gray-900',
};

function HoldingRow({ holding }: { holding: PortfolioHolding }) {
  const isGain = (holding.calculatedGainLoss ?? 0) > 0;
  const isLoss = (holding.calculatedGainLoss ?? 0) < 0;
  
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-150">
      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{holding.name}</td>
      <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{formatCurrency(holding.purchasePrice)}</td>
      <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{holding.quantity.toLocaleString()}</td>
      <td className="px-3 py-2 text-right font-medium text-gray-900 tabular-nums">{formatCurrency(holding.calculatedInvestment)}</td>
      <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{formatPercent(holding.calculatedPortfolioPercent)}</td>
      <td className="px-3 py-2 text-center text-gray-700">
        <span className={'inline-block px-2 py-0.5 text-xs font-medium rounded-full ' + (holding.exchange === 'NSE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>
          {holding.exchange}
        </span>
      </td>
      <td className={'px-3 py-2 text-right font-mono tabular-nums ' + (holding.cmp !== null ? 'text-gray-900' : 'text-gray-400')}>
        {formatCurrency(holding.cmp)}
        {holding.cmp !== null && <span className="ml-1 inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />}
      </td>
      <td className={'px-3 py-2 text-right font-medium tabular-nums ' + (holding.calculatedPresentValue !== null ? 'text-gray-900' : 'text-gray-400')}>
        {formatCurrency(holding.calculatedPresentValue)}
      </td>
      <td className={'px-3 py-2 text-right font-medium tabular-nums ' + getGainLossClass(holding.calculatedGainLoss)} style={{ backgroundColor: isGain ? '#f0fdf4' : isLoss ? '#fef2f2' : 'transparent' }}>
        {formatCurrency(holding.calculatedGainLoss)}
        <span className="ml-1 text-sm font-normal opacity-75">({formatPercent(holding.calculatedGainLossPercent)})</span>
      </td>
      <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{formatNumber(holding.peRatio)}</td>
      <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{formatCurrency(holding.latestEarnings)}</td>
    </tr>
  );
}

function SectorHeader({ sector, totalInvestment, totalPresentValue, totalGainLoss, totalGainLossPercent }: SectorSummary) {
  const sectorColor = SECTOR_COLORS[sector] || 'bg-gray-50 border-gray-200 text-gray-900';
  const isGain = (totalGainLoss ?? 0) > 0;
  const isLoss = (totalGainLoss ?? 0) < 0;
  
  return (
    <tr className="border-t-2 border-gray-200">
      <td className={`px-3 py-3 font-semibold text-lg ${sectorColor} rounded-l-lg border-r border-gray-200`}>
        {sector}
      </td>
      <td className="px-3 py-3 bg-gray-50"></td>
      <td className="px-3 py-3 bg-gray-50"></td>
      <td className="px-3 py-3 text-right font-semibold text-gray-900 bg-gray-50 tabular-nums">{formatCurrency(totalInvestment)}</td>
      <td className="px-3 py-3 bg-gray-50"></td>
      <td className="px-3 py-3 bg-gray-50"></td>
      <td className="px-3 py-3 bg-gray-50"></td>
      <td className="px-3 py-3 text-right font-semibold text-gray-900 bg-gray-50 tabular-nums">{formatCurrency(totalPresentValue)}</td>
      <td className={`px-3 py-3 text-right font-semibold tabular-nums ${getGainLossClass(totalGainLoss)} ${isGain ? 'bg-green-50' : isLoss ? 'bg-red-50' : 'bg-gray-50'}`}>
        {formatCurrency(totalGainLoss)}
        <span className="ml-1 text-sm font-normal opacity-75">({formatPercent(totalGainLossPercent)})</span>
      </td>
      <td className="px-3 py-3 bg-gray-50"></td>
      <td className="px-3 py-3 bg-gray-50"></td>
    </tr>
  );
}

function SectorTotalRow({ sectorSummaries }: { sectorSummaries: SectorSummary[] }) {
  const grandTotalInvestment = sectorSummaries.reduce((sum, s) => sum + s.totalInvestment, 0);
  const grandTotalPresentValue = sectorSummaries.reduce((sum, s) => sum + (s.totalPresentValue ?? 0), 0);
  const grandTotalGainLoss = sectorSummaries.reduce((sum, s) => sum + (s.totalGainLoss ?? 0), 0);
  const grandTotalGainLossPercent = grandTotalInvestment !== 0 ? (grandTotalGainLoss / grandTotalInvestment) * 100 : null;
  const isGain = (grandTotalGainLoss ?? 0) > 0;
  const isLoss = (grandTotalGainLoss ?? 0) < 0;
  
  return (
    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
      <td className="px-3 py-3 text-gray-900 rounded-l-lg">Grand Total</td>
      <td className="px-3 py-3"></td>
      <td className="px-3 py-3"></td>
      <td className="px-3 py-3 text-right text-gray-900 tabular-nums">{formatCurrency(grandTotalInvestment)}</td>
      <td className="px-3 py-3"></td>
      <td className="px-3 py-3"></td>
      <td className="px-3 py-3"></td>
      <td className="px-3 py-3 text-right text-gray-900 tabular-nums">{formatCurrency(grandTotalPresentValue)}</td>
      <td className={'px-3 py-3 text-right tabular-nums ' + getGainLossClass(grandTotalGainLoss) + ' ' + (isGain ? 'bg-green-50' : isLoss ? 'bg-red-50' : 'bg-gray-100')}>
        {formatCurrency(grandTotalGainLoss)}
        <span className="ml-1 text-sm font-normal opacity-75">({formatPercent(grandTotalGainLossPercent)})</span>
      </td>
      <td className="px-3 py-3"></td>
      <td className="px-3 py-3"></td>
    </tr>
  );
}

export function PortfolioTable({ sectorSummaries, loading, error }: PortfolioTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {COLUMNS.map(col => (
                <th 
                  key={col.key} 
                  className={getColumnClassName(col)}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="border-t border-gray-100 animate-pulse">
                {COLUMNS.map(col => (
                  <td key={col.key} className="px-3 py-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
          <span>Error loading portfolio table: {error}</span>
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
  
  if (sectorSummaries.length === 0) {
    return (
      <div className="text-gray-500 text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">No portfolio data available</p>
        <p className="text-sm mt-1">Please check your data source</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto relative">
      {/* Scroll hint for mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 pointer-events-none opacity-70">
        ← Scroll →
      </div>
      
      <table className="w-full min-w-[1200px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            {COLUMNS.map(col => (
              <th 
                key={col.key} 
                className={getColumnClassName(col)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sectorSummaries.map((sector) => (
            <Fragment key={sector.sector}>
              <SectorHeader {...sector} />
              {sector.holdings.map((holding, holdingIndex) => (
                <HoldingRow key={sector.sector + '-' + holdingIndex} holding={holding} />
              ))}
            </Fragment>
          ))}
          <SectorTotalRow sectorSummaries={sectorSummaries} />
        </tbody>
      </table>
    </div>
  );
}