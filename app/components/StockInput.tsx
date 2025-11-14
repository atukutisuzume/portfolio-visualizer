"use client";
import React from "react";

type Props = {
  symbol: string;
  setSymbol: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  handleSave: () => void;
  isSaving: boolean;
  isSaveDisabled: boolean;
};

export default function StockInput({
  symbol,
  setSymbol,
  name,
  setName,
  currency,
  setCurrency,
  handleSave,
  isSaving,
  isSaveDisabled,
}: Props) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="ティッカー"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
          disabled={isSaving}
        />
        <input
          type="text"
          placeholder="銘柄名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
          disabled={isSaving}
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
          disabled={isSaving}
        >
          <option value="JPY">JPY</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <button
        onClick={handleSave}
        disabled={isSaveDisabled}
        className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold py-2 rounded shadow hover:opacity-90 transition disabled:opacity-50"
      >
        {isSaving ? '保存中...' : '銘柄を保存'}
      </button>
    </div>
  );
}
