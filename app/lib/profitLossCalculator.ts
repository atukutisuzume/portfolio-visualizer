
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

/**
 * FIFO方式で株式の売却損益を計算する
 * @param trades - 特定の銘柄、口座、通貨の全取引履歴（日付昇順）
 * @param targetYearMonth - 計算対象の年月 (例: '2024-07')
 * @returns 指定した年月の売却に対する損益レコードの配列
 */
export const calculateProfitLoss = (
  trades: Trade[],
  targetYearMonth: string
): ProfitLossRecord[] => {
  const buys = trades
    .filter((t) => t.side === 'buy')
    .map(t => ({ ...t, remaining: t.quantity })); // 残量を追跡
  
  const sells = trades.filter(
    (t) =>
      t.side === 'sell' &&
      t.trade_date.startsWith(targetYearMonth)
  );

  const profitLossRecords: ProfitLossRecord[] = [];

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

    const avgBuyPrice = totalCostOfBuys / (sell.quantity - sellQuantityRemaining);
    const profitLoss = (sell.price - avgBuyPrice) * sell.quantity;

    profitLossRecords.push({
      symbol: sell.symbol,
      name: sell.name,
      sellDate: sell.trade_date,
      quantity: sell.quantity,
      sellPrice: sell.price,
      avgBuyPrice: isNaN(avgBuyPrice) ? 0 : avgBuyPrice,
      profitLoss: isNaN(profitLoss) ? 0 : profitLoss,
      currency: sell.currency,
    });
  }

  return profitLossRecords;
};
