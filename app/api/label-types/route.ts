import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export async function POST(request: Request) {
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json(
      { error: "Label type name is required." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('label_types')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error (label_types):", error);
      // Handle specific errors, e.g., unique constraint violation
      if (error.code === '23505') { // unique_violation
        return NextResponse.json(
          { error: `Label type "${name}" already exists.` },
          { status: 409 }
        );
      }
      throw new Error(error.message || "Failed to save label type.");
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
