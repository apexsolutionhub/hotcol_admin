import { apexGraphql } from "./api";
import type { ExcelImportKind } from "@/constants/excelImport";

export type ApexExcelImportResult = {
  importedCount: number;
  skippedCount: number;
  message: string | null;
  errors: { row: number; message: string }[];
};

/** Keep each GraphQL call under Vercel / client timeout limits. */
const IMPORT_CHUNK_SIZE = 50;

/** Per-chunk timeout — large batches can be slow on cold serverless DB. */
const IMPORT_CHUNK_TIMEOUT_MS = 120_000;

const IMPORT_MUTATION = `mutation($tin: String!, $kind: String!, $rows: JSON!) {
  apexImportTenantExcel(tinNumber: $tin, kind: $kind, rows: $rows) {
    importedCount
    skippedCount
    message
    errors { row message }
  }
}`;

async function apexImportTenantExcelChunk(input: {
  tinNumber: string;
  kind: ExcelImportKind;
  rows: Record<string, unknown>[];
}): Promise<ApexExcelImportResult> {
  const data = await apexGraphql<{ apexImportTenantExcel: ApexExcelImportResult }>(
    IMPORT_MUTATION,
    {
      tin: input.tinNumber,
      kind: input.kind,
      rows: input.rows,
    },
    { timeoutMs: IMPORT_CHUNK_TIMEOUT_MS },
  );
  return data.apexImportTenantExcel;
}

/**
 * Apex-admin bulk seed. Backend must expose `apexImportTenantExcel`.
 * Rows are JSON matching the sample template column keys for `kind`.
 * Imports are written as ready-to-use / authorized records so onboarding
 * can skip the normal multi-step approval path.
 */
export async function apexImportTenantExcel(
  input: {
    tinNumber: string;
    kind: ExcelImportKind;
    rows: Record<string, unknown>[];
  },
  options?: {
    onProgress?: (imported: number, total: number) => void;
  },
): Promise<ApexExcelImportResult> {
  const { tinNumber, kind, rows } = input;
  const total = rows.length;

  if (total <= IMPORT_CHUNK_SIZE) {
    const result = await apexImportTenantExcelChunk({ tinNumber, kind, rows });
    options?.onProgress?.(result.importedCount, total);
    return result;
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors: { row: number; message: string }[] = [];

  for (let start = 0; start < total; start += IMPORT_CHUNK_SIZE) {
    const chunk = rows.slice(start, start + IMPORT_CHUNK_SIZE);
    const result = await apexImportTenantExcelChunk({
      tinNumber,
      kind,
      rows: chunk,
    });

    importedCount += result.importedCount;
    skippedCount += result.skippedCount;
    for (const err of result.errors ?? []) {
      errors.push({
        row: start + err.row,
        message: err.message,
      });
    }
    options?.onProgress?.(Math.min(start + chunk.length, total), total);
  }

  const message =
    errors.length === 0
      ? `Imported ${importedCount} row(s) in ${Math.ceil(total / IMPORT_CHUNK_SIZE)} batch(es).`
      : `Imported ${importedCount} of ${total} row(s); ${errors.length} failed.`;

  return {
    importedCount,
    skippedCount,
    message,
    errors,
  };
}
