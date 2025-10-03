
// app/api/portfolio/symbol-history/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { USD_TO_JPY_RATE } from '@/lib/constants';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const getMonthRange = (month: string) => {
    const [year, monthIndex] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
    const endDate = new Date(Date.UTC(year, monthIndex, 0));
    return {
        firstDay: startDate.toISOString().split('T')[0],
        lastDay: endDate.toISOString().split('T')[0],
    };
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const symbol = searchParams.get('symbol');

    if (!month || !symbol) {
        return NextResponse.json({ error: 'monthとsymbolは必須です' }, { status: 400 });
    }

    try {
        const { firstDay, lastDay } = getMonthRange(month);

        const [
            { data: itemHistory, error: itemError },
            { data: portfolioHistoryRaw, error: portfolioError } // 変数名を変更
        ] = await Promise.all([
            supabase.from('portfolio_items')
                .select('data_date, quantity, value, currency') // currencyを追加
                .eq('code', symbol)
                .gte('data_date', firstDay)
                .lte('data_date', lastDay),
            supabase.from('portfolios')
                .select('data_date, total_asset')
                .gte('data_date', firstDay)
                .lte('data_date', lastDay)
                .order('data_date', { ascending: true }), // 日付順にソート
        ]);

        if (itemError || portfolioError) {
            console.error({ itemError, portfolioError });
            throw new Error('履歴データの取得に失敗しました');
        }

        // portfolioHistoryRaw を日付ごとに合計する
        const aggregatedPortfolioAssets: { [key: string]: number } = {};
        portfolioHistoryRaw.forEach(p => {
            if (p.total_asset > 0) { // total_assetが0のレコードは除外
                aggregatedPortfolioAssets[p.data_date] = (aggregatedPortfolioAssets[p.data_date] || 0) + p.total_asset;
            }
        });

        // 集計された総資産データから、日付順にソートされた配列を作成
        const portfolioHistory = Object.keys(aggregatedPortfolioAssets)
            .sort()
            .map(date => ({
                data_date: date,
                total_asset: aggregatedPortfolioAssets[date],
            }));

        console.log('[API DEBUG] Raw itemHistory dates:', itemHistory.map(i => i.data_date));
        console.log('[API DEBUG] Aggregated portfolioHistory dates:', portfolioHistory.map(p => p.data_date));

        const itemHistoryMap = new Map(itemHistory.map(i => [i.data_date, i]));
        console.log('[API DEBUG] itemHistoryMap keys:', Array.from(itemHistoryMap.keys()));

        // 総資産データが存在する日をグラフのX軸の基準とする
        const results = portfolioHistory.map(p => {
            const dateString = p.data_date;
            const totalAsset = p.total_asset;
            const item = itemHistoryMap.get(dateString);

            console.log(`[API DEBUG] Processing date: ${dateString}`);
            console.log(`[API DEBUG] -> item: ${JSON.stringify(item)}`);
            console.log(`[API DEBUG] -> totalAsset: ${totalAsset}`);

            if (item && totalAsset > 0) {
                // 銘柄データも総資産データもある日
                const exchangeRate = item.currency === 'USD' ? USD_TO_JPY_RATE : 1; // 換算レートを取得
                const itemValueInJPY = item.value * exchangeRate; // JPYに換算

                const calculatedQuantity = item.quantity;
                const calculatedHoldingRate = itemValueInJPY / totalAsset; // 換算後の値で計算
                console.log(`[API DEBUG] -> Calculated: quantity=${calculatedQuantity}, holdingRate=${calculatedHoldingRate}`);
                return {
                    date: dateString,
                    quantity: calculatedQuantity,
                    holdingRate: calculatedHoldingRate,
                };
            } else {
                if (totalAsset > 0 && !item) {
                    console.log(`[API DEBUG] Item not found in map for date: ${dateString}. Map has key? ${itemHistoryMap.has(dateString)}`);
                }
                // 総資産データはあるが、その日に銘柄を保有していなかった日、または総資産が0
                console.log(`[API DEBUG] -> Result: quantity=0, holdingRate=null (Condition: item=${!!item}, totalAsset=${totalAsset})`);
                return {
                    date: dateString,
                    quantity: 0,
                    holdingRate: null, // 保有率の線は途切れさせる
                };
            }
        });

        return NextResponse.json(results);

    } catch (error) {
        console.error('Symbol history fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : '計算中にエラーが発生しました';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
