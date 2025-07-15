// app/api/portfolio/fetch/route.ts

import { NextResponse } from 'next/server'; // App RouterのAPIルートで使用
import { createClient } from "@supabase/supabase-js"; // Supabaseクライアントのインポート

// Supabaseクライアントの初期化
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

// GETメソッドのハンドラーを名前付きエクスポート
export async function GET(request: Request) { // Requestオブジェクトを受け取る
  // URLオブジェクトを作成し、クエリパラメータを解析
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // 'date' クエリパラメータを取得

  if (!date) {
    return NextResponse.json(
      { error: "Date parameter is required." },
      { status: 400 } // Bad Request
    );
  }

  try {
    const { data, error } = await supabase
      .from("portfolio")
      .select("*") // 全てのカラムを選択
      .eq("date", date) // 'date' カラムがクエリパラメータと一致するレコードをフィルタリング
      .single(); // 結果が1件であることを期待

      console.log(data)
      console.log(error)

    if (error) {
      console.error("Supabase fetch error:", error); // エラー詳細をログに出力
      // 特定のエラーメッセージ（例: レコードが見つからない場合）に応じて異なるステータスを返すことも可能
      // if (error.code === 'PGRST116') { // 例えば、PostgRESTのエラーコード
      //   return NextResponse.json({ error: "Portfolio data not found for this date." }, { status: 404 });
      // }
      throw new Error(error.message || "Failed to fetch portfolio data from Supabase.");
    }

    // 成功時のJSONレスポンスと200ステータスを返す
    return NextResponse.json({
      portfolioData: data.stocks,
      totalAsset: data.total_asset,
    }, { status: 200 });

  } catch (err: any) {
    console.error("API error:", err); // API処理中のエラーをログに出力
    // エラーメッセージを含んだJSONレスポンスと500ステータスを返す
    return NextResponse.json(
      { error: err.message || "取得失敗" },
      { status: 500 }
    );
  }
}

// もしこのエンドポイントで他のHTTPメソッドをサポートする必要があるなら、
// 同様に名前付きエクスポートで関数を定義します。
// export async function POST(request: Request) { ... }