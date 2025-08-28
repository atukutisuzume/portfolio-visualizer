"use client";
import { useState } from "react";
import TabNavigation from "@/components/TabNavigation";
import UploadTab from "@/components/UploadTab";
import PortfolioTab from "@/components/PortfolioTab";
import TableTab from "@/components/TableTab";
import ProfitLossTab from "@/components/ProfitLossTab";
import ProfitLossCalendarTab from "@/components/ProfitLossCalendarTab";

const tabs = [
  { id: 'upload', label: 'アップロード' },
  { id: 'portfolio', label: 'ポートフォリオ' },
  { id: 'table', label: '上昇率' },
  { id: 'profit-loss', label: '損益レポート' },
  { id: 'profit-loss-calendar', label: '損益カレンダー' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-3">ポートフォリオ可視化ツール</h1>
          <p className="text-slate-600">CSVをアップロードし、グラフで分析・管理！</p>
        </header>

        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {activeTab === 'upload' && <UploadTab />}
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'table' && <TableTab />}
        {activeTab === 'profit-loss' && <ProfitLossTab />}
        {activeTab === 'profit-loss-calendar' && <ProfitLossCalendarTab />}
      </div>
    </main>
  );
}
