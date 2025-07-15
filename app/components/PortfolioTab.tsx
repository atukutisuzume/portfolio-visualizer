"use client";
import React from "react";
import PortfolioHistorySelect from "@/components/PortfolioHistorySelect";
import PortfolioSummary from "@/components/PortfolioSummary";
import { usePortfolioDisplay } from "@/hooks/usePortfolioDisplay";

export default function PortfolioTab() {
  const display = usePortfolioDisplay();

  return (
    <div className="space-y-8">
      {display.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{display.error}</p>
        </div>
      )}

      {display.availableDates.length > 0 && (
        <PortfolioHistorySelect
          availableDates={display.availableDates}
          selectedDate={display.selectedDate}
          handleDateSelect={display.handleDateSelect}
          isBusy={display.isFetchingHistory}
        />
      )}

      {display.displayData.length > 0 && (
        <PortfolioSummary
          displayData={display.displayData}
          displayTotalAsset={display.displayTotalAsset}
          reset={() => {
            // ポートフォリオタブではリセット機能は不要
            // 代わりに日付選択をクリアする
            display.handleDateSelect('');
          }}
        />
      )}

      {display.availableDates.length === 0 && !display.isFetchingHistory && (
        <div className="text-center py-8">
          <p className="text-gray-500">保存されたポートフォリオデータがありません。</p>
          <p className="text-gray-500 text-sm mt-2">アップロードタブでデータを保存してください。</p>
        </div>
      )}
    </div>
  );
}
