
// app/api/trades/profit-loss/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateProfitLoss, Trade, ProfitLossRecord, ProfitLossSummary } from '@/lib/profitLossCalculator';

// 他のAPIと同様に、認証をシンプルにするため固定のクライアントとユーザーIDを使用
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // import APIと同樣の固定値

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period'); // 例: '2024-07', '2024', 'all'

  if (!period) {
    return NextResponse.json({ error: '期間を指定してください' }, { status: 400 });
  }

  try {
    // 1. 関連する全取引履歴を取得
    const { data: trades, error } = await supabase
      .from('trade_history')
      .select('id, trade_date, symbol, name, side, quantity, price, currency, account_type')
      .eq('user_id', FAKE_USER_ID) // 固定のユーザーIDでフィルタリング
      .order('trade_date', { ascending: true });

    if (error) throw error;

    // 2. 銘柄ごと、口座ごと、通貨ごとに取引をグループ化
    const tradesByGroup = trades.reduce<Record<string, Trade[]>>((acc, trade) => {
      const key = `${trade.symbol}-${trade.account_type}-${trade.currency}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(trade as Trade);
      return acc;
    }, {});

    // 3. グループごとに損益を計算し、通貨ごとに結果を集約
    let allProfitLossRecords: ProfitLossRecord[] = [];
    const summaryByCurrency: Record<string, any> = {};

    for (const key in tradesByGroup) {
      const groupTrades = tradesByGroup[key];
      const summary: ProfitLossSummary = calculateProfitLoss(groupTrades, period);
      const currency = groupTrades[0].currency; // グループの通貨

      if (!summaryByCurrency[currency]) {
        summaryByCurrency[currency] = {
          totalProfitLoss: 0,
          totalWins: 0,
          totalLosses: 0,
          winningTrades: 0,
          losingTrades: 0,
        };
      }

      allProfitLossRecords.push(...summary.records);
      summaryByCurrency[currency].totalProfitLoss += summary.totalProfitLoss;
      summaryByCurrency[currency].totalWins += summary.totalWins;
      summaryByCurrency[currency].totalLosses += summary.totalLosses;
      summaryByCurrency[currency].winningTrades += summary.winningTrades;
      summaryByCurrency[currency].losingTrades += summary.losingTrades;
    }

    // 4. 銘柄ごとに損益を集計
    const summaryBySymbol = allProfitLossRecords.reduce<Record<string, any>>((acc, record) => {
      const { symbol, name, quantity, sellPrice, avgBuyPrice, profitLoss, currency } = record;
      if (!acc[symbol]) {
        acc[symbol] = {
          symbol,
          name,
          totalQuantity: 0,
          totalSellValue: 0,
          totalBuyValue: 0,
          totalProfitLoss: 0,
          currency,
        };
      }
      acc[symbol].totalQuantity += quantity;
      acc[symbol].totalSellValue += sellPrice * quantity;
      acc[symbol].totalBuyValue += avgBuyPrice * quantity;
      acc[symbol].totalProfitLoss += profitLoss;
      return acc;
    }, {});

    const summarizedProfitLoss = Object.values(summaryBySymbol).map((s: any) => ({
      symbol: s.symbol,
      name: s.name,
      quantity: s.totalQuantity,
      avgSellPrice: s.totalSellValue / s.totalQuantity,
      avgBuyPrice: s.totalBuyValue / s.totalQuantity,
      profitLoss: s.totalProfitLoss,
      currency: s.currency,
    }));

    // 5. 通貨ごとの最終サマリーを計算
    const finalSummary: Record<string, any> = {};
    for (const currency in summaryByCurrency) {
      const data = summaryByCurrency[currency];
      const winRate = (data.winningTrades + data.losingTrades) > 0 ? data.winningTrades / (data.winningTrades + data.losingTrades) : 0;
      const avgWin = data.winningTrades > 0 ? data.totalWins / data.winningTrades : 0;
      const avgLoss = data.losingTrades > 0 ? Math.abs(data.totalLosses / data.losingTrades) : 0;
      const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

      finalSummary[currency] = {
        totalProfitLoss: data.totalProfitLoss,
        winRate,
        payoffRatio,
      };
    }

    const response = {
      records: summarizedProfitLoss,
      summary: finalSummary,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Profit/loss calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : '損益計算中にエラーが発生しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
