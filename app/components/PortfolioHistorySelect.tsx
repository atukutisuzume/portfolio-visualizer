"use client";
import React from "react";

type Props = {
  availableDates: string[];
  selectedDate: string;
  handleDateSelect: (date: string) => void;
  isBusy: boolean;
};

export default function PortfolioHistorySelect({ availableDates, selectedDate, handleDateSelect, isBusy }: Props) {
  return (
    <section className="bg-white border-l-4 border-green-400 p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-green-700 mb-4">過去のポートフォリオ</h2>
      <select
        value={selectedDate}
        onChange={(e) => handleDateSelect(e.target.value)}
        className="w-full border-slate-300 rounded p-2 shadow focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        disabled={isBusy}
      >
        <option value="">日付を選択してください</option>
        {availableDates.map(date => (
          <option key={date} value={date}>{date}</option>
        ))}
      </select>
    </section>
  );
}
