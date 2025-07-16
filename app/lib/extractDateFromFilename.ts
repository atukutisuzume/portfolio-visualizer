export function extractDateFromFilename(filename: string): string {
  // YYYYMMDD または YYYYMMDD のパターンを検索
  const datePattern = /(\d{4})(\d{2})(\d{2})/; // YYYYMMDD
  const match = filename.match(datePattern);

  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    return `${year}-${month}-${day}`;
  } else {
    throw new Error("ファイル名に日付が見つかりません");
  }
}
