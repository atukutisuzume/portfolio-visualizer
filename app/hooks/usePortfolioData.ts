"use client";

import { useState, useEffect } from "react";
import { PortfolioItem } from "@/type";
import { parseCsv } from "@/lib/csvParser";
import { fetchAvailableDates, savePortfolioWithItems, fetchPortfolio } from "@/lib/api";

export function usePortfolioData() {
  const [currentPortfolioItems, setCurrentPortfolioItems] = useState<PortfolioItem[]>([]);
  const [displayData, setDisplayData] = useState<PortfolioItem[]>([]);
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
  const isSaveDisabled = isBusy || !selectedDate || !brokerName || totalAsset === '' || currentPortfolioItems.length === 0;

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
      const { portfolio, totalAsset } = await parseCsv(file);
      setCurrentPortfolioItems(portfolio);
      setDisplayData(portfolio);
      setTotalAsset(totalAsset || '');
      setDisplayTotalAsset(totalAsset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV解析エラー');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !brokerName || totalAsset === '' || currentPortfolioItems.length === 0) {
      setError('日付、証券会社名、総資産額、またはデータが不足しています。');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const portfolio = {
        broker: brokerName,
        total_asset: Number(totalAsset),
        created_at: selectedDate,
      };

      await savePortfolioWithItems(portfolio, currentPortfolioItems);
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
      const { items, portfolio } = await fetchPortfolio(date);
      setDisplayData(items);
      setDisplayTotalAsset(portfolio.total_asset);
      setCurrentPortfolioItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴取得エラー');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  return {
    currentPortfolioItems, displayData, displayTotalAsset,
    availableDates, selectedDate, setSelectedDate,
    brokerName, setBrokerName, totalAsset, setTotalAsset,
    handleFile, handleSave, handleDateSelect,
    isBusy, isSaveDisabled, isLoading, isSaving, isFetchingHistory,
    error, successMessage
  };
}