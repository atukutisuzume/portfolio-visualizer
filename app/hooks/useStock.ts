"use client";

import { useState } from "react";

async function saveStock(symbol: string, name: string, currency: string) {
  const res = await fetch('/api/stocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, name, currency }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '銘柄の保存に失敗しました。');
  }
  return data;
}

export function useStock() {
  const [symbol, setSymbol] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [currency, setCurrency] = useState<string>('JPY'); // Default to JPY
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSaveDisabled = isSaving || !symbol.trim() || !name.trim();

  const handleSave = async () => {
    if (isSaveDisabled) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await saveStock(symbol.trim(), name.trim(), currency);
      setSuccessMessage(`✅ 銘柄「${name} (${symbol})」を保存しました！`);
      // Reset form
      setSymbol('');
      setName('');
      setCurrency('JPY');
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
    symbol,
    setSymbol,
    name,
    setName,
    currency,
    setCurrency,
    handleSave,
    isSaving,
    isSaveDisabled,
    error,
    successMessage,
  };
}
