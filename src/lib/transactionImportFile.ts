import * as XLSX from "xlsx";

export type ImportFileRow = Record<string, string | number>;

const supportedExtensions = [".csv", ".xlsx", ".xls"];

const getExtension = (fileName: string) =>
  fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

export const isSupportedImportFile = (fileName: string) =>
  supportedExtensions.includes(getExtension(fileName));

export async function parseTransactionImportFile(file: File): Promise<ImportFileRow[]> {
  if (!isSupportedImportFile(file.name)) {
    throw new Error("Upload a CSV, XLSX, or XLS file.");
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, {
    type: "array",
    cellDates: false,
    raw: false,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ImportFileRow>(worksheet, {
    defval: "",
    raw: false,
  });

  return rows.filter((row) =>
    Object.values(row).some((value) => String(value || "").trim() !== ""),
  );
}
