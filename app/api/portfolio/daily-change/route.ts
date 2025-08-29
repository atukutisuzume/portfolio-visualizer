// app/api/portfolio/daily-change/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export async function GET() {
  try {
    // 1. ユーザーのポートフォリオ履歴を日付順に取得
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('data_date, total_asset')
      .eq('user_id', FAKE_USER_ID)
      .order('data_date', { ascending: true });

    if (error) throw error;

    // 2. 日付ごとに総資産を合算
    const dailyAssets = new Map<string, number>();
    portfolios.forEach(p => {
      const date = new Date(p.data_date).toISOString().split('T')[0];
      const existingAsset = dailyAssets.get(date) || 0;
      dailyAssets.set(date, existingAsset + p.total_asset);
    });

    // 3. マップを時系列の配列に変換
    const sortedDailyAssets = Array.from(dailyAssets.entries())
      .map(([date, asset]) => ({ date, asset }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. 前日比と総資産を計算
    const dailyData: Record<string, { change: number; totalAsset: number }> = {};
    // 最初のデータポイントをセット
    if (sortedDailyAssets.length > 0) {
      const first = sortedDailyAssets[0];
      dailyData[first.date] = { change: 0, totalAsset: first.asset };
    }

    for (let i = 1; i < sortedDailyAssets.length; i++) {
      const current = sortedDailyAssets[i];
      const previous = sortedDailyAssets[i - 1];
      
      let change = 0;
      if (previous.asset > 0) {
        change = ((current.asset - previous.asset) / previous.asset) * 100;
      }
      dailyData[current.date] = { change, totalAsset: current.asset };
    }

    return NextResponse.json(dailyData);

  } catch (error) {
    console.error('Daily change calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : '日次変動率の計算中にエラーが発生しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
