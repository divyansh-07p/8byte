'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PortfolioSummary, MarketData } from '@/types/portfolio';

interface UsePortfolioReturn {
  portfolio: PortfolioSummary | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      if (data.error) {
        setError(data.error);
      } else {
        setPortfolio(data.data);
        setLastUpdated(new Date(data.timestamp));
        setError(null);
      }
    } catch {
      if (!isMountedRef.current) return;
      setError('Failed to fetch portfolio data');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);
  
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchPortfolio();
  }, [fetchPortfolio]);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      await fetchPortfolio();
    };
    initialize();
    
    intervalRef.current = setInterval(() => {
      fetchPortfolio();
    }, 15000);
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPortfolio]);
  
  return { portfolio, loading, error, lastUpdated, refresh };
}

interface UseMarketDataReturn {
  marketData: Map<string, MarketData>;
  loading: boolean;
  error: string | null;
  refresh: (symbols?: string[]) => Promise<void>;
}

export function useMarketData(initialSymbols?: string[]): UseMarketDataReturn {
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  
  const fetchMarketData = useCallback(async (symbols?: string[]) => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setError(null);
    
    try {
      const params = symbols ? `?symbols=${symbols.join(',')}` : '';
      const response = await fetch(`/api/market-data${params}`);
      const data = await response.json();
      
      if (!isMountedRef.current) return;
      
      if (data.error) {
        setError(data.error);
      } else {
        const newMap = new Map<string, MarketData>();
        for (const item of data.data) {
          newMap.set(item.symbol, item);
        }
        setMarketData(newMap);
        setError(null);
      }
    } catch {
      if (!isMountedRef.current) return;
      setError('Failed to fetch market data');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);
  
  const refresh = useCallback(async (symbols?: string[]) => {
    await fetchMarketData(symbols);
  }, [fetchMarketData]);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      if (initialSymbols && initialSymbols.length > 0) {
        await fetchMarketData(initialSymbols);
      }
    };
    initialize();
    
    const interval = setInterval(() => {
      if (initialSymbols && initialSymbols.length > 0) {
        fetchMarketData(initialSymbols);
      }
    }, 15000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchMarketData, initialSymbols]);
  
  return { marketData, loading, error, refresh };
}