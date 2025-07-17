import { NextResponse } from 'next/server';

// キャッシュ用のインメモリストレージ
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1時間

// Alpha Vantage APIから米国株データを取得
async function fetchUSStockData(symbol: string) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Alpha Vantage API key is not configured');
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
  console.log(url)
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data['Error Message']) {
    throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
  }

  if (data['Note']) {
    throw new Error('Alpha Vantage API rate limit exceeded');
  }

  return data['Time Series (Daily)'];
}

// Yahoo Finance APIから日本株データを取得
async function fetchJPStockData(symbol: string) {
  const tmpSymbol = /^\d+$/.test(symbol) ? symbol + '.T' : symbol
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${tmpSymbol}?range=1mo&interval=1d`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(url)
  
  if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
    throw new Error('No data found for this symbol');
  }

  return data.chart.result[0];
}

// 日付から指定日数前の価格を取得
function getPriceFromDaysAgo(priceData: any, daysAgo: number, isUS: boolean) {
//   if (isUS) {
//     // Alpha Vantage形式
//     const dates = Object.keys(priceData).sort().reverse();
//     if (dates.length <= daysAgo) return null;
    
//     const targetDate = dates[daysAgo];
//     return parseFloat(priceData[targetDate]['4. close']);
//   } else {
    // Yahoo Finance形式
    const timestamps = priceData.timestamp;
    const closes = priceData.indicators.quote[0].close;
    console.log(`daysAgo:${daysAgo}`)
    console.log(closes.length)

    
    if (!timestamps || !closes ) return null;
    
    const targetIndex = timestamps.length - 1 - daysAgo;
    let res = closes[targetIndex]
    console.log(`first res:${res}`)
    if (!res) {
        res = closes[targetIndex + 1]
    }
    if (!res) {
        res = closes[targetIndex + 2]
    }
    if (!res) {
        res = closes[targetIndex + 3]
    }
    if (!res) {
        res = closes[targetIndex + 4]
    }
    
    console.log(`res:${res}`)
    return res
//   }
}

// 変化率を計算
function calculateChangeRate(currentPrice: number, pastPrice: number | null): number | null {
  if (pastPrice === null || pastPrice === 0) return null;
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const currency = searchParams.get('currency');

  if (!symbol || !currency) {
    return NextResponse.json({ error: 'Symbol and currency parameters are required' }, { status: 400 });
  }

  const cacheKey = `${symbol}-${currency}`;
  const now = Date.now();

  // キャッシュチェック
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }
  }

  try {
    const isUS = currency === 'USD';
    let priceData;
    let currentPrice;

    // if (isUS) {
    //   priceData = await fetchUSStockData(symbol);
    //   const dates = Object.keys(priceData).sort().reverse();
    //   if (dates.length === 0) {
    //     throw new Error('No price data available');
    //   }
    //   currentPrice = parseFloat(priceData[dates[0]]['4. close']);
    // } else {
      priceData = await fetchJPStockData(symbol);
      const closes = priceData.indicators.quote[0].close;
      if (!closes || closes.length === 0) {
        throw new Error('No price data available');
      }
      currentPrice = closes[closes.length - 1];
    // }

    // 各期間の価格を取得
    const oneDayAgoPrice = getPriceFromDaysAgo(priceData, 1, isUS);
    const twoWeeksAgoPrice = getPriceFromDaysAgo(priceData, 10, isUS);
    const oneMonthAgoPrice = getPriceFromDaysAgo(priceData, 20, isUS);
    console.log(`oneMonthAgoPrice:${oneMonthAgoPrice}`)

    // 変化率を計算
    const result = {
      symbol,
      currentPrice,
      oneDayChange: calculateChangeRate(currentPrice, oneDayAgoPrice),
      twoWeeksChange: calculateChangeRate(currentPrice, twoWeeksAgoPrice),
      oneMonthChange: calculateChangeRate(currentPrice, oneMonthAgoPrice),
      timestamp: now
    };

    // キャッシュに保存
    cache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stock data fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
