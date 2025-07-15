"use client";
import FileUpload from "@/components/FileUpload";
import PortfolioInputs from "@/components/PortfolioInputs";
import PortfolioSummary from "@/components/PortfolioSummary";
import PortfolioHistorySelect from "@/components/PortfolioHistorySelect";
import { usePortfolioData } from "@/hooks/usePortfolioData";

export default function Home() {
  const portfolio = usePortfolioData();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-3">ポートフォリオ可視化ツール</h1>
          <p className="text-slate-600">CSVをアップロードし、グラフで分析・管理！</p>
        </header>

        {portfolio.successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded shadow">
            <p className="text-green-700">{portfolio.successMessage}</p>
          </div>
        )}

        {portfolio.error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
            <p className="text-red-700">{portfolio.error}</p>
          </div>
        )}

        <FileUpload onFileSelect={portfolio.handleFile} disabled={portfolio.isBusy} />

        <PortfolioInputs {...portfolio} />

        {portfolio.availableDates.length > 0 && (
          <PortfolioHistorySelect {...portfolio} />
        )}

        {portfolio.displayData.length > 0 && (
          <PortfolioSummary 
            displayData={portfolio.displayData} 
            displayTotalAsset={portfolio.displayTotalAsset} 
            reset={() => {
              portfolio.setCurrentPortfolioData([]);
              portfolio.setDisplayData([]);
              portfolio.setDisplayTotalAsset(null);
              portfolio.setBrokerName('');
              portfolio.setTotalAsset('');
              portfolio.setSelectedDate(new Date().toISOString().split('T')[0]);
              portfolio.setError(null);
              portfolio.setSuccessMessage(null);
            }}
          />
        )}
      </div>
    </main>
  );
}
