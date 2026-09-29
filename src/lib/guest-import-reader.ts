/**
 * Browser-only: read an uploaded .csv / .xlsx file into a string grid.
 * Kept separate from guest-import.ts so parser libraries never reach the server bundle.
 */
import Papa from "papaparse";

export const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"] as const;

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function readCsv(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      // Excel "CSV UTF-8" exports include a BOM; Papa strips it automatically.
      complete: (result) => {
        // Only fail on structural errors; ragged rows are fine (missing cells → "").
        const fatal = result.errors.find((e) => e.type === "Quotes");
        if (fatal) reject(new Error(`CSV error on row ${(fatal.row ?? 0) + 1}: ${fatal.message}`));
        else resolve(result.data.map((row) => row.map(cellToString)));
      },
      error: (err) => reject(err),
    });
  });
}

async function readXlsx(file: File): Promise<string[][]> {
  // Lazy-load: the Excel parser is only downloaded when someone actually uploads a .xlsx.
  const { readSheet } = await import("read-excel-file/browser");
  const data = await readSheet(file); // first sheet
  return data.map((row) => row.map(cellToString));
}

export async function readSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return readCsv(file);
  if (name.endsWith(".xlsx")) return readXlsx(file);
  if (name.endsWith(".xls")) {
    throw new Error('Old ".xls" files are not supported. In Excel choose File → Save As → "Excel Workbook (.xlsx)" or "CSV UTF-8".');
  }
  throw new Error("Unsupported file type. Please upload a .csv or .xlsx file.");
}

/** Build a CSV string (RFC 4180 quoting) — used for the "download links" export. */
export function toCsv(rows: string[][]): string {
  return Papa.unparse(rows, { quotes: true });
}
