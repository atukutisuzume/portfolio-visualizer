"use client";
import React from "react";

type Stock = {
  id: string;
  symbol: string;
  name: string;
};

type Label = {
  id: string;
  name: string;
};

type Props = {
  selectedStockId: string;
  setSelectedStockId: (v: string) => void;
  selectedLabelId: string;
  setSelectedLabelId: (v: string) => void;
  stocks: Stock[];
  labels: Label[];
  handleSave: () => void;
  isLoading: boolean;
  isSaving: boolean;
  isSaveDisabled: boolean;
};

export default function StockLabelInput({
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
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <select
        value={selectedStockId}
        onChange={(e) => setSelectedStockId(e.target.value)}
        className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        disabled={isSaving || isLoading}
      >
        {isLoading ? (
          <option>Loading stocks...</option>
        ) : (
          stocks.map((stock) => (
            <option key={stock.id} value={stock.id}>
              {stock.symbol} - {stock.name}
            </option>
          ))
        )}
      </select>
      <select
        value={selectedLabelId}
        onChange={(e) => setSelectedLabelId(e.target.value)}
        className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        disabled={isSaving || isLoading}
      >
        {isLoading ? (
          <option>Loading labels...</option>
        ) : (
          labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))
        )}
      </select>
      <button
        onClick={handleSave}
        disabled={isSaveDisabled || isLoading}
        className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-2 px-6 rounded shadow hover:opacity-90 transition disabled:opacity-50"
      >
        {isSaving ? '保存中...' : '関連付ける'}
      </button>
    </div>
  );
}
