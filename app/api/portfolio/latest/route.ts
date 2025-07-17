// app/api/portfolio/latest/route.ts

import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { PortfolioItem } from '@/type';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function GET() {
  try {
    // 1. 最新のポートフォリオを取得
    const { data: portfolios, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id, total_asset, created_at")
      .order("created_at", { ascending: false })
      .limit(50); // 最新50件を取得して同じ日付のものをまとめる

    if (portfolioError) throw portfolioError;

    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json({ error: "No portfolio data found." }, { status: 404 });
    }

    // 最新の日付を取得
    const latestDate = portfolios[0].created_at;
    
    // 最新の日付のポートフォリオをすべて取得
    const latestPortfolios = portfolios.filter(p => p.created_at === latestDate);

    // 2. 最新ポートフォリオのIDを使って、関連する銘柄をすべて取得
    const portfolioIds = latestPortfolios.map(p => p.id);
    const { data: allItems, error: itemsError } = await supabase
      .from("portfolio_items")
      .select("*")
      .in("portfolio_id", portfolioIds);

    if (itemsError) throw itemsError;

    // 3. データをマージ
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

    // 3a. 総資産を合算
    const totalAsset = latestPortfolios.reduce((sum, p) => sum + p.total_asset, 0);

    // 4. USD換算と上位15銘柄以外の集約
    const processedItems = mergedItems.map(item => ({
      ...item,
      value: item.currency === "USD" ? item.value * 145 : item.value
    }));

    const sortedItems = [...processedItems].sort((a, b) => b.value - a.value);

    let finalDisplayItems: PortfolioItem[] = [];
    if (sortedItems.length > 15) {
      finalDisplayItems = sortedItems.slice(0, 15);
      const otherValue = sortedItems.slice(15).reduce((sum, item) => sum + item.value, 0);
      finalDisplayItems.push({
        code: "OTHER",
        name: "その他",
        quantity: 0,
        price: 0,
        value: otherValue,
        average_price: 0,
        gain_loss: 0,
        currency: "JPY",
        position_type: "cash",
      });
    } else {
      finalDisplayItems = sortedItems;
    }

    // 5. マージしたデータを返す
    return NextResponse.json({
      items: finalDisplayItems,
      totalAsset: totalAsset,
    }, { status: 200 });

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message || "取得失敗" }, { status: 500 });
  }
}
