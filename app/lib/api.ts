import { Portfolio, PortfolioItem } from '@/type';
import { ProfitLossRecord } from './profitLossCalculator';

export async function fetchAvailableDates(): Promise<string[]> {
  const res = await fetch('/api/portfolio/dates');
  if (!res.ok) throw new Error('日付履歴の取得に失敗しました。');
  const data = await res.json();
  return data.dates;
}

export async function savePortfolioWithItems(
  portfolio: Portfolio,
  items: PortfolioItem[]
) {
  const res = await fetch('/api/portfolio/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolio, items }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '保存に失敗しました');
  }
}

export async function fetchPortfolio(date: string): Promise<{ items: PortfolioItem[], totalAsset: number }> {
  const res = await fetch(`/api/portfolio/fetch?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '履歴取得に失敗しました');
  }
  return await res.json();
}

export async function fetchLatestPortfolio(): Promise<{ items: PortfolioItem[], totalAsset: number, date: string }> {
  const res = await fetch('/api/portfolio/latest');
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '最新データの取得に失敗しました');
  }
  return await res.json();
}

export const importTradeHistory = async (file: File, source: string): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);

  const response = await fetch('/api/trades/import', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '取引履歴のインポートに失敗しました');
  }

  return response.json();
};

interface ProfitLossSummaryData {
  totalProfitLoss: number;
  winRate: number;
  payoffRatio: number;
}

interface ProfitLossSummary {
  [currency: string]: ProfitLossSummaryData;
}

export interface ProfitLossResponse {
  records: ProfitLossRecord[];
  summary: ProfitLossSummary;
}

export const fetchProfitLoss = async (period: string): Promise<ProfitLossResponse> => {
  const response = await fetch(`/api/trades/profit-loss?period=${period}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '損益データの取得に失敗しました');
  }
  return response.json();
};

export interface DailyData {
  change: number;
  totalAsset: number;
}

export const fetchDailyChanges = async (): Promise<Record<string, DailyData>> => {
  const response = await fetch('/api/portfolio/daily-change');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '日次変動データの取得に失敗しました');
  }
  return response.json();
};

export interface MonthlyCompositionData {
  date: string;
  [key: string]: string | number;
}

export const fetchMonthlyComposition = async (month: string): Promise<MonthlyCompositionData[]> => {
  const response = await fetch(`/api/portfolio/monthly-composition?month=${month}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '月次構成データの取得に失敗しました');
  }
  return response.json();
};
