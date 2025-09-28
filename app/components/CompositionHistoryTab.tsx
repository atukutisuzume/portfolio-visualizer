// app/components/CompositionHistoryTab.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { fetchMonthlyComposition, MonthlyCompositionData } from '@/lib/api';
import HoldingRateChart from './HoldingRateChart';

export default function CompositionHistoryTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [chartData, setChartData] = useState<MonthlyCompositionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMonthlyComposition(selectedMonth);
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時に初回データを取得
  useEffect(() => {
    handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <button
          onClick={handleFetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isLoading ? '読み込み中...' : 'グラフを表示'}
        </button>
      </div>

      <HoldingRateChart 
        data={chartData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
