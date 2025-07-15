export async function fetchAvailableDates(): Promise<string[]> {
  const res = await fetch('/api/portfolio/dates');
  if (!res.ok) throw new Error('日付履歴の取得に失敗しました。');
  const data = await res.json();
  return data.dates;
}

export async function savePortfolio(
  date: string,
  broker: string,
  total_asset: number,
  stocks: { name: string; quantity: number; price: number; value: number; }[]
) {
    console.log(`date:${date}`)
    console.log(`broker:${broker}`)
    console.log(`total_asset:${total_asset}`)
    console.log(stocks)
  const res = await fetch('/api/portfolio/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, broker, total_asset, stocks }),
  });
  console.log(`res:${res}`)
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '保存に失敗しました');
  }
}

export async function fetchPortfolio(date: string) {
  const res = await fetch(`/api/portfolio/fetch?date=${date}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || '履歴取得に失敗しました');
  }
  return await res.json();
}
