"use client";

import { useState } from "react";
import { PortfolioData, StockEntry } from "@/type";
import { parseCsv } from "@/lib/csvParser";
import { savePortfolio } from "@/lib/api";

export function usePortfolioUpload() {
  const [currentPortfolioData, setCurrentPortfolioData] = useState<PortfolioData[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [brokerName, setBrokerName] = useState<string>('');
  const [totalAsset, setTotalAsset] = useState<number | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isBusy = isLoading || isSaving;
  const isSaveDisabled = isBusy || !selectedDate || !brokerName || totalAsset === '' || currentPortfolioData.length === 0;

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const parsedData = await parseCsv(file);
      setCurrentPortfolioData(parsedData);

      const calculated = parsedData.reduce((sum, item) => sum + item.value, 0);
      setTotalAsset(calculated);
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
      const stocks = currentPortfolioData.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        value: item.value
      }));

      await savePortfolio(selectedDate, brokerName, Number(totalAsset), stocks);
      setSuccessMessage("✅ ポートフォリオを保存しました！");
      
      // 保存後にフォームをリセット
      setCurrentPortfolioData([]);
      setBrokerName('');
      setTotalAsset('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存エラー');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentPortfolioData,
    selectedDate, setSelectedDate,
    brokerName, setBrokerName,
    totalAsset, setTotalAsset,
    handleFile, handleSave,
    isBusy, isSaveDisabled, isLoading, isSaving,
    error, successMessage
  };
}
