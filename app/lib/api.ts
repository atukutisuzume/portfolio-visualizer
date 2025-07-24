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

export async function fetchLatestPortfolio(): Promise<{ items: PortfolioItem[], totalAsset: number }> {
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

export const fetchProfitLoss = async (yearMonth: string): Promise<ProfitLossRecord[]> => {
  const response = await fetch(`/api/trades/profit-loss?yearMonth=${yearMonth}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '損益データの取得に失敗しました');
  }
  return response.json();
};
