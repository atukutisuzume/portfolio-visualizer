
// app/api/portfolio/monthly-symbol-profit-loss/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { USD_TO_JPY_RATE } from '@/lib/constants';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
// 定数として定義されているユーザーIDを使用
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// 月の初日と最終日を取得するヘルパー
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
    const month = searchParams.get('month'); // e.g., "2024-10"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: '月を "YYYY-MM" 形式で指定してください' }, { status: 400 });
    }

    try {
        const { firstDay, lastDay } = getMonthRange(month);
        const [year, monthIndex] = month.split('-').map(Number);
        const endOfPreviousMonth = new Date(Date.UTC(year, monthIndex - 1, 0));
        const endOfPreviousMonthStr = endOfPreviousMonth.toISOString().split('T')[0];

        console.log(`[API DEBUG] Calculating for month: ${month} (Base Date: ${endOfPreviousMonthStr}, End Date: ${lastDay})`);

        // 全銘柄のコードと名前のマップを作成
        const { data: allItems, error: allItemsError } = await supabase
            .from('portfolio_items')
            .select('code, name');

        if (allItemsError) {
            console.error({ allItemsError });
            throw new Error('全銘柄の名称リスト取得に失敗しました。');
        }
        const symbolNameMap = new Map<string, string>();
        for (const item of allItems) {
            if (!symbolNameMap.has(item.code)) {
                symbolNameMap.set(item.code, item.name);
            }
        }

        // 1. 前月のデータがある最終日を取得
        const { data: lastPortfolioInPrevMonth, error: lastPortfolioError } = await supabase
            .from('portfolios')
            .select('data_date')
            .lte('data_date', endOfPreviousMonthStr)
            .order('data_date', { ascending: false })
            .limit(1)
            .single();

        if (lastPortfolioError && lastPortfolioError.code !== 'PGRST116') { // 'PGRST116' (query returned no rows) is not an error here
            console.error({ lastPortfolioError });
            throw new Error('前月の最終ポートフォリオ日付の取得に失敗しました。');
        }
        const startDate = lastPortfolioInPrevMonth?.data_date;
        console.log(`[API DEBUG] Determined start date for portfolio items: ${startDate}`);

        // 当月のデータがある最終日を取得
        const { data: lastPortfolioInCurrentMonth, error: currentPortfolioError } = await supabase
            .from('portfolios')
            .select('data_date')
            .gte('data_date', firstDay)
            .lte('data_date', lastDay)
            .order('data_date', { ascending: false })
            .limit(1)
            .single();

        if (currentPortfolioError && currentPortfolioError.code !== 'PGRST116') {
            console.error({ currentPortfolioError });
            throw new Error('当月の最終ポートフォリオ日付の取得に失敗しました。');
        }
        const endDate = lastPortfolioInCurrentMonth?.data_date;
        console.log(`[API DEBUG] Determined end date for portfolio items: ${endDate}`);

        // 2. 必要なデータを並行して取得
        const [
            { data: portfolioStart, error: errorStart },
            { data: portfolioEnd, error: errorEnd },
            { data: trades, error: errorTrades }
        ] = await Promise.all([
            // 月初ポートフォリオ項目を取得
            startDate
                ? supabase.from('portfolio_items').select('data_date, code, name, quantity, price, currency, value').eq('data_date', startDate)
                : Promise.resolve({ data: [], error: null }),
            // 月末ポートフォリオ項目を取得
            endDate
                ? supabase.from('portfolio_items').select('data_date, code, name, quantity, price, currency, value').eq('data_date', endDate)
                : Promise.resolve({ data: [], error: null }),
            // 月内の取引履歴を取得
            supabase.from('trade_history').select('symbol, side, price, quantity, currency, trade_date').eq('user_id', FAKE_USER_ID).gte('trade_date', firstDay).lte('trade_date', lastDay)
        ]);

        if (errorStart || errorEnd || errorTrades) {
            console.error({ errorStart, errorEnd, errorTrades });
            throw new Error('DBからのデータ取得に失敗しました。');
        }

        // 月末総資産を計算
        const totalAssetAtEnd = (portfolioEnd || []).reduce((sum, item) => {
            const exchangeRate = item.currency === 'USD' ? USD_TO_JPY_RATE : 1;
            const itemValue = item.value || (item.price * item.quantity);
            return sum + (itemValue * exchangeRate);
        }, 0);

        console.log('[API DEBUG] Fetched and Processed Data:', {
            portfolioStartCount: portfolioStart?.length || 0,
            portfolioEndCount: portfolioEnd?.length || 0,
            tradesCount: trades?.length || 0,
            totalAssetAtEnd,
        });

        // データを扱いやすいようにMapに変換
        const portfolioStartMap = new Map((portfolioStart || []).map(item => [item.code, item]));
        const portfolioEndMap = new Map((portfolioEnd || []).map(item => [item.code, item]));

        // 2. 関連するすべての銘柄コードを取得
        const allSymbols = new Set([
            ...(portfolioStart?.map(p => p.code) || []),
            ...(portfolioEnd?.map(p => p.code) || []),
            ...(trades?.map(t => t.symbol) || [])
        ]);

        console.log(`[API DEBUG] Found ${allSymbols.size} unique symbols to process:`, Array.from(allSymbols));

        // 3. 銘柄ごとに損益を計算
        const results = [];
        for (const symbol of allSymbols) {
            const startData = portfolioStartMap.get(symbol);
            const endData = portfolioEndMap.get(symbol);
            const symbolTrades = trades?.filter(t => t.symbol === symbol) || [];

            const currency = startData?.currency || endData?.currency || symbolTrades[0]?.currency || 'JPY';
            const exchangeRate = currency === 'USD' ? USD_TO_JPY_RATE : 1;

            // 月初の評価額
            const startValue = (startData?.value || (startData?.price * startData?.quantity) || 0);

            // 月末の評価額
            const endValue = (endData?.value || (endData?.price * endData?.quantity) || 0);

            // 月内の売買金額
            const boughtAmount = symbolTrades
                .filter(t => t.side === 'buy')
                .reduce((sum, t) => sum + t.price * t.quantity, 0);

            const soldAmount = symbolTrades
                .filter(t => t.side === 'sell')
                .reduce((sum, t) => sum + t.price * t.quantity, 0);

            // 新しい計算ロジックを適用
            const totalPl = (endValue + soldAmount) - (startValue + boughtAmount);
            
            // 損益の内訳を計算
            const realizedPl = soldAmount - boughtAmount; // 売買によるキャッシュフロー
            const unrealizedPl = endValue - startValue; // 保有資産の評価額変動

            // 円換算
            const totalPlJpy = totalPl * exchangeRate;
            const realizedPlJpy = realizedPl * exchangeRate;
            const unrealizedPlJpy = unrealizedPl * exchangeRate;

            const plPercentage = totalAssetAtEnd > 0 ? (totalPlJpy / totalAssetAtEnd) : 0;

            if (totalPlJpy !== 0) {
                 results.push({
                    symbol,
                    name: startData?.name || endData?.name || symbolNameMap.get(symbol) || symbol,
                    realizedPl: realizedPlJpy,
                    unrealizedPl: unrealizedPlJpy,
                    totalPl: totalPlJpy,
                    plPercentage,
                });
            }
        }

        console.log(`[API DEBUG] Final results count: ${results.length}`);
        
        const responsePayload = {
            results: results.sort((a, b) => b.totalPl - a.totalPl),
            totalAssetAtEnd,
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('Monthly symbol profit/loss calculation error:', error);
        const errorMessage = error instanceof Error ? error.message : '計算中にエラーが発生しました';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
