import { apexGraphql } from "./api";
import type { ExcelImportKind } from "@/constants/excelImport";

export type ApexExcelImportResult = {
  importedCount: number;
  skippedCount: number;
  message: string | null;
  errors: { row: number; message: string }[];
};

/**
 * Stock-out / Fresh Bazaar rows are much heavier per write than item registration.
 * Keep chunks small so each Vercel invocation finishes before the gateway 504.
 */
const IMPORT_CHUNK_SIZE: Record<ExcelImportKind, number> = {
  item_registration: 40,
  purchase_request: 40,
  stockout_request: 8,
};

/** Per-chunk client timeout (Vercel may still 504 earlier on free/pro limits). */
const IMPORT_CHUNK_TIMEOUT_MS = 90_000;

const MAX_CHUNK_RETRIES = 2;

const IMPORT_MUTATION = `mutation($tin: String!, $kind: String!, $rows: JSON!) {
  apexImportTenantExcel(tinNumber: $tin, kind: $kind, rows: $rows) {
    importedCount
    skippedCount
    message
    errors { row message }
  }
}`;

function isRetryableImportError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const ax = error as {
    code?: string;
    response?: { status?: number };
    message?: string;
  };
  if (ax.code === "ECONNABORTED") return true;
  const status = ax.response?.status;
  if (status === 504 || status === 502 || status === 503) return true;
  const msg = String(ax.message || "");
  return /timed out|504|502|503|FUNCTION_INVOCATION_TIMEOUT/i.test(msg);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function apexImportTenantExcelChunk(input: {
  tinNumber: string;
  kind: ExcelImportKind;
  rows: Record<string, unknown>[];
}): Promise<ApexExcelImportResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt += 1) {
    try {
      const data = await apexGraphql<{
        apexImportTenantExcel: ApexExcelImportResult;
      }>(
        IMPORT_MUTATION,
        {
          tin: input.tinNumber,
          kind: input.kind,
          rows: input.rows,
        },
        { timeoutMs: IMPORT_CHUNK_TIMEOUT_MS },
      );
      return data.apexImportTenantExcel;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_CHUNK_RETRIES && isRetryableImportError(error)) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
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
  const chunkSize = IMPORT_CHUNK_SIZE[kind] ?? 25;

  if (total <= chunkSize) {
    const result = await apexImportTenantExcelChunk({ tinNumber, kind, rows });
    options?.onProgress?.(
      result.importedCount + (result.errors?.length ?? 0),
      total,
    );
    return result;
  }

  let importedCount = 0;
  let skippedCount = 0;
  const errors: { row: number; message: string }[] = [];

  for (let start = 0; start < total; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
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

  const batchCount = Math.ceil(total / chunkSize);
  const message =
    errors.length === 0
      ? `Imported ${importedCount} row(s) in ${batchCount} batch(es).`
      : `Imported ${importedCount} of ${total} row(s); ${errors.length} failed.`;

  return {
    importedCount,
    skippedCount,
    message,
    errors,
  };
}
