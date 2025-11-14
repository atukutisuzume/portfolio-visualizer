import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function POST(request: Request) {
  const { symbol, name, currency } = await request.json();

  if (!symbol || !name || !currency) {
    return NextResponse.json(
      { error: "Symbol, name, and currency are required." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('stocks')
      .insert([{ symbol, name, currency }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error (stocks):", error);
      if (error.code === '23505') { // unique_violation, assuming symbol is unique
        return NextResponse.json(
          { error: `Stock with symbol "${symbol}" already exists.` },
          { status: 409 }
        );
      }
      throw new Error(error.message || "Failed to save stock.");
    }
    
    return NextResponse.json({ message: "保存成功", data }, { status: 200 });

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "保存失敗" },
      { status: 500 }
    );
  }
}
