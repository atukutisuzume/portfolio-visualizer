import Papa from "papaparse";
import { TradeHistory } from "@/type";
import Encoding from "encoding-japanese";

export async function parseTradeHistoryCsv(file: File): Promise<{ trades: TradeHistory[], source: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const detected = Encoding.detect(uint8Array);
    let text = "";
    if (detected === "UTF8") {
        text = new TextDecoder("utf-8").decode(uint8Array);
    } else {
        const unicodeArray = Encoding.convert(uint8Array, {
            to: "UNICODE",
            from: "SJIS",
        });
        text = Encoding.codeToString(unicodeArray);
    }

    const result = parseTradeHistoryText(text, file.name);
    if (!result || result.trades.length === 0) {
        throw new Error("未知の取引履歴CSVフォーマットです。楽天証券またはmoomoo証券の取引履歴CSVをアップロードしてください。");
    }
    return result;
}

function parseTradeHistoryText(text: string, fileName: string): { trades: TradeHistory[], source: string } {
    // 楽天証券の取引履歴を判定
    if (text.includes("約定日,受渡日,銘柄コード")) {
        return parseRakutenTradeHistory(text);
    }
    
    // moomoo取引履歴を判定
    if (text.includes('"売買方向","銘柄コード","銘柄名"')) {
        const isMargin = fileName.includes("信用") || text.includes("信用区分");
        return parseMoomooTradeHistory(text, isMargin);
    }
    
    return { trades: [], source: "" };
}

function parseRakutenTradeHistory(text: string): { trades: TradeHistory[], source: string } {
    const data = Papa.parse<any>(text, {
        header: true,
        skipEmptyLines: true
    });

    const trades: TradeHistory[] = data.data
        .filter((row: any) => row["約定日"] && row["銘柄コード"] && row["売買区分"])
        .map((row: any) => {
            const tradeDate = parseRakutenDate(row["約定日"]);
            const side = row["売買区分"] === "買付" ? "buy" : "sell";
            const quantity = parseFloat((row["数量［株］"] || "0").replace(/,/g, ""));
            const price = parseFloat((row["単価［円］"] || "0").replace(/,/g, ""));
            const amount = parseFloat((row["受渡金額［円］"] || "0").replace(/,/g, ""));
            
            // 市場から通貨を判定
            const market = row["市場名称"] || "";
            const currency = determineCurrency(market, row["銘柄コード"]);

            return {
                trade_date: tradeDate,
                symbol: row["銘柄コード"] || "",
                name: row["銘柄名"] || "",
                market: market,
                account_type: row["口座区分"] || "",
                trade_type: row["取引区分"] || "",
                side: side,
                quantity: quantity,
                price: price,
                amount: Math.abs(amount), // 受渡金額は負の値の場合があるので絶対値にする
                currency: currency,
                source: "rakuten"
            } as TradeHistory;
        });

    return { trades, source: "rakuten" };
}

function parseMoomooTradeHistory(text: string, isMargin: boolean): { trades: TradeHistory[], source: string } {
    const data = Papa.parse<any>(text, {
        header: true,
        skipEmptyLines: true
    });

    const trades: TradeHistory[] = data.data
        .filter((row: any) => {
            // 約定済みの取引のみを対象とする
            return row["取引状況"] === "約定済" && row["約定日時"] && row["銘柄コード"];
        })
        .map((row: any) => {
            const tradeDate = parseMoomooDate(row["約定日時"]);
            const side = determineMoomooSide(row["売買方向"]);
            const quantity = parseFloat(row["約定数量"] || "0");
            const price = parseFloat(row["約定価格"] || "0");
            const amount = parseFloat(row["約定金額"] || "0");
            
            // 通貨情報を取得
            const currency = row["通貨"] === "JPY" ? "JPY" : "USD";
            const market = row["市場"] || "";

            return {
                trade_date: tradeDate,
                symbol: row["銘柄コード"] || "",
                name: row["銘柄名"] || "",
                market: market,
                account_type: row["口座区分"] || "",
                trade_type: isMargin ? "信用" : "現物",
                side: side,
                quantity: quantity,
                price: price,
                amount: amount,
                currency: currency,
                source: "moomoo"
            } as TradeHistory;
        });

    return { trades, source: "moomoo" };
}

function parseRakutenDate(dateStr: string): string {
    // "2025/6/18" -> "2025-06-18"
    if (!dateStr) return "";
    
    const parts = dateStr.replace(/"/g, "").split("/");
    if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    return dateStr;
}

function parseMoomooDate(dateTimeStr: string): string {
    // "2025/07/16 09:39:28 ET" -> "2025-07-16"
    if (!dateTimeStr) return "";
    
    const datePart = dateTimeStr.split(" ")[0];
    const parts = datePart.split("/");
    if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1].padStart(2, "0");
        const day = parts[2].padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    return dateTimeStr;
}

function determineMoomooSide(direction: string): "buy" | "sell" {
    if (direction.includes("買") || direction.includes("新規買")) {
        return "buy";
    } else if (direction.includes("売") || direction.includes("返済売")) {
        return "sell";
    }
    return "buy"; // デフォルト
}

function determineCurrency(market: string, symbol: string): "JPY" | "USD" {
    // 米国株の場合
    if (market.includes("米国") || market === "NASDAQ" || market === "NYSE") {
        return "USD";
    }
    
    // 日本株の場合
    if (market.includes("東証") || market.includes("JNX") || market.includes("JAX") || market === "市場外") {
        return "JPY";
    }
    
    // 銘柄コードから判定
    if (symbol && /^[A-Z]+$/.test(symbol)) {
        return "USD"; // アルファベットのみの場合は米国株
    }
    
    return "JPY"; // デフォルトは日本円
}
