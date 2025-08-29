"use client";

import { useState, useEffect } from "react";
import { PortfolioItem } from "@/type";
import { fetchAvailableDates, fetchPortfolio } from "@/lib/api";

export function usePortfolioDisplay() {
  const [displayData, setDisplayData] = useState<PortfolioItem[]>([]);
  const [displayTotalAsset, setDisplayTotalAsset] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const dates = await fetchAvailableDates();
        setAvailableDates(dates);
        if (dates.length > 0) {
          await handleDateSelect(dates[0]);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : '日付履歴取得エラー');
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setDisplayData([]);
    setDisplayTotalAsset(null);
    setError(null);

    if (!date) return;

    setIsFetchingHistory(true);

    try {
      const { items, totalAsset } = await fetchPortfolio(date);

      // USD換算と上位15銘柄以外の集約
      const processedItems = items.map(item => ({
        ...item,
        value: item.currency === "USD" ? item.value * 145 : item.value
      }));

      const sortedItems = [...processedItems].sort((a, b) => b.value - a.value);

      let finalDisplayItems: PortfolioItem[] = [];
      if (sortedItems.length > 15) {
        finalDisplayItems = sortedItems.slice(0, 15);
        const otherValue = sortedItems.slice(15).reduce((sum, item) => sum + item.value, 0);
        finalDisplayItems.push({
          code: "OTHER",
          name: "その他",
          quantity: 0,
          price: 0,
          value: otherValue,
          average_price: 0,
          gain_loss: 0,
          currency: "JPY", // その他はJPYとして扱う
          position_type: "cash", // その他はcashとして扱う
        });
      } else {
        finalDisplayItems = sortedItems;
      }

      setDisplayData(finalDisplayItems);
      setDisplayTotalAsset(totalAsset);
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