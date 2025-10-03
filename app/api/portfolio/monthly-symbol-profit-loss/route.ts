
// app/api/portfolio/monthly-symbol-profit-loss/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
        console.log(`[API DEBUG] Calculating for month: ${month} (${firstDay} to ${lastDay})`);

        // 1. 必要なデータを並行して取得
        const [
            { data: portfolioStartRaw, error: errorStart },
            { data: portfolioEndRaw, error: errorEnd },
            { data: trades, error: errorTrades }
        ] = await Promise.all([
            // 月初以降で最も古いデータを取得するため、月全体のデータを日付昇順で取得
            supabase.from('portfolio_items')
                .select('code, name, quantity, price, currency, value')
                .gte('data_date', firstDay)
                .lte('data_date', lastDay)
                .order('data_date', { ascending: true }),
            // 月末以前で最も新しいデータを取得するため、月全体のデータを日付降順で取得
            supabase.from('portfolio_items')
                .select('code, quantity, price, currency, value') // valueを追加
                .gte('data_date', firstDay)
                .lte('data_date', lastDay)
                .order('data_date', { ascending: false }),
            supabase.from('trade_history').select('symbol, side, price, quantity, currency').eq('user_id', FAKE_USER_ID).gte('trade_date', firstDay).lte('trade_date', lastDay)
        ]);

        if (errorStart || errorEnd || errorTrades) {
            console.error({ errorStart, errorEnd, errorTrades });
            throw new Error('DBからのデータ取得に失敗しました。');
        }

        // 銘柄ごとに最初に出現するレコードのみを保持するヘルパー (日付でソート済みが前提)
        const getFirstOccurrenceItems = (items: any[] | null) => {
            if (!items) return [];
            const map = new Map();
            for (const item of items) {
                if (!map.has(item.code)) {
                    map.set(item.code, item);
                }
            }
            return Array.from(map.values());
        };

        const portfolioStart = getFirstOccurrenceItems(portfolioStartRaw);
        const portfolioEnd = getFirstOccurrenceItems(portfolioEndRaw);

        // 月末総資産を計算
        const totalAssetAtEnd = portfolioEnd.reduce((sum, item) => {
            const exchangeRate = item.currency === 'USD' ? 145 : 1;
            const itemValue = item.value || (item.price * item.quantity);
            return sum + (itemValue * exchangeRate);
        }, 0);

        console.log('[API DEBUG] Fetched and Processed Data:', {
            portfolioStartCount: portfolioStart.length,
            portfolioEndCount: portfolioEnd.length,
            tradesCount: trades?.length,
            totalAssetAtEnd,
        });

        // データを扱いやすいようにMapに変換
        const portfolioStartMap = new Map(portfolioStart.map(item => [item.code, item]));
        const portfolioEndMap = new Map(portfolioEnd.map(item => [item.code, item]));

        // 2. 関連するすべての銘柄コードを取得
        const allSymbols = new Set([
            ...portfolioStart.map(p => p.code),
            ...(trades?.map(t => t.symbol) || [])
        ]);

        console.log(`[API DEBUG] Found ${allSymbols.size} unique symbols to process:`, Array.from(allSymbols));

        // 3. 銘柄ごとに損益を計算
        const results = [];
        for (const symbol of allSymbols) {
            console.log(`[API DEBUG] Processing symbol: ${symbol}`);
            const startData = portfolioStartMap.get(symbol);
            const endData = portfolioEndMap.get(symbol);
            const symbolTrades = trades?.filter(t => t.symbol === symbol) || [];

            if (!startData) {
                console.log(`[API DEBUG] -> Skipped: No start data for symbol ${symbol}.`);
                continue;
            }
            
            const startPrice = startData.price;
            const name = startData.name;
            const currency = startData.currency || 'JPY'; // 通貨を特定、デフォルトはJPY
            const exchangeRate = currency === 'USD' ? 145 : 1;

            // 月末データがない場合は、月初データで代用（評価損益は0になる）
            const endPrice = endData?.price ?? startPrice;
            const endQuantity = endData?.quantity ?? 0;

            // 実現損益の計算
            let realizedPl = symbolTrades
                .filter(t => t.side === 'sell')
                .reduce((sum, trade) => {
                    return sum + (trade.price - startPrice) * trade.quantity;
                }, 0);

            // 評価損益の計算
            let unrealizedPl = (endPrice - startPrice) * endQuantity;

            // USDの場合は円換算
            realizedPl *= exchangeRate;
            unrealizedPl *= exchangeRate;

            const totalPl = realizedPl + unrealizedPl;
            const plPercentage = totalAssetAtEnd > 0 ? (totalPl / totalAssetAtEnd) : 0;

            console.log('[API DEBUG] -> Calculated PL:', {
                symbol,
                realizedPl,
                unrealizedPl,
                totalPl,
                plPercentage,
                startPrice,
                endPrice,
                endQuantity,
                tradeCount: symbolTrades.length,
            });

            if (totalPl !== 0 || realizedPl !== 0 || unrealizedPl !== 0) {
                 results.push({
                    symbol,
                    name,
                    realizedPl,
                    unrealizedPl,
                    totalPl,
                    plPercentage,
                });
            } else {
                console.log(`[API DEBUG] -> Not added to results because all PL are zero.`);
            }
        }

        console.log(`[API DEBUG] Final results count: ${results.length}`);
        
        const responsePayload = {
            results: results.sort((a, b) => b.totalPl - a.totalPl),
            totalAssetAtEnd,
        };

        console.log('[API DEBUG] Final response payload:', JSON.stringify(responsePayload, null, 2));

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('Monthly symbol profit/loss calculation error:', error);
        const errorMessage = error instanceof Error ? error.message : '計算中にエラーが発生しました';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
