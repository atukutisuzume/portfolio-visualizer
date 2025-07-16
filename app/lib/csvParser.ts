import Papa from "papaparse";
import { PortfolioItem } from "@/type";
import Encoding from "encoding-japanese";

export async function parseCsv(file: File): Promise<{ portfolio: PortfolioItem[], totalAsset: number | null }> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

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

    const result = parseCsvText(text, file.name);
    if (!result || result.portfolio.length === 0) {
        throw new Error("parseCsv.未知のCSVフォーマットです。楽天証券またはmoomoo証券のCSVをアップロードしてください。");
    }
    return result;
}

function parseCsvText(text: string, fileName: string): { portfolio: PortfolioItem[], totalAsset: number | null } {
    if (text.includes("■特定口座")) {
        return parseRakutenCsv(text);
    }
    if (text.includes('"コード","銘柄名","口座区分"')) {
        return parseMoomooCsv(text, fileName);
    }
    return { portfolio: [], totalAsset: null };
}

export function parseRakutenCsv(text: string): { portfolio: PortfolioItem[], totalAsset: number | null } {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");

    const sectionStartIndex = lines.findIndex(line => line.startsWith("■特定口座"));
    if (sectionStartIndex === -1) {
        return { portfolio: [], totalAsset: null };
    }

    const headerIndex = lines.findIndex((line, index) => index > sectionStartIndex && line.startsWith("銘柄コード"));
    if (headerIndex === -1) {
        return { portfolio: [], totalAsset: null };
    }

    const dataLines = lines.slice(headerIndex + 1).filter(line => {
        return !line.includes("特定口座合計") && line.trim() !== "" && !line.startsWith("■");
    });

    const headerLine = lines[headerIndex];
    const headers = Papa.parse(headerLine, { delimiter: ",", skipEmptyLines: true }).data[0] as string[];

    const portfolio: PortfolioItem[] = dataLines.map(line => {
        const values = Papa.parse(line, { delimiter: ",", skipEmptyLines: true }).data[0] as string[];
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
            obj[header] = values[i] || "";
        });

        return {
            code: obj["銘柄コード"] || "",
            name: obj["銘柄名"] || "",
            quantity: parseFloat((obj["保有数量［株］"] || "0").replace(/,/g, "")),
            price: parseFloat((obj["現在値［円］"] || "0").replace(/,/g, "")),
            value: parseFloat((obj["時価評価額［円］"] || "0").replace(/,/g, "")),
            average_price: parseFloat((obj["平均取得価額［円］"] || "0").replace(/,/g, "")),
            gain_loss: parseFloat((obj["評価損益［円］"] || "0").replace(/,/g, "")),
            currency: "JPY",
            position_type: "cash",
        };
    });
    
    const totalAsset = portfolio.reduce((sum, item) => sum + item.value, 0);

    return { portfolio, totalAsset };
}

function parseMoomooCsv(text: string, fileName: string): { portfolio: PortfolioItem[], totalAsset: number | null } {
    const isMargin = fileName.includes("信用");
    const positionType = isMargin ? "margin" : "cash";

    const data = Papa.parse<any>(text, {
        header: true,
        skipEmptyLines: true
    });

    const portfolio: PortfolioItem[] = data.data.map((row: any) => ({
        code: row["コード"] || "",
        name: row["銘柄名"] || "",
        quantity: parseFloat((row["数量"] || "0").replace(/,/g, "")),
        price: parseFloat((row["現在値"] || "0").replace(/,/g, "")),
        value: parseFloat((row["評価額"] || "0").replace(/,/g, "")),
        average_price: parseFloat((row["平均取得単価"] || "0").replace(/,/g, "")),
        gain_loss: parseFloat((row["損益"] || "0").replace(/,/g, "")),
        currency: row["通貨"] === "JPY" ? "JPY" : "USD",
        position_type: positionType,
    }));

    const totalAsset = portfolio.reduce((sum, item) => sum + item.value, 0);

    return { portfolio, totalAsset };
}