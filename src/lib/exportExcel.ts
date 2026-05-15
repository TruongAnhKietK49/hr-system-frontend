import * as XLSX from "xlsx";

export type ExcelCellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;
export type ExcelRow = Record<string, ExcelCellValue>;

function getTimestamp() {
  const now = new Date();

  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join("");
}

function sanitizeSheetName(sheetName: string) {
  return (
    sheetName
      .replace(/[\\/?*\\[\]:]/g, " ")
      .slice(0, 31)
      .trim() || "Sheet"
  );
}

function getColumnWidths(rows: ExcelRow[]) {
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  return headers.map((header) => {
    const maxContentLength = rows.reduce((maxLength, row) => {
      const value = row[header];
      const content =
        value instanceof Date
          ? value.toLocaleDateString("vi-VN")
          : String(value ?? "");

      return Math.max(maxLength, content.length);
    }, header.length);

    return { wch: Math.min(Math.max(maxContentLength + 2, 12), 36) };
  });
}

function createWorksheet(rows: ExcelRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}], {
    skipHeader: rows.length === 0,
  });

  worksheet["!cols"] = getColumnWidths(rows);

  return worksheet;
}

export function exportRowsToExcel({
  rows,
  fileName,
  sheetName,
}: {
  rows: ExcelRow[];
  fileName: string;
  sheetName: string;
}) {
  const workbook = XLSX.utils.book_new();
  const worksheet = createWorksheet(rows);

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sanitizeSheetName(sheetName),
  );
  XLSX.writeFile(workbook, `${fileName}_${getTimestamp()}.xlsx`);
}

export function exportWorkbookToExcel({
  sheets,
  fileName,
}: {
  sheets: Array<{
    sheetName: string;
    rows: ExcelRow[];
  }>;
  fileName: string;
}) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(
      workbook,
      createWorksheet(sheet.rows),
      sanitizeSheetName(sheet.sheetName),
    );
  });

  XLSX.writeFile(workbook, `${fileName}_${getTimestamp()}.xlsx`);
}
