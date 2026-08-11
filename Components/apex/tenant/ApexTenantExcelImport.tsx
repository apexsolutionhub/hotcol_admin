"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  ApexTenantMetricTile,
  ApexTenantTabShell,
} from "@/Components/apex/tenant/ApexTenantTabShell";
import {
  excelImportsForTenant,
  type ExcelImportDefinition,
  type ExcelImportKind,
} from "@/constants/excelImport";
import { apexImportTenantExcel } from "@/lib/apex/excelImportActions";
import { mapApexApiError } from "@/lib/apex/api";
import type { TenantDetail } from "@/lib/apex/actions";
import {
  downloadExcelImportSample,
  parseExcelImportFile,
  validateExcelImportRows,
  type ExcelRowIssue,
} from "@/lib/apex/excelWorkbook";
import { cn } from "@/lib/utils";

type Props = {
  tenant: TenantDetail;
};

type PreviewState = {
  kind: ExcelImportKind;
  rowCount: number;
  issues: ExcelRowIssue[];
  rows: Record<string, unknown>[];
  fileName: string;
};

function formatDummyCell(value: unknown): string {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value == null || value === "") return "—";
  return String(value);
}

function FormatPreviewTable({ def }: { def: ExcelImportDefinition }) {
  return (
    <div className="min-w-0 w-full space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Format preview
        </p>
        <p className="text-[11px] text-muted-foreground">
          Dummy rows · tenant replaces these
        </p>
      </div>
      <div className="w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-white/8 bg-black/15">
        <table className="w-max min-w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-white/8 bg-white/4">
              {def.columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {col.label}
                  {col.required ? (
                    <span className="ml-0.5 text-[oklch(0.72_0.08_85)]">*</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {def.sampleRows.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-white/5 text-muted-foreground transition-colors last:border-0 hover:bg-white/3"
              >
                {def.columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-3 py-2 tabular-nums text-foreground/85"
                  >
                    {formatDummyCell(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ApexTenantExcelImport({ tenant }: Props) {
  const available = useMemo(
    () =>
      excelImportsForTenant({
        businessType: tenant.businessType,
        modules: tenant.modules,
      }),
    [tenant.businessType, tenant.modules],
  );

  const [busyKind, setBusyKind] = useState<ExcelImportKind | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const fileRefs = useRef<Partial<Record<ExcelImportKind, HTMLInputElement | null>>>(
    {},
  );

  const onDownload = async (def: ExcelImportDefinition) => {
    setBusyKind(def.kind);
    try {
      await downloadExcelImportSample(def.kind, tenant.tinNumber);
      toast.success(`${def.title} format downloaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyKind(null);
    }
  };

  const onPickFile = (def: ExcelImportDefinition) => {
    fileRefs.current[def.kind]?.click();
  };

  const onFileChange = async (
    def: ExcelImportDefinition,
    file: File | null | undefined,
  ) => {
    if (!file) return;
    setBusyKind(def.kind);
    setPreview(null);
    try {
      const parsed = await parseExcelImportFile(file, def);
      const validated = validateExcelImportRows(def, parsed.rows);
      setPreview({
        kind: def.kind,
        rowCount: parsed.rows.length,
        issues: validated.issues,
        rows: validated.rows,
        fileName: file.name,
      });
      if (validated.issues.length) {
        toast.error(
          `${validated.issues.length} issue${validated.issues.length === 1 ? "" : "s"} found — fix and re-upload`,
        );
      } else {
        toast.success(`${validated.rows.length} row(s) ready to import`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read Excel file");
    } finally {
      setBusyKind(null);
      const input = fileRefs.current[def.kind];
      if (input) input.value = "";
    }
  };

  const onImport = async () => {
    if (!preview || preview.issues.length > 0 || preview.rows.length === 0) {
      toast.error("Upload a valid Excel file first");
      return;
    }
    setBusyKind(preview.kind);
    try {
      const result = await apexImportTenantExcel({
        tinNumber: tenant.tinNumber,
        kind: preview.kind,
        rows: preview.rows,
      });
      const errCount = result.errors?.length ?? 0;
      if (result.importedCount > 0) {
        toast.success(
          result.message ||
            `Imported ${result.importedCount} row(s)${result.skippedCount ? `, skipped ${result.skippedCount}` : ""}`,
        );
      }
      if (errCount > 0) {
        setPreview((prev) =>
          prev
            ? {
                ...prev,
                issues: result.errors.map((e) => ({
                  row: e.row,
                  message: e.message,
                })),
              }
            : prev,
        );
        toast.error(`${errCount} row(s) failed on import`);
      } else if (result.importedCount > 0) {
        setPreview(null);
      }
    } catch (e) {
      const msg = mapApexApiError(e, "Import failed");
      if (/Cannot query field|Unknown argument|apexImportTenantExcel/i.test(msg)) {
        toast.error(
          "Import API is not available yet. Format download and validation still work.",
        );
      } else if (msg) {
        toast.error(msg);
      }
    } finally {
      setBusyKind(null);
    }
  };

  return (
    <ApexTenantTabShell
      title="Excel import"
      description="Send a format file to the property, collect their filled sheet, then seed records here without the normal one-by-one flow."
      icon={FileSpreadsheet}
      tone="emerald"
      contentClassName="min-w-0 overflow-x-hidden"
      actions={
        <Badge variant="outline">
          {available.length} format{available.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      <div className="min-w-0 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <ApexTenantMetricTile
            label="Business type"
            value={tenant.businessType || "—"}
          />
          <ApexTenantMetricTile
            label="Active modules"
            value={tenant.modules.length || "—"}
            sub={
              tenant.modules.length
                ? tenant.modules.slice(0, 3).join(", ") +
                  (tenant.modules.length > 3 ? "…" : "")
                : "Assign Inventory to unlock formats"
            }
          />
          <ApexTenantMetricTile
            label="Upload check"
            value={
              preview
                ? `${preview.rows.length}/${preview.rowCount}`
                : "—"
            }
            sub={preview ? preview.fileName : "No file loaded"}
          />
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3.5">
          <ol className="grid gap-2.5 text-[13px] text-muted-foreground sm:grid-cols-3">
            <li className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[oklch(0.28_0.04_155)] text-[10px] font-semibold text-[oklch(0.88_0.04_155)] ring-1 ring-[oklch(0.62_0.1_155/0.35)]">
                1
              </span>
              <span>
                <span className="font-medium text-foreground">Download</span> the
                format and send it to the property.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[oklch(0.28_0.04_155)] text-[10px] font-semibold text-[oklch(0.88_0.04_155)] ring-1 ring-[oklch(0.62_0.1_155/0.35)]">
                2
              </span>
              <span>
                They replace dummy rows using the{" "}
                <span className="font-medium text-foreground">Allowed values</span>{" "}
                sheet.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[oklch(0.28_0.04_155)] text-[10px] font-semibold text-[oklch(0.88_0.04_155)] ring-1 ring-[oklch(0.62_0.1_155/0.35)]">
                3
              </span>
              <span>
                <span className="font-medium text-foreground">Upload</span> the
                filled file and import into this TIN.
              </span>
            </li>
          </ol>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.28_0.05_195)] text-[oklch(0.9_0.04_195)] ring-1 ring-[oklch(0.62_0.1_195/0.3)]">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground">Pictures</p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Image URL is optional. Leave blank for a placeholder, or paste a
              public link. Photos can also be attached later in hotcol-user.
            </p>
          </div>
        </div>

        {available.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/12 bg-white/3 px-4 py-10 text-center">
            <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No formats for this property yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">
              Enable Inventory on the Modules tab to unlock Excel formats.
              Purchase request is available for Hotel properties only.
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-3">
            {available.map((def) => {
              const isBusy = busyKind === def.kind;
              const isPreview = preview?.kind === def.kind;
              return (
                <div
                  key={def.kind}
                  className={cn(
                    "min-w-0 space-y-4 overflow-hidden rounded-xl border px-4 py-4 transition-colors",
                    isPreview
                      ? "border-[oklch(0.62_0.12_155/0.4)] bg-[oklch(0.45_0.05_155/0.1)]"
                      : "border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/4",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {def.title}
                        </p>
                        <Badge variant="outline" className="text-[10px]">
                          {def.requiredModule}
                        </Badge>
                        {isPreview ? (
                          <Badge variant="secondary" className="text-[10px]">
                            File checked
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        {def.description}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] text-muted-foreground">
                      {def.columns.filter((c) => c.required).length} required
                      columns · {def.sampleRows.length} sample rows
                    </p>
                  </div>

                  <FormatPreviewTable def={def} />

                  <div className="grid w-full min-w-0 grid-cols-2 items-center gap-3 border-t border-white/6 pt-4">
                    <div className="justify-self-start">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="apex-row-action gap-1.5"
                        disabled={!!busyKind}
                        onClick={() => void onDownload(def)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Download format
                      </Button>
                    </div>
                    <div className="justify-self-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="apex"
                        className="gap-1.5"
                        disabled={!!busyKind}
                        onClick={() => onPickFile(def)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Upload filled file
                      </Button>
                    </div>
                  </div>
                  <input
                    ref={(el) => {
                      fileRefs.current[def.kind] = el;
                    }}
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    className="hidden"
                    onChange={(e) =>
                      void onFileChange(def, e.target.files?.[0])
                    }
                  />
                </div>
              );
            })}
          </div>
        )}

        {preview ? (
          <div
            className={cn(
              "space-y-3 rounded-xl border px-4 py-4",
              preview.issues.length
                ? "border-[oklch(0.55_0.14_25/0.35)] bg-[oklch(0.28_0.05_25/0.2)]"
                : "border-[oklch(0.62_0.12_155/0.35)] bg-[oklch(0.28_0.04_155/0.18)]",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Upload check
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {preview.fileName} · {preview.rows.length} valid of{" "}
                  {preview.rowCount} row(s)
                  {preview.issues.length
                    ? ` · ${preview.issues.length} issue(s)`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="apex"
                className="gap-1.5"
                disabled={
                  !!busyKind ||
                  preview.issues.length > 0 ||
                  preview.rows.length === 0
                }
                onClick={() => void onImport()}
              >
                {busyKind === preview.kind ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : preview.issues.length === 0 ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                Import into tenant
              </Button>
            </div>

            {preview.issues.length > 0 ? (
              <ul className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-white/8 bg-black/20 p-3 text-xs text-[oklch(0.88_0.05_25)]">
                {preview.issues.slice(0, 40).map((issue, i) => (
                  <li key={`${issue.row}-${i}`}>
                    {issue.row > 0 ? `Row ${issue.row}: ` : ""}
                    {issue.message}
                  </li>
                ))}
                {preview.issues.length > 40 ? (
                  <li className="text-muted-foreground">
                    …and {preview.issues.length - 40} more
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Format looks good. Import will write these rows for this
                property.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </ApexTenantTabShell>
  );
}
