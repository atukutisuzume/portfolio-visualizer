"use client";

import React, { useState, useEffect } from "react";
import PortfolioTable from "@/components/PortfolioTable";
import { useStockData } from "@/hooks/useStockData";
import { fetchLatestPortfolio } from "@/lib/api";
import { PortfolioItem } from "@/type";

export default function TableTab() {
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [totalAsset, setTotalAsset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAmountVisible, setIsAmountVisible] = useState(true);

  const { stockData, isLoading: stockLoading, error: stockError } = useStockData(
    portfolioData,
    totalAsset
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { items, totalAsset, date } = await fetchLatestPortfolio();
        console.log(`[TableTab] Displaying data for date: ${date}`);
        setPortfolioData(items);
        setTotalAsset(totalAsset);
      } catch (err) {
        setError(err instanceof Error ? err.message : '最新データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {portfolioData.length > 0 && (
        <div>
          <div className="flex justify-end items-center mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAmountVisible}
                onChange={() => setIsAmountVisible(!isAmountVisible)}
                className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">金額を表示</span>
            </label>
          </div>
          <PortfolioTable
            stockData={stockData}
            isLoading={stockLoading || isLoading}
            error={stockError}
            isAmountVisible={isAmountVisible}
          />
        </div>
      )}

      {portfolioData.length === 0 && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-500">保存されたポートフォリオデータがありません。</p>
          <p className="text-gray-500 text-sm mt-2">アップロードタブでデータを保存してください。</p>
        </div>
      )}
    </div>
  );
}
