// app/api/trades/profit-loss/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateProfitLoss, Trade, ProfitLossRecord, ProfitLossSummary } from '@/lib/profitLossCalculator';
import { USD_TO_JPY_RATE } from '@/lib/constants';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// ページネーションを使って全取引履歴を取得するヘルパー関数
async function fetchAllTrades(userId: string): Promise<Trade[]> {
  const PAGE_SIZE = 1000;
  let allTrades: Trade[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('trade_history')
      .select('id, trade_date, symbol, name, side, quantity, price, currency, account_type')
      .eq('user_id', userId)
      .order('trade_date', { ascending: true })
      .range(from, to);

    if (error) {
      console.error(`[API] Error fetching trades on page ${page}:`, error);
      throw error;
    }

    if (data) {
      allTrades = allTrades.concat(data as Trade[]);
    }

    if (!data || data.length < PAGE_SIZE) {
      hasMore = false;
    } else {
      page++;
    }
  }
  console.log(`[API] Total trades fetched from DB: ${allTrades.length}`);
  return allTrades;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');
  console.log(`[API] Received request for period: ${period}`);

  if (!period) {
    return NextResponse.json({ error: '期間を指定してください' }, { status: 400 });
  }

  try {
    // 1. ページネーションですべての取引履歴を取得
    const trades = await fetchAllTrades(FAKE_USER_ID);

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
      const currency = groupTrades[0]?.currency;
      if (!currency) continue;

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

    const response: any = {
      records: summarizedProfitLoss,
      summary: finalSummary,
    };

    // 6. 全期間が指定された場合、月次サマリーを追加
    if (period === 'all') {
      const monthlySummary = allProfitLossRecords.reduce((acc, record) => {
        const month = record.sellDate.slice(0, 7); // "YYYY-MM"
        if (!acc[month]) {
          acc[month] = 0;
        }
        
        let profitLoss = record.profitLoss;
        if (record.currency === 'USD') {
          profitLoss *= USD_TO_JPY_RATE; // USDをJPYに換算
        }
        acc[month] += profitLoss;

        return acc;
      }, {} as Record<string, number>);
      response.monthlySummary = monthlySummary;
    }

    console.log(`[API] Sending final response with ${response.records.length} records.`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Profit/loss calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : '損益計算中にエラーが発生しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}