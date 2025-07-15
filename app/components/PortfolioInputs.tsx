"use client";
import React from "react";

type Props = {
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  brokerName: string;
  setBrokerName: (v: string) => void;
  totalAsset: number | '';
  setTotalAsset: (v: number | '') => void;
  handleSave: () => void;
  isBusy: boolean;
  isSaveDisabled: boolean;
  isSaving: boolean;
};

export default function PortfolioInputs({
  selectedDate, setSelectedDate,
  brokerName, setBrokerName,
  totalAsset, setTotalAsset,
  handleSave, isBusy, isSaveDisabled, isSaving
}: Props) {
  return (
    <section className="bg-white border-l-4 border-purple-400 p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-purple-700 mb-4">データ入力・保存</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
          disabled={isBusy}
        />
        <input
          type="text"
          placeholder="例: 楽天証券"
          value={brokerName}
          onChange={(e) => setBrokerName(e.target.value)}
          className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
          disabled={isBusy}
        />
        <input
          type="number"
          placeholder="総資産額"
          value={totalAsset}
          onChange={(e) => setTotalAsset(e.target.value === '' ? '' : Number(e.target.value))}
          className="flex-1 border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
          disabled={isBusy}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isSaveDisabled}
        className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded shadow hover:opacity-90 transition disabled:opacity-50"
      >
        {isSaving ? '保存中...' : 'データを保存'}
      </button>
    </section>
  );
}
