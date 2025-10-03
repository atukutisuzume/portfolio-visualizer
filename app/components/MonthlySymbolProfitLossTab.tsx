
// app/components/MonthlySymbolProfitLossTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MonthlySymbolProfitLossTable from './MonthlySymbolProfitLossTable';
import SymbolHistoryChart from './SymbolHistoryChart';
import { fetchAvailableDates } from '@/lib/api';

interface ProfitLossData {
  symbol: string;
  name: string;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  plPercentage: number;
}

interface HistoryData {
    date: string;
    quantity: number;
    holdingRate: number;
}

// 月の選択肢を生成する
const generateMonthOptions = (dates: string[]): string[] => {
    if (!dates || dates.length === 0) return [];
    const monthSet = new Set<string>();
    dates.forEach(date => {
        monthSet.add(date.substring(0, 7)); // YYYY-MM
    });
    return Array.from(monthSet).sort().reverse();
};

export default function MonthlySymbolProfitLossTab() {
  const [data, setData] = useState<ProfitLossData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [isAmountVisible, setIsAmountVisible] = useState(true);

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const availableDates = await fetchAvailableDates();
        const options = generateMonthOptions(availableDates);
        setMonthOptions(options);
        if (options.length > 0) {
          setSelectedMonth(options[0]);
        }
      } catch (e) {
        setError('データの取得可能日の読み込みに失敗しました。');
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
        setIsLoading(false);
        return;
    }
    setSelectedSymbol(null); // 月が変わったら銘柄選択をリセット
    setHistoryData([]);

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/portfolio/monthly-symbol-profit-loss?month=${selectedMonth}`);
        if (!response.ok) {
          throw new Error('サーバーからの応答が不正です。');
        }
        const result = await response.json();
        setData(result.results || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'データの取得に失敗しました。');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedSymbol || !selectedMonth) return;

    const fetchHistoryData = async () => {
        setIsHistoryLoading(true);
        try {
            const response = await fetch(`/api/portfolio/symbol-history?month=${selectedMonth}&symbol=${selectedSymbol}`);
            if (!response.ok) {
                throw new Error('銘柄の履歴データの取得に失敗しました。');
            }
            const data = await response.json();
            setHistoryData(data);
        } catch (error) {
            console.error(error);
            setHistoryData([]);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    fetchHistoryData();
  }, [selectedSymbol, selectedMonth]);

  const { positiveContribution, negativeContribution } = useMemo(() => {
    if (!data) return { positiveContribution: 0, negativeContribution: 0 };

    return data.reduce((acc, item) => {
      if (item.plPercentage > 0) {
        acc.positiveContribution += item.plPercentage;
      } else if (item.plPercentage < 0) {
        acc.negativeContribution += item.plPercentage;
      }
      return acc;
    }, { positiveContribution: 0, negativeContribution: 0 });
  }, [data]);

  return (
    <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
                <label htmlFor="month-select" className="font-semibold text-gray-700">対象月:</label>
                <select 
                    id="month-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                >
                    {monthOptions.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center">
                <input
                    id="amount-visibility"
                    type="checkbox"
                    checked={isAmountVisible}
                    onChange={(e) => setIsAmountVisible(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="amount-visibility" className="ml-2 block text-sm text-gray-900">
                    金額を表示
                </label>
            </div>
        </div>

        {error && <div className="text-red-500 bg-red-100 p-4 rounded-md">エラー: {error}</div>}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-around items-center">
                <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-500">プラス貢献度 合計</h4>
                    <p className="text-2xl font-bold text-green-600 mt-1">+{ (positiveContribution * 100).toFixed(2) }%</p>
                </div>
                <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-500">マイナス貢献度 合計</h4>
                    <p className="text-2xl font-bold text-red-600 mt-1">{ (negativeContribution * 100).toFixed(2) }%</p>
                </div>
                <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-500">月次リターン</h4>
                    <p className={`text-2xl font-bold mt-1 ${(positiveContribution + negativeContribution) >= 0 ? 'text-blue-700' : 'text-pink-700'}`}>
                        { ((positiveContribution + negativeContribution) * 100).toFixed(2) }%
                    </p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div className="min-w-0">
                <MonthlySymbolProfitLossTable 
                    data={data} 
                    isLoading={isLoading} 
                    isAmountVisible={isAmountVisible} 
                    onRowClick={(symbol) => setSelectedSymbol(symbol)}
                    selectedSymbol={selectedSymbol}
                />
            </div>
            <div className="h-full min-w-0">
                {isHistoryLoading ? (
                    <div className="flex justify-center items-center h-full bg-white rounded-lg shadow"><p>グラフを読み込み中...</p></div>
                ) : selectedSymbol && historyData.length > 0 ? (
                    <SymbolHistoryChart data={historyData} symbol={selectedSymbol} />
                ) : (
                    <div className="flex justify-center items-center h-full bg-white rounded-lg shadow">
                        <p className="text-gray-500">銘柄を選択すると、ここに推移グラフが表示されます。</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
