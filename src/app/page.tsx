'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { DashboardSummary } from '@/components/DashboardSummary';
import { PortfolioTable } from '@/components/PortfolioTable';

export default function PortfolioDashboard() {
  const { portfolio, loading, error, refresh } = usePortfolio();
  const [isOnline, setIsOnline] = useState(true);
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());
  
  // Update time every 30 seconds for stale calculation
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Track last successful update
  useEffect(() => {
    if (portfolio && !error) {
      // Defer state update to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setLastSuccessfulUpdate(new Date());
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [portfolio, error]);
  
  const isStale = useMemo(() => {
    if (!lastSuccessfulUpdate) return false;
    return now - lastSuccessfulUpdate.getTime() > 60000; // 1 minute
  }, [lastSuccessfulUpdate, now]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3 text-sm">
                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                
                {lastSuccessfulUpdate && (
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${isStale ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last: {lastSuccessfulUpdate.toLocaleTimeString()}
                    {isStale && <span className="ml-1">(stale)</span>}
                  </span>
                )}
              </div>
              
              <button
                onClick={refresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-full mx-auto px-4 py-6">
        <DashboardSummary 
          portfolio={portfolio} 
          lastUpdated={lastSuccessfulUpdate}
          loading={loading} 
          error={error}
          isStale={isStale}
        />
        
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Holdings by Sector
            </h2>
            <div className="text-sm text-gray-500">
              {portfolio?.sectorSummaries.length ?? 0} sectors • {portfolio?.sectorSummaries.reduce((sum, s) => sum + s.holdings.length, 0) ?? 0} holdings
            </div>
          </div>
          <div className="p-4">
            <PortfolioTable 
              sectorSummaries={portfolio?.sectorSummaries ?? []}
              loading={loading}
              error={error}
            />
          </div>
        </div>
        
        {/* Error banner for partial failures */}
        {error && portfolio && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Some market data could not be loaded. Showing cached/stale data where available.</span>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-full mx-auto px-4 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Data sources: Yahoo Finance (CMP), Google Finance (P/E, Earnings)
          </p>
          <p className="mt-1 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Auto-refreshes every 15 seconds. Data may be delayed.
          </p>
        </div>
      </footer>
    </div>
  );
}