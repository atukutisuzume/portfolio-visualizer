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
      .from("portfolios")
      .select("data_date")
      .order("data_date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error); // エラー詳細をログに出力
      throw new Error(error.message || "Failed to fetch dates from Supabase");
    }

    // 取得した日付データから重複を除外してJSONレスポンスとして返す
    const uniqueDates = [...new Set(data.map((d) => d.data_date))];
    return NextResponse.json({ dates: uniqueDates });

  } catch (err: any) {
    console.error("API error:", err); // API処理中のエラーをログに出力
    // エラーメッセージを含んだJSONレスポンスと500ステータスを返す
    return NextResponse.json(
      { error: err.message || "Failed to retrieve dates." },
      { status: 500 }
    );
  }
}