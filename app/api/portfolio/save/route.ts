// app/api/portfolio/save/route.ts

import { NextResponse } from 'next/server'; // Next.js App RouterのAPIルートではnext/serverからインポート
import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントのインポート

// Supabaseクライアントの初期化
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

// POSTメソッドのハンドラーを名前付きエクスポート
export async function POST(request: Request) { // Requestオブジェクトを受け取る
  console.log(`---start save---`);

  // RequestオブジェクトからJSONボディを解析
  const { date, broker, total_asset, stocks } = await request.json();

  // 必須フィールドのバリデーション（オプションだが推奨）
  if (!date || !broker || total_asset === undefined || !stocks) {
    return NextResponse.json(
      { error: "Missing required fields (date, broker, total_asset, stocks)." },
      { status: 400 } // Bad Request
    );
  }

  try {
    const { error } = await supabase.from("portfolio").insert([
      { date, broker, total_asset, stocks },
    ]);

    if (error) {
      console.log(error)
      console.log(error.message)
      console.error("Supabase insert error:", error); // エラー詳細をログに出力
      throw new Error(error.message || "Failed to save portfolio data to Supabase.");
    }

    // 成功時のJSONレスポンスと200ステータスを返す
    return NextResponse.json({ message: "保存成功" }, { status: 200 });

  } catch (err: any) {
    console.error(err)
    console.error(err.message)
    console.error("API error:", err); // API処理中のエラーをログに出力
    // エラーメッセージを含んだJSONレスポンスと500ステータスを返す
    return NextResponse.json(
      { error: err.message || "保存失敗" },
      { status: 500 }
    );
  }
}