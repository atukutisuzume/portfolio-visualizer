import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { Portfolio, PortfolioItem } from '@/type';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

async function savePortfolioWithItems(portfolio: Portfolio, items: PortfolioItem[]) {
  const portfolioWithUser = { ...portfolio, user_id: '123e4567-e89b-12d3-a456-426614174000', total_asset: portfolio.total_asset };

  const { data: portfolioData, error: portfolioError } = await supabase
    .from('portfolios')
    .insert(portfolioWithUser)
    .select('id')
    .single();

  if (portfolioError) {
    console.error("Supabase insert error (portfolios):", portfolioError);
    throw new Error(portfolioError.message || "Failed to save portfolio data.");
  }

  const portfolioId = portfolioData.id;

  const itemsWithPortfolioId = items.map(item => ({ ...item, portfolio_id: portfolioId }));

  const { error: itemsError } = await supabase
    .from('portfolio_items')
    .insert(itemsWithPortfolioId);

  if (itemsError) {
    console.error("Supabase insert error (portfolio_items):", itemsError);
    // ここでロールバック処理を入れることも検討
    throw new Error(itemsError.message || "Failed to save portfolio items.");
  }
}

export async function POST(request: Request) {
  console.log(`---start save---`);

  const { portfolio, items } = await request.json();

  if (!portfolio || !items) {
    return NextResponse.json(
      { error: "Missing required fields (portfolio, items)." },
      { status: 400 }
    );
  }

  try {
    await savePortfolioWithItems(portfolio, items);
    return NextResponse.json({ message: "保存成功" }, { status: 200 });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "保存失敗" },
      { status: 500 }
    );
  }
}
