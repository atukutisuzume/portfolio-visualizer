// app/api/portfolio/fetch/route.ts

import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { PortfolioItem } from '@/type';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date parameter is required." }, { status: 400 });
  }

  try {
    // 1. 指定された日付のポートフォリオをすべて取得
    const { data: portfolios, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id, total_asset")
      .eq("created_at", date);

    if (portfolioError) throw portfolioError;

    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json({ error: "Portfolio not found for this date." }, { status: 404 });
    }

    // 2. 取得した全ポートフォリオのIDを使って、関連する銘柄をすべて取得
    const portfolioIds = portfolios.map(p => p.id);
    const { data: allItems, error: itemsError } = await supabase
      .from("portfolio_items")
      .select("*")
      .in("portfolio_id", portfolioIds);

    if (itemsError) throw itemsError;

    // 3. データをマージ
    // 3a. 総資産を合算
    const totalAsset = portfolios.reduce((sum, p) => sum + p.total_asset, 0);

    // 3b. 銘柄をコードごとに集約
    const mergedItemsMap = new Map<string, PortfolioItem>();
    allItems?.forEach(item => {
      if (mergedItemsMap.has(item.code)) {
        const existing = mergedItemsMap.get(item.code)!;
        existing.quantity += item.quantity;
        existing.value += item.value;
        existing.gain_loss += item.gain_loss;
      } else {
        mergedItemsMap.set(item.code, { ...item });
      }
    });

    const mergedItems = Array.from(mergedItemsMap.values());

    // 4. マージしたデータを返す
    return NextResponse.json({
      items: mergedItems,
      totalAsset: totalAsset,
    }, { status: 200 });

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message || "取得失敗" }, { status: 500 });
  }
}
