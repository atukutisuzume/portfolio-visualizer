"use client";
import { useState } from "react";
import TabNavigation from "@/components/TabNavigation";
import UploadTab from "@/components/UploadTab";
import PortfolioTab from "@/components/PortfolioTab";
import TableTab from "@/components/TableTab";
import ProfitLossTab from "@/components/ProfitLossTab";
import ProfitLossCalendarTab from "@/components/ProfitLossCalendarTab";
import CompositionHistoryTab from "@/components/CompositionHistoryTab"; // 追加
import MonthlySymbolProfitLossTab from '@/components/MonthlySymbolProfitLossTab';
import LabelTypeTab from "@/components/LabelTypeTab";

const tabs = [
  { id: 'upload', label: 'アップロード' },
  { id: 'label', label: '各種マスタ登録' },
  { id: 'portfolio', label: 'ポートフォリオ' },
  { id: 'table', label: '上昇率' },
  { id: 'profit-loss', label: '損益レポート' },
  { id: 'profit-loss-calendar', label: '損益カレンダー' },
  { id: 'composition-history', label: '保有率遷移' }, // 追加
  { id: 'monthly-pl', label: '月次銘柄損益' },
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
        {activeTab === 'label' && <LabelTypeTab />}
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'table' && <TableTab />}
        {activeTab === 'profit-loss' && <ProfitLossTab />}
        {activeTab === 'profit-loss-calendar' && <ProfitLossCalendarTab />}
        {activeTab === 'composition-history' && <CompositionHistoryTab />} {/* 追加 */}
        {activeTab === 'monthly-pl' && <MonthlySymbolProfitLossTab />}
      </div>
    </main>
  );
}