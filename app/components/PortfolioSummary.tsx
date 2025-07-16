"use client";
import React from "react";
import PortfolioPieChart from "@/components/PortfolioPieChart";
import { PortfolioData } from "@/type";

type Props = {
  displayData: PortfolioData[];
  displayTotalAsset: number | null;
  reset: () => void;
};

export default function PortfolioSummary({ displayData, displayTotalAsset, reset }: Props) {
  return (
    <section className="bg-white border-l-4 border-indigo-400 p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">ポートフォリオ構成比</h2>
      {displayTotalAsset !== null && (
        <p className="text-slate-600 mb-4">総資産額: {displayTotalAsset.toLocaleString()}円</p>
      )}
      <PortfolioPieChart data={displayData} totalPortfolioAsset={displayTotalAsset}/>
      <div className="text-center mt-6">
        <button onClick={reset} className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 transition">
          クリア
        </button>
      </div>
    </section>
  );
}
