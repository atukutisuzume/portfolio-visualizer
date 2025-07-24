
// components/ProfitLossTable.tsx
"use client";

import React from 'react';
import { ProfitLossRecord } from '@/lib/profitLossCalculator';

interface Props {
  data: ProfitLossRecord[];
  isLoading: boolean;
  error: string | null;
}

const formatNumber = (num: number) => {
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getProfitLossColor = (value: number): string => {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-900';
};

export default function ProfitLossTable({ data, isLoading, error }: Props) {
  if (error) {
    return <div className="text-red-500">エラー: {error}</div>;
  }

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (data.length === 0) {
    return <div className="text-gray-500">対象期間に売却データはありません。</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">銘柄</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">売却日</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">売却数</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">売却単価</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">取得単価</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">損益</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">通貨</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{record.name}</div>
                <div className="text-sm text-gray-500">{record.symbol}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.sellDate}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{record.quantity}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.sellPrice)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(record.avgBuyPrice)}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getProfitLossColor(record.profitLoss)}`}>
                {formatNumber(record.profitLoss)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
