
// components/ProfitLossTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { fetchProfitLoss } from '@/lib/api';
import { ProfitLossRecord } from '@/lib/profitLossCalculator';
import ProfitLossTable from './ProfitLossTable';

export default function ProfitLossTab() {
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<ProfitLossRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProfitLoss(yearMonth);
      setData(result);
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
        <input
          type="month"
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <button
          onClick={handleFetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isLoading ? '読み込み中...' : '損益データを表示'}
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <ProfitLossTable data={data} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
