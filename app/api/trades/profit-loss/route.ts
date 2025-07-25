
// app/api/trades/profit-loss/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateProfitLoss, Trade } from '@/lib/profitLossCalculator';

// 他のAPIと同様に、認証をシンプルにするため固定のクライアントとユーザーIDを使用
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // import APIと同樣の固定値

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get('yearMonth'); // 例: '2024-07'

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return NextResponse.json({ error: '年月を YYYY-MM 形式で指定してください' }, { status: 400 });
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

    // 3. グループごとに損益を計算
    let allProfitLosses: any[] = [];
    for (const key in tradesByGroup) {
      const groupTrades = tradesByGroup[key];
      const profitLosses = calculateProfitLoss(groupTrades, yearMonth);
      allProfitLosses = allProfitLosses.concat(profitLosses);
    }

    // 4. 銘柄ごとに損益を集計
    const summary = allProfitLosses.reduce((acc, record) => {
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

    const summarizedProfitLoss = Object.values(summary).map((s: any) => ({
      symbol: s.symbol,
      name: s.name,
      quantity: s.totalQuantity,
      avgSellPrice: s.totalSellValue / s.totalQuantity,
      avgBuyPrice: s.totalBuyValue / s.totalQuantity,
      profitLoss: s.totalProfitLoss,
      currency: s.currency,
    }));

    return NextResponse.json(summarizedProfitLoss);

  } catch (error) {
    console.error('Profit/loss calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : '損益計算中にエラーが発生しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
