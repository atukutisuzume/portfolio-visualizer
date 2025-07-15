import Papa from "papaparse";
import { PortfolioData } from "@/types";
import Encoding from "encoding-japanese";

export async function parseCsv(file: File): Promise<PortfolioData[]> {
    const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // 文字コード判定＆変換
  const detected = Encoding.detect(uint8Array);
  let text = "";
  if (detected === "UTF8" || detected === "UTF-8") {
    text = new TextDecoder("utf-8").decode(uint8Array);
  } else {
    const unicodeArray = Encoding.convert(uint8Array, {
      to: "UNICODE",
      from: "SJIS",
    });
    text = Encoding.codeToString(unicodeArray);
  }

  const result = parseCsvText(text);
  if (!result || result.portfolio.length === 0) {
    throw new Error("parseCsv.未知のCSVフォーマットです。楽天証券またはmoomoo証券のCSVをアップロードしてください。");
  }
  return result.portfolio;
}

export async function parseCsvWithTotal(file: File): Promise<{ portfolio: PortfolioData[], totalAsset: number | null }> {
  const text = await file.text();
  const result = parseCsvText(text);
  if (!result || result.portfolio.length === 0) {
    throw new Error("parseCsvWithTotal.未知のCSVフォーマットです。楽天証券またはmoomoo証券のCSVをアップロードしてください。");
  }
  return result;
}

function parseCsvText(text: string): { portfolio: PortfolioData[], totalAsset: number | null } {
  if (text.includes("■現在の評価額合計")) {
    return parseRakutenCsv(text);
  }
  if (text.includes('"コード","銘柄名","口座区分"')) {
    return parseMoomooCsv(text);
  }
  return { portfolio: [], totalAsset: null };
}

export function parseRakutenCsv(text: string): { portfolio: PortfolioData[], totalAsset: number | null } {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

  let totalAsset: number | null = null;
  // ■現在の評価額合計 から総資産を拾う
  const totalLine = lines.find(line => line.startsWith("■現在の評価額合計"));
  if (totalLine) {
    const parts = totalLine.split(",");
    totalAsset = parseInt(parts[2]?.replace(/"/g, "").replace(/,/g, "") || "0", 10);
  }

  // ヘッダー行の探索（銘柄コードから始まる）
  const headerIndex = lines.findIndex(line => line.startsWith("銘柄コード"));
  if (headerIndex === -1) {
    return { portfolio: [], totalAsset };
  }

  // データ行を取得、最後の特定口座合計はスキップ
  const dataLines = lines.slice(headerIndex + 1).filter(line => {
    return !line.includes("特定口座合計") && line.trim() !== "";
  });

  // ヘッダー解析
  const headerLine = lines[headerIndex];
  const headers = Papa.parse(headerLine, { delimiter: ",", skipEmptyLines: true }).data[0] as string[];

  const portfolio = dataLines.map(line => {
    const values = Papa.parse(line, { delimiter: ",", skipEmptyLines: true }).data[0] as string[];
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || "";
    });

    return {
      name: obj["銘柄名"] || "",
      quantity: parseFloat((obj["保有数量［株］"] || "0").replace(/,/g, "")),
      price: parseFloat((obj["現在値［円］"] || "0").replace(/,/g, "")),
      value: parseFloat((obj["時価評価額［円］"] || "0").replace(/,/g, ""))
    };
  });

  return { portfolio, totalAsset };
}


function parseMoomooCsv(text: string): { portfolio: PortfolioData[], totalAsset: number | null } {
  const data = Papa.parse<string[]>(text, {
    header: true,
    skipEmptyLines: true
  });

  const portfolio = data.data.map(row => ({
    name: row["銘柄名"] || "",
    quantity: parseFloat((row["数量"] || "0").replace(/,/g, "")),
    price: parseFloat((row["現在値"] || "0").replace(/,/g, "")),
    value: parseFloat((row["評価額"] || "0").replace(/,/g, ""))
  }));

  return { portfolio, totalAsset: null };
}
