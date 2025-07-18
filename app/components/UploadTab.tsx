"use client";
import React, { useState } from "react";
import FileUpload from "@/components/FileUpload";
import PortfolioInputs from "@/components/PortfolioInputs";
import TradeHistoryUpload from "@/components/TradeHistoryUpload";
import { usePortfolioUpload } from "@/hooks/usePortfolioUpload";

export default function UploadTab() {
  const upload = usePortfolioUpload();
  const [tradeHistoryMessage, setTradeHistoryMessage] = useState<string>("");

  const handleTradeHistorySuccess = (message: string, count: number, source: string) => {
    setTradeHistoryMessage(`${message} (${count}件の取引を取り込みました)`);
    // 5秒後にメッセージを消去
    setTimeout(() => setTradeHistoryMessage(""), 5000);
  };

  return (
    <div className="space-y-8">
      {upload.successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{upload.successMessage}</p>
        </div>
      )}

      {tradeHistoryMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{tradeHistoryMessage}</p>
        </div>
      )}

      {upload.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{upload.error}</p>
        </div>
      )}

      {/* 保有銘柄アップロード */}
      <section className="bg-white border-l-4 border-blue-400 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-blue-700 mb-4">保有銘柄データ</h2>
        <div className="space-y-6">
          <FileUpload onFileSelect={upload.handleFile} disabled={upload.isBusy} />
          <PortfolioInputs
            selectedDate={upload.selectedDate}
            setSelectedDate={upload.setSelectedDate}
            brokerName={upload.brokerName}
            setBrokerName={upload.setBrokerName}
            totalAsset={upload.totalAsset}
            setTotalAsset={upload.setTotalAsset}
            handleSave={upload.handleSave}
            isBusy={upload.isBusy}
            isSaveDisabled={upload.isSaveDisabled}
            isSaving={upload.isSaving}
          />
        </div>
      </section>

      {/* 取引履歴アップロード */}
      <section className="bg-white border-l-4 border-purple-400 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-purple-700 mb-4">取引履歴データ</h2>
        <TradeHistoryUpload onUploadSuccess={handleTradeHistorySuccess} />
      </section>
    </div>
  );
}
