import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function POST(request: Request) {
  const { stock_id, label_id } = await request.json();

  if (!stock_id || !label_id) {
    return NextResponse.json(
      { error: "Stock ID and Label ID are required." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('stock_labels')
      .insert([{ stock_id, label_id }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error (stock_labels):", error);
      if (error.code === '23505') { // primary key violation
        return NextResponse.json(
          { error: `This stock is already associated with this label.` },
          { status: 409 }
        );
      }
      throw new Error(error.message || "Failed to save association.");
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
