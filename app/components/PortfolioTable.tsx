"use client";

import React, { useState, useMemo } from 'react';
import { StockDataItem } from '@/hooks/useStockData';

interface Props {
  stockData: StockDataItem[];
  isLoading: boolean;
  error: string | null;
}

const formatPercentage = (value: number | null): string => {
  if (value === null) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getChangeColor = (value: number | null): string => {
  if (value === null) return 'text-gray-500';
  return value >= 0 ? 'text-green-600' : 'text-red-600';
};

type SortableKey = 'name' | 'holdingRate' | 'oneDayChange' | 'twoWeeksChange' | 'oneMonthChange';

export default function PortfolioTable({ stockData, isLoading, error }: Props) {
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'ascending' | 'descending' } | null>(null);

  const sortedStockData = useMemo(() => {
    let sortableItems = [...stockData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Always push nulls to the end
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        const direction = sortConfig.direction === 'ascending' ? 1 : -1;

        switch (typeof aValue) {
          case 'number':
            return (aValue - (bValue as number)) * direction;
          case 'string':
            return aValue.localeCompare(bValue as string) * direction;
          default:
            return 0;
        }
      });
    }
    return sortableItems;
  }, [stockData, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stockData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">表示するデータがありません。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-700">保有銘柄一覧</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('name')}
              >
                銘柄名 {getSortIndicator('name')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('holdingRate')}
              >
                保有率 {getSortIndicator('holdingRate')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('oneDayChange')}
              >
                前日比 {getSortIndicator('oneDayChange')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('twoWeeksChange')}
              >
                2週間前比 {getSortIndicator('twoWeeksChange')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('oneMonthChange')}
              >
                1ヶ月前比 {getSortIndicator('oneMonthChange')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStockData.map((item, index) => (
              <tr key={`${item.code}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.code}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {item.holdingRate.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.value.toLocaleString()}円
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : item.error ? (
                    <span className="text-xs text-red-500">エラー</span>
                  ) : (
                    <span className={`text-sm font-medium ${getChangeColor(item.oneDayChange)}`}>
                      {formatPercentage(item.oneDayChange)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : item.error ? (
                    <span className="text-xs text-red-500">エラー</span>
                  ) : (
                    <span className={`text-sm font-medium ${getChangeColor(item.twoWeeksChange)}`}>
                      {formatPercentage(item.twoWeeksChange)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : item.error ? (
                    <span className="text-xs text-red-500">エラー</span>
                  ) : (
                    <span className={`text-sm font-medium ${getChangeColor(item.oneMonthChange)}`}>
                      {formatPercentage(item.oneMonthChange)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
