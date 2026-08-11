import { apexGraphql } from "./api";
import type { ExcelImportKind } from "@/constants/excelImport";

export type ApexExcelImportResult = {
  importedCount: number;
  skippedCount: number;
  message: string | null;
  errors: { row: number; message: string }[];
};

/**
 * Apex-admin bulk seed. Backend must expose `apexImportTenantExcel`.
 * Rows are JSON matching the sample template column keys for `kind`.
 * Imports are written as ready-to-use / authorized records so onboarding
 * can skip the normal multi-step approval path.
 */
export async function apexImportTenantExcel(input: {
  tinNumber: string;
  kind: ExcelImportKind;
  rows: Record<string, unknown>[];
}): Promise<ApexExcelImportResult> {
  const data = await apexGraphql<{ apexImportTenantExcel: ApexExcelImportResult }>(
    `mutation($tin: String!, $kind: String!, $rows: JSON!) {
      apexImportTenantExcel(tinNumber: $tin, kind: $kind, rows: $rows) {
        importedCount
        skippedCount
        message
        errors { row message }
      }
    }`,
    {
      tin: input.tinNumber,
      kind: input.kind,
      rows: input.rows,
    },
  );
  return data.apexImportTenantExcel;
}
