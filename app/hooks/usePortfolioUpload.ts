"use client";

import { useState } from "react";
import { PortfolioItem } from "@/type";
import { parseCsv } from "@/lib/csvParser";
import { savePortfolioWithItems } from "@/lib/api";
import { extractDateFromFilename } from "@/lib/extractDateFromFilename";

export function usePortfolioUpload() {
  const [currentPortfolioItems, setCurrentPortfolioItems] = useState<PortfolioItem[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [brokerName, setBrokerName] = useState<string>('');
  const [totalAsset, setTotalAsset] = useState<number | ''>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isBusy = isLoading || isSaving;
  const isSaveDisabled = isBusy || !selectedDate || !brokerName || totalAsset === '';

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const extractedDate = extractDateFromFilename(file.name);
      setSelectedDate(extractedDate);

      const { portfolio, brokerType } = await parseCsv(file);
      setCurrentPortfolioItems(portfolio);
      if (brokerType) {
        setBrokerName(brokerType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV解析エラー');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !brokerName || totalAsset === '') {
      setError('日付、証券会社名、総資産額を入力してください。');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const portfolio = {
        broker: brokerName,
        total_asset: Number(totalAsset),
        data_date: selectedDate,
      };

      await savePortfolioWithItems(portfolio, currentPortfolioItems);
      setSuccessMessage("✅ ポートフォリオを保存しました！");
      
      // 保存後にフォームをリセット
      setCurrentPortfolioItems([]);
      setBrokerName('');
      setTotalAsset('');
      setSelectedDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存エラー');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    currentPortfolioItems,
    selectedDate, setSelectedDate,
    brokerName, setBrokerName,
    totalAsset, setTotalAsset,
    handleFile, handleSave,
    isBusy, isSaveDisabled, isLoading, isSaving,
    error, successMessage
  };
}