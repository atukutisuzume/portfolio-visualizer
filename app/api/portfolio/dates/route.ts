// app/api/portfolio/dates/route.ts

import { NextResponse } from 'next/server'; // Next.js App RouterのAPIルートではnext/serverからインポート
import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントのインポート

// Supabaseクライアントの初期化
// 環境変数はサーバーサイドで安全にアクセスされます
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

// GETメソッドのハンドラーを名前付きエクスポート
export async function GET(request: Request) { // Requestオブジェクトを受け取る
  try {
    const { data, error } = await supabase
      .from("portfolio")
      .select("date")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error); // エラー詳細をログに出力
      throw new Error(error.message || "Failed to fetch dates from Supabase");
    }

    // 取得した日付データを抽出してJSONレスポンスとして返す
    return NextResponse.json({ dates: data.map((d) => d.date) });

  } catch (err: any) {
    console.error("API error:", err); // API処理中のエラーをログに出力
    // エラーメッセージを含んだJSONレスポンスと500ステータスを返す
    return NextResponse.json(
      { error: err.message || "Failed to retrieve dates." },
      { status: 500 }
    );
  }
}