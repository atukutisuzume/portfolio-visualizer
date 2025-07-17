"use client";

import { useState, useEffect } from 'react';
import { PortfolioItem } from '@/type';

export interface StockDataItem extends PortfolioItem {
  holdingRate: number;
  oneDayChange: number | null;
  twoWeeksChange: number | null;
  oneMonthChange: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useStockData(portfolioItems: PortfolioItem[], totalAsset: number | null) {
  const [stockData, setStockData] = useState<StockDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioItems.length || !totalAsset) {
      setStockData([]);
      return;
    }

    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const stockDataPromises = portfolioItems.map(async (item) => {
          const stockDataItem: StockDataItem = {
            ...item,
            holdingRate: (item.value / totalAsset) * 100,
            oneDayChange: null,
            twoWeeksChange: null,
            oneMonthChange: null,
            isLoading: true,
            error: null,
          };

          // "その他" の場合は株価データを取得しない
          if (item.code === 'OTHER') {
            return {
              ...stockDataItem,
              isLoading: false,
            };
          }

          try {
            const response = await fetch(`/api/stock-data?symbol=${item.code}&currency=${item.currency}`);
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch stock data');
            }

            const data = await response.json();
            
            return {
              ...stockDataItem,
              oneDayChange: data.oneDayChange,
              twoWeeksChange: data.twoWeeksChange,
              oneMonthChange: data.oneMonthChange,
              isLoading: false,
            };
          } catch (err) {
            return {
              ...stockDataItem,
              isLoading: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            };
          }
        });

        const results = await Promise.all(stockDataPromises);
        setStockData(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [portfolioItems, totalAsset]);

  return {
    stockData,
    isLoading,
    error,
  };
}
