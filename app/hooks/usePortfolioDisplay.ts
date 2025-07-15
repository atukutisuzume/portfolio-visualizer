"use client";

import { useState, useEffect } from "react";
import { PortfolioData } from "@/type";
import { fetchAvailableDates, fetchPortfolio } from "@/lib/api";

export function usePortfolioDisplay() {
  const [displayData, setDisplayData] = useState<PortfolioData[]>([]);
  const [displayTotalAsset, setDisplayTotalAsset] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const dates = await fetchAvailableDates();
        setAvailableDates(dates);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : '日付履歴取得エラー');
      }
    })();
  }, []);

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setDisplayData([]);
    setDisplayTotalAsset(null);
    setError(null);

    if (!date) return;

    setIsFetchingHistory(true);

    try {
      const { portfolioData, totalAsset: fetchedTotal } = await fetchPortfolio(date);
      setDisplayData(portfolioData);
      setDisplayTotalAsset(fetchedTotal);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴取得エラー');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const refreshDates = async () => {
    try {
      const dates = await fetchAvailableDates();
      setAvailableDates(dates);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '日付履歴取得エラー');
    }
  };

  return {
    displayData,
    displayTotalAsset,
    availableDates,
    selectedDate,
    handleDateSelect,
    refreshDates,
    isFetchingHistory,
    error
  };
}
