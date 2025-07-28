
// components/ProfitLossTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { fetchProfitLoss } from '@/lib/api';
import { ProfitLossRecord } from '@/lib/profitLossCalculator';
import ProfitLossTable from './ProfitLossTable';

interface ProfitLossSummaryData {
  totalProfitLoss: number;
  winRate: number;
  payoffRatio: number;
}

interface ProfitLossSummary {
  [currency: string]: ProfitLossSummaryData;
}

export default function ProfitLossTab() {
  const [periodType, setPeriodType] = useState('month'); // 'month', 'year', 'all'
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState<ProfitLossRecord[]>([]);
  const [summary, setSummary] = useState<ProfitLossSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    let period = '';
    if (periodType === 'month') {
      period = yearMonth;
    } else if (periodType === 'year') {
      period = year;
    } else {
      period = 'all';
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProfitLoss(period);
      setData(result.records);
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, []); // 初回読み込み

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
        <select 
          value={periodType} 
          onChange={(e) => setPeriodType(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          <option value="month">月</option>
          <option value="year">年</option>
          <option value="all">全期間</option>
        </select>

        {periodType === 'month' && (
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        )}
        {periodType === 'year' && (
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="YYYY"
          />
        )}

        <button
          onClick={handleFetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isLoading ? '読み込み中...' : '損益データを表示'}
        </button>
      </div>

      {summary && Object.entries(summary).map(([currency, summaryData]) => (
        <div key={currency} className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">{currency}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">合計損益</h3>
              <p className={`text-2xl font-semibold ${summaryData.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryData.totalProfitLoss.toLocaleString(undefined, {
                  style: 'currency',
                  currency,
                  minimumFractionDigits: currency === 'JPY' ? 0 : 2,
                  maximumFractionDigits: currency === 'JPY' ? 0 : 2,
                })}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">勝率</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {(summaryData.winRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">ペイオフレシオ</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {summaryData.payoffRatio.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-white p-6 rounded-lg shadow">
        <ProfitLossTable data={data} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
