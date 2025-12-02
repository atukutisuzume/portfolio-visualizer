// app/api/portfolio/monthly-symbol-profit-loss/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { USD_TO_JPY_RATE } from '@/lib/constants';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

const getMonthRange = (month: string) => {
    const [year, monthIndex] = month.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthIndex - 1, 1));
    const endDate = new Date(Date.UTC(year, monthIndex, 0));
    return {
        firstDay: startDate.toISOString().split('T')[0],
        lastDay: endDate.toISOString().split('T')[0],
    };
};

const mergeDuplicateItems = (items: any[] | null) => {
    if (!items) return [];
    const merged = new Map<string, any>();
    for (const item of items) {
        const currentItemValue = item.value || (item.price * item.quantity);
        if (merged.has(item.code)) {
            const existing = merged.get(item.code);
            existing.quantity += item.quantity;
            existing.value = (existing.value || 0) + currentItemValue;
            if (existing.quantity !== 0) {
                existing.price = existing.value / existing.quantity;
            }
        } else {
            merged.set(item.code, { ...item, value: currentItemValue });
        }
    }
    return Array.from(merged.values());
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: '月を "YYYY-MM" 形式で指定してください' }, { status: 400 });
    }

    try {
        const logFilePath = path.join(process.cwd(), 'pl_calculation_log.jsonl');
        fs.writeFileSync(logFilePath, '');

        const { firstDay, lastDay } = getMonthRange(month);
        const endOfPreviousMonthStr = new Date(Date.UTC(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 0)).toISOString().split('T')[0];

        // --- 1. 基準日を4つ決定する ---
        const { data: p_usd_start } = await supabase.from('portfolios').select('data_date').lte('data_date', endOfPreviousMonthStr).order('data_date', { ascending: false }).limit(1).single();
        const USD_START_DATE = p_usd_start?.data_date;

        const { data: p_jpy_start } = USD_START_DATE ? await supabase.from('portfolios').select('data_date').lt('data_date', USD_START_DATE).order('data_date', { ascending: false }).limit(1).single() : { data: null };
        const JPY_START_DATE = p_jpy_start?.data_date;

        const { data: p_jpy_end } = await supabase.from('portfolios').select('data_date').gte('data_date', firstDay).lte('data_date', lastDay).order('data_date', { ascending: false }).limit(1).single();
        const JPY_END_DATE = p_jpy_end?.data_date;

        const { data: p_usd_end } = JPY_END_DATE ? await supabase.from('portfolios').select('data_date').lt('data_date', JPY_END_DATE).order('data_date', { ascending: false }).limit(1).single() : { data: null };
        const USD_END_DATE = p_usd_end?.data_date;
        
        // --- 2. 必要なデータを並行取得 ---
        const valuationDates = [...new Set([JPY_START_DATE, JPY_END_DATE, USD_START_DATE, USD_END_DATE])].filter(Boolean);
        const tradeFetchStartDate = JPY_START_DATE || USD_START_DATE;
        const tradeFetchEndDate = JPY_END_DATE;

        const [
            { data: portfolioItems, error: portfolioItemsError },
            { data: trades, error: tradesError }
        ] = await Promise.all([
            supabase.from('portfolio_items').select('data_date, code, name, quantity, price, currency, value').in('data_date', valuationDates),
            (tradeFetchStartDate && tradeFetchEndDate)
                ? supabase.from('trade_history').select('symbol, side, price, quantity, currency, trade_date').eq('user_id', FAKE_USER_ID).gte('trade_date', tradeFetchStartDate).lte('trade_date', tradeFetchEndDate)
                : Promise.resolve({ data: [], error: null })
        ]);

        if (portfolioItemsError || tradesError) throw new Error('DBからのデータ取得に失敗しました。');

        // --- 3. データを日付ごとに整理・マージ ---
        const portfolioJpyStart = mergeDuplicateItems(portfolioItems?.filter(item => item.data_date === JPY_START_DATE) || []);
        const portfolioJpyEnd = mergeDuplicateItems(portfolioItems?.filter(item => item.data_date === JPY_END_DATE) || []);
        const portfolioUsdStart = mergeDuplicateItems(portfolioItems?.filter(item => item.data_date === USD_START_DATE) || []);
        const portfolioUsdEnd = mergeDuplicateItems(portfolioItems?.filter(item => item.data_date === USD_END_DATE) || []);

        const portfolioJpyStartMap = new Map(portfolioJpyStart.map(item => [item.code, item]));
        const portfolioJpyEndMap = new Map(portfolioJpyEnd.map(item => [item.code, item]));
        const portfolioUsdStartMap = new Map(portfolioUsdStart.map(item => [item.code, item]));
        const portfolioUsdEndMap = new Map(portfolioUsdEnd.map(item => [item.code, item]));

        // --- 4. 計算準備 ---
        const totalAssetAtEnd = portfolioJpyEnd.reduce((sum, item) => {
             const exchangeRate = item.currency === 'USD' ? USD_TO_JPY_RATE : 1;
             return sum + ((item.value || item.price * item.quantity) * exchangeRate);
        }, 0);

        const allSymbols = new Set([
            ...portfolioJpyStart.map(p => p.code), ...portfolioJpyEnd.map(p => p.code),
            ...portfolioUsdStart.map(p => p.code), ...portfolioUsdEnd.map(p => p.code),
            ...(trades?.map(t => t.symbol) || [])
        ]);

        // --- 5. 銘柄ごとに損益を計算 ---
        const results = [];
        for (const symbol of allSymbols) {
            const tempItem = portfolioJpyStartMap.get(symbol) || portfolioJpyEndMap.get(symbol) || portfolioUsdStartMap.get(symbol) || portfolioUsdEndMap.get(symbol);
            const currency = tempItem?.currency || trades?.find(t=>t.symbol === symbol)?.currency || 'JPY';
            const exchangeRate = currency === 'USD' ? USD_TO_JPY_RATE : 1;

            let startData, endData, symbolTrades;
            if (currency === 'USD') {
                startData = portfolioUsdStartMap.get(symbol);
                endData = portfolioUsdEndMap.get(symbol);
                symbolTrades = trades?.filter(t => t.symbol === symbol && t.trade_date >= USD_START_DATE && t.trade_date <= USD_END_DATE) || [];
            } else { // JPY
                startData = portfolioJpyStartMap.get(symbol);
                endData = portfolioJpyEndMap.get(symbol);
                symbolTrades = trades?.filter(t => t.symbol === symbol && t.trade_date >= JPY_START_DATE && t.trade_date <= JPY_END_DATE) || [];
            }

            const startValue = startData?.value || (startData?.price * startData?.quantity) || 0;
            const endValue = endData?.value || (endData?.price * endData?.quantity) || 0;

            const boughtAmount = symbolTrades.filter(t => t.side === 'buy').reduce((sum, t) => sum + t.price * t.quantity, 0);
            const soldAmount = symbolTrades.filter(t => t.side === 'sell').reduce((sum, t) => sum + t.price * t.quantity, 0);

            const totalPl = (endValue + soldAmount) - (startValue + boughtAmount);
            const realizedPl = soldAmount - boughtAmount;
            const unrealizedPl = endValue - startValue;

            const totalPlJpy = totalPl * exchangeRate;
            const realizedPlJpy = realizedPl * exchangeRate;
            const unrealizedPlJpy = unrealizedPl * exchangeRate;
            const plPercentage = totalAssetAtEnd > 0 ? (totalPlJpy / totalAssetAtEnd) : 0;

            const name = tempItem?.name || 'N/A';

            const logData = {
                symbol, name, currency,
                calculation_inputs: {
                    start_of_month: { date: startData?.data_date, value: startValue * exchangeRate },
                    end_of_month: { date: endData?.data_date, value: endValue * exchangeRate },
                    trades: symbolTrades.map(t => ({ date: t.trade_date, side: t.side, price: t.price, quantity: t.quantity, amount: t.price * t.quantity * exchangeRate })),
                },
                calculation_outputs: { boughtAmount: boughtAmount * exchangeRate, soldAmount: soldAmount * exchangeRate, totalPl: totalPlJpy, realizedPl: realizedPlJpy, unrealizedPl: unrealizedPlJpy }
            };
            fs.appendFileSync(logFilePath, JSON.stringify(logData, null, 2) + '\n---\n');

            if (totalPlJpy !== 0) {
                 results.push({ symbol, name, realizedPl: realizedPlJpy, unrealizedPl: unrealizedPlJpy, totalPl: totalPlJpy, plPercentage });
            }
        }
        
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