"use client";

import { useState, useEffect } from "react";

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

type Label = {
  id: string;
  name: string;
};

async function fetchStocks(): Promise<Stock[]> {
  const res = await fetch('/api/stocks');
  if (!res.ok) throw new Error('銘柄の取得に失敗しました。');
  return res.json();
}

async function fetchLabels(): Promise<Label[]> {
  const res = await fetch('/api/labels');
  if (!res.ok) throw new Error('ラベルの取得に失敗しました。');
  return res.json();
}

async function saveStockLabel(stockId: string, labelId: string) {
  const res = await fetch('/api/stock-labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_id: stockId, label_id: labelId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '関連付けの保存に失敗しました。');
  }
  return data;
}

export function useStockLabel() {
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [selectedLabelId, setSelectedLabelId] = useState<string>('');
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stocksData, labelsData] = await Promise.all([fetchStocks(), fetchLabels()]);
        setStocks(stocksData);
        setLabels(labelsData);
        if (stocksData.length > 0) setSelectedStockId(stocksData[0].id);
        if (labelsData.length > 0) setSelectedLabelId(labelsData[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const isSaveDisabled = isSaving || !selectedStockId || !selectedLabelId;

  const handleSave = async () => {
    if (isSaveDisabled) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveStockLabel(selectedStockId, selectedLabelId);
      const stockName = stocks.find(s => s.id === selectedStockId)?.name;
      const labelName = labels.find(l => l.id === selectedLabelId)?.name;
      setSuccessMessage(`✅ ${stockName}にラベル「${labelName}」を付けました！`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました。');
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  return {
    selectedStockId,
    setSelectedStockId,
    selectedLabelId,
    setSelectedLabelId,
    stocks,
    labels,
    handleSave,
    isLoading,
    isSaving,
    isSaveDisabled,
    error,
    successMessage,
  };
}
