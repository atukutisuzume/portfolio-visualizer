// app/api/portfolio/monthly-composition/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // e.g., "2025-08"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Month parameter in YYYY-MM format is required.' }, { status: 400 });
  }

  try {
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().split('T')[0];

    // 1. 指定された月のポートフォリオを取得
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, data_date')
      .eq('user_id', FAKE_USER_ID)
      .gte('data_date', startDate)
      .lte('data_date', endDate);

    if (portfolioError) throw portfolioError;
    if (!portfolios || portfolios.length === 0) {
      return NextResponse.json([]); // データがない場合は空配列を返す
    }

    // 2. 関連するポートフォリオアイテムを取得
    const portfolioIds = portfolios.map(p => p.id);
    const { data: items, error: itemsError } = await supabase
      .from('portfolio_items')
      .select('portfolio_id, code, value, currency')
      .in('portfolio_id', portfolioIds);

    if (itemsError) throw itemsError;

    // 3. 日付ごとにデータを整形
    const portfolioDateMap = new Map(portfolios.map(p => [p.id, p.data_date]));
    
    const dailyComposition = new Map<string, Record<string, number>>();

    for (const item of items) {
      const date = portfolioDateMap.get(item.portfolio_id);
      if (!date) continue;

      const valueInJPY = item.currency === 'USD' ? item.value * 145 : item.value; // 仮のレート

      if (!dailyComposition.has(date)) {
        dailyComposition.set(date, {});
      }

      const dayData = dailyComposition.get(date)!;
      dayData[item.code] = (dayData[item.code] || 0) + valueInJPY;
    }

    // 4. グラフライブラリが扱いやすい形式に変換
    const chartData = Array.from(dailyComposition.entries())
      .map(([date, values]) => ({
        date,
        ...values,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Monthly composition fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
