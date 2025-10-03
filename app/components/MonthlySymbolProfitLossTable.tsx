
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
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MASK = '********';

export default function MonthlySymbolProfitLossTable({ data, isLoading, isAmountVisible }: Props) {
  if (isLoading) {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-500">表示するデータがありません。</div>;
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄コード</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄名</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">実現損益</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">評価損益</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計損益</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">総資産比</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.symbol} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.symbol}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.name}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.realizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isAmountVisible ? formatCurrency(item.realizedPl) : MASK}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${item.unrealizedPl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isAmountVisible ? formatCurrency(item.unrealizedPl) : MASK}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.totalPl >= 0 ? 'text-blue-700' : 'text-pink-700'}`}>
                {isAmountVisible ? formatCurrency(item.totalPl) : MASK}
              </td>
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
