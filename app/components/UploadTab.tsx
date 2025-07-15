"use client";
import React from "react";
import FileUpload from "@/components/FileUpload";
import PortfolioInputs from "@/components/PortfolioInputs";
import { usePortfolioUpload } from "@/hooks/usePortfolioUpload";

export default function UploadTab() {
  const upload = usePortfolioUpload();

  return (
    <div className="space-y-8">
      {upload.successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
          <p className="text-green-700">{upload.successMessage}</p>
        </div>
      )}

      {upload.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
          <p className="text-red-700">{upload.error}</p>
        </div>
      )}

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
  );
}
