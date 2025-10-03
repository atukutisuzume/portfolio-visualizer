
// app/components/MonthlySymbolProfitLossTable.tsx
"use client";

import React from 'react';

interface ProfitLossData {
  symbol: string;
  name: string;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  plPercentage: number;
}

interface Props {
  data: ProfitLossData[];
  isLoading: boolean;
  isAmountVisible: boolean;
  onRowClick: (symbol: string) => void;
  selectedSymbol: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MonthlySymbolProfitLossTable({ data, isLoading, isAmountVisible, onRowClick, selectedSymbol }: Props) {
  if (isLoading) {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">表示するデータがありません。</div>;
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄コード</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]">銘柄名</th>
            {isAmountVisible && ( // ★条件付きレンダリング
                <>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">実現損益</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">評価損益</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計損益</th>
                </>
            )}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">総資産比</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) => (
            <tr 
              key={item.symbol} 
              onClick={() => onRowClick(item.symbol)}
              className={`cursor-pointer ${selectedSymbol === item.symbol ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.symbol}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 w-[90px]">
                {item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name}
              </td>
              {isAmountVisible && ( // ★条件付きレンダリング
                  <>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.realizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.realizedPl)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.unrealizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.unrealizedPl)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.totalPl >= 0 ? 'text-blue-700' : 'text-pink-700'}`}>
                          {formatCurrency(item.totalPl)}
                      </td>
                  </>
              )}
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${item.plPercentage >= 0 ? 'text-gray-700' : 'text-red-500'}`}>
                {(item.plPercentage * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
