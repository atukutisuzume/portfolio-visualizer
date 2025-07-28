
// lib/profitLossCalculator.ts

// DBから取得する取引履歴の型
export interface Trade {
  id: string;
  trade_date: string; // ISO string date
  symbol: string;
  name: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  currency: string;
  account_type: string;
}

// 計算結果の損益レポートの行の型
export interface ProfitLossRecord {
  symbol: string;
  name: string;
  sellDate: string;
  quantity: number;
  sellPrice: number;
  avgBuyPrice: number;
  profitLoss: number;
  currency: string;
}

// 損益サマリーの型
export interface ProfitLossSummary {
  records: ProfitLossRecord[];
  totalProfitLoss: number;
  winRate: number;
  payoffRatio: number;
  totalWins: number;
  totalLosses: number;
  winningTrades: number;
  losingTrades: number;
}

/**
 * FIFO方式で株式の売却損益を計算する
 * @param trades - 特定の銘柄、口座、通貨の全取引履歴（日付昇順）
 * @param period - 計算対象の期間 (例: '2024-07', '2024', 'all')
 * @returns 指定した期間の売却に対する損益レコードの配列とサマリー
 */
export const calculateProfitLoss = (
  trades: Trade[],
  period: string
): ProfitLossSummary => {
  const buys = trades
    .filter((t) => t.side === 'buy')
    .map(t => ({ ...t, remaining: t.quantity })); // 残量を追跡

  const sells = trades.filter((t) => {
    if (t.side !== 'sell') return false;
    if (period === 'all') return true;
    return t.trade_date.startsWith(period);
  });

  const profitLossRecords: ProfitLossRecord[] = [];
  let totalProfitLoss = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let winningTrades = 0;
  let losingTrades = 0;

  for (const sell of sells) {
    let sellQuantityRemaining = sell.quantity;
    let totalCostOfBuys = 0;
    let buyIndex = 0;

    while (sellQuantityRemaining > 0 && buyIndex < buys.length) {
      const buy = buys[buyIndex];

      if (buy.remaining > 0) {
        const quantityToProcess = Math.min(sellQuantityRemaining, buy.remaining);
        
        totalCostOfBuys += quantityToProcess * buy.price;
        buy.remaining -= quantityToProcess;
        sellQuantityRemaining -= quantityToProcess;
      }

      if (buy.remaining === 0) {
        buyIndex++;
      }
    }

    if (sellQuantityRemaining > 0) {
      // 対応する購入履歴が不足している場合
      console.warn(`警告: ${sell.symbol} の売却に対応する購入履歴が不足しています。`);
      // 不足分は取得単価0として計算を続ける
    }

    const denominator = sell.quantity - sellQuantityRemaining;
    const avgBuyPrice = denominator > 0 ? totalCostOfBuys / denominator : 0;
    const profitLoss = (sell.price - avgBuyPrice) * sell.quantity;

    if (Number.isFinite(profitLoss)) {
      if (profitLoss > 0) {
        winningTrades++;
        totalWins += profitLoss;
      } else if (profitLoss < 0) {
        losingTrades++;
        totalLosses += profitLoss;
      }
      totalProfitLoss += profitLoss;
    }

    profitLossRecords.push({
      symbol: sell.symbol,
      name: sell.name,
      sellDate: sell.trade_date,
      quantity: sell.quantity,
      sellPrice: sell.price,
      avgBuyPrice: Number.isFinite(avgBuyPrice) ? avgBuyPrice : 0,
      profitLoss: Number.isFinite(profitLoss) ? profitLoss : 0,
      currency: sell.currency,
    });
  }

  const winRate = (winningTrades + losingTrades) > 0 ? winningTrades / (winningTrades + losingTrades) : 0;
  const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? Math.abs(totalLosses / losingTrades) : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

  return {
    records: profitLossRecords,
    totalProfitLoss,
    winRate,
    payoffRatio,
    totalWins,
    totalLosses,
    winningTrades,
    losingTrades,
  };
};
