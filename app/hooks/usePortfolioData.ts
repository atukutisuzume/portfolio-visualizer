"use client";

import { useState, useEffect } from "react";
import { PortfolioData, StockEntry } from "@/types";
import { parseCsv } from "@/lib/csvParser";
import { fetchAvailableDates, savePortfolio, fetchPortfolio } from "@/lib/api";

export function usePortfolioData() {
  const [currentPortfolioData, setCurrentPortfolioData] = useState<PortfolioData[]>([]);
  const [displayData, setDisplayData] = useState<PortfolioData[]>([]);
  const [displayTotalAsset, setDisplayTotalAsset] = useState<number | null>(null);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [brokerName, setBrokerName] = useState<string>('');
  const [totalAsset, setTotalAsset] = useState<number | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isBusy = isLoading || isSaving || isFetchingHistory;
  const isSaveDisabled = isBusy || !selectedDate || !brokerName || totalAsset === '' || currentPortfolioData.length === 0;

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

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const parsedData = await parseCsv(file);
      setCurrentPortfolioData(parsedData);
      setDisplayData(parsedData);

      const calculated = parsedData.reduce((sum, item) => sum + item.value, 0);
      setTotalAsset(calculated);
      setDisplayTotalAsset(calculated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV解析エラー');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !brokerName || totalAsset === '' || currentPortfolioData.length === 0) {
      setError('日付、証券会社名、総資産額、またはデータが不足しています。');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const stocks: StockEntry[] = currentPortfolioData.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        value: item.value
      }));

      await savePortfolio(selectedDate, brokerName, Number(totalAsset), stocks);
      setSuccessMessage("✅ ポートフォリオを保存しました！");
      
      const dates = await fetchAvailableDates();
      setAvailableDates(dates);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存エラー');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setDisplayData([]);
    setDisplayTotalAsset(null);
    setIsFetchingHistory(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { portfolioData, totalAsset: fetchedTotal } = await fetchPortfolio(date);
      setDisplayData(portfolioData);
      setDisplayTotalAsset(fetchedTotal);
      setCurrentPortfolioData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴取得エラー');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  return {
    currentPortfolioData, displayData, displayTotalAsset,
    availableDates, selectedDate, setSelectedDate,
    brokerName, setBrokerName, totalAsset, setTotalAsset,
    handleFile, handleSave, handleDateSelect,
    isBusy, isSaveDisabled, isLoading, isSaving, isFetchingHistory,
    error, successMessage
  };
}
