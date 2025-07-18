import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { TradeHistory } from '@/type';
import { parseTradeHistoryCsv } from '@/lib/tradeHistoryParser';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function saveTradeHistory(trades: TradeHistory[]) {
  // ユーザーIDを固定値で設定（実際のアプリではログイン中のユーザーIDを使用）
  const tradesWithUserId = trades.map(trade => ({
    ...trade,
    user_id: '123e4567-e89b-12d3-a456-426614174000'
  }));

  const { error } = await supabase
    .from('trade_history')
    .insert(tradesWithUserId);

  if (error) {
    console.error("Supabase insert error (trade_history):", error);
    throw new Error(error.message || "Failed to save trade history data.");
  }
}

export async function POST(request: Request) {
  console.log(`---start trade history import---`);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません。" },
        { status: 400 }
      );
    }

    // CSVファイルをパース
    const { trades, source } = await parseTradeHistoryCsv(file);

    if (trades.length === 0) {
      return NextResponse.json(
        { error: "有効な取引データが見つかりませんでした。" },
        { status: 400 }
      );
    }

    // データベースに保存
    await saveTradeHistory(trades);

    return NextResponse.json({
      message: "取引履歴の取り込みが完了しました。",
      count: trades.length,
      source: source
    }, { status: 200 });

  } catch (err: any) {
    console.error("Trade history import error:", err);
    return NextResponse.json(
      { error: err.message || "取引履歴の取り込みに失敗しました。" },
      { status: 500 }
    );
  }
}
