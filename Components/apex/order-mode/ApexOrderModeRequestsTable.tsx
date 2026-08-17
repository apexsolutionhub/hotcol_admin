"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Building2, Check, Loader2, Printer, X } from "lucide-react";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  approveOrderModeChangeRequest,
  rejectOrderModeChangeRequest,
  type OrderModeChangeRequestRow,
} from "@/lib/apex/actions";
import {
  CAFE_ORDER_MODE_SHORT_LABELS,
  parseCafeOrderMode,
} from "@/lib/cafeOrderMode";
import { toast } from "sonner";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

type Props = {
  rows: OrderModeChangeRequestRow[];
  onChanged: () => void;
};

type ColumnMeta = {
  className?: string;
  headerClassName?: string;
};

function formatSubmittedAt(value: string) {
  try {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { day: value, time: "" };
  }
}

function RequestStatusPill({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.14)]" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200">
        <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_0_3px_rgba(251,113,133,0.14)]" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100">
      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.14)]" />
      Pending
    </span>
  );
}

function ModePill({ mode }: { mode: string }) {
  const parsed = parseCafeOrderMode(mode);
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-foreground">
      {CAFE_ORDER_MODE_SHORT_LABELS[parsed]}
    </span>
  );
}

function RequestReviewActions({
  requestId,
  status,
  onDone,
}: {
  requestId: number;
  status: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  if (status !== "pending") {
    return (
      <div className="flex justify-end">
        <RequestStatusPill status={status} />
      </div>
    );
  }

  const run = async (fn: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMessage);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="success"
        className="apex-row-action gap-1.5"
        disabled={busy}
        onClick={() =>
          void run(
            () => approveOrderModeChangeRequest(requestId),
            "Order mode request approved",
          )
        }
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="apex-row-action gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={busy}
        onClick={() =>
          void run(
            () => rejectOrderModeChangeRequest(requestId),
            "Order mode request rejected",
          )
        }
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}

export function ApexOrderModeRequestsTable({ rows, onChanged }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const tabItems = useMemo(
    () => [
      { value: "all" as const, label: "All", count: rows.length },
      {
        value: "pending" as const,
        label: "Pending",
        count: rows.filter((row) => row.status === "pending").length,
      },
      {
        value: "approved" as const,
        label: "Approved",
        count: rows.filter((row) => row.status === "approved").length,
      },
      {
        value: "rejected" as const,
        label: "Rejected",
        count: rows.filter((row) => row.status === "rejected").length,
      },
    ],
    [rows],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const snapshot = useMemo(() => {
    const pending = rows.filter((row) => row.status === "pending").length;
    const toAnalog = rows.filter(
      (row) => parseCafeOrderMode(row.requestedMode) === "analog",
    ).length;
    const toDigital = rows.filter(
      (row) => parseCafeOrderMode(row.requestedMode) === "digital",
    ).length;
    return { pending, toAnalog, toDigital };
  }, [rows]);

  const columns = useMemo<ColumnDef<OrderModeChangeRequestRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Property",
        size: 240,
        minSize: 210,
        maxSize: 280,
        meta: {
          className: "whitespace-normal",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
              <Link
                href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-[oklch(0.82_0.04_85)]"
                title={row.original.hotelDisplayName}
              >
                {row.original.hotelDisplayName}
              </Link>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                TIN {row.original.tinNumber}
              </p>
              <Badge
                variant="outline"
                className="rounded-md px-1.5 py-0 text-[10px] capitalize"
              >
                {row.original.requestedBySide}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        id: "change",
        header: "Change",
        size: 220,
        minSize: 190,
        maxSize: 260,
        meta: {
          className: "whitespace-normal",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <ModePill mode={row.original.currentMode} />
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <ModePill mode={row.original.requestedMode} />
          </div>
        ),
      },
      {
        accessorKey: "requestNote",
        header: "Note",
        size: 200,
        minSize: 160,
        meta: {
          className: "whitespace-normal",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) =>
          row.original.requestNote ? (
            <p
              className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
              title={row.original.requestNote}
            >
              {row.original.requestNote}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        minSize: 110,
        maxSize: 130,
        meta: {
          className: "whitespace-nowrap",
          headerClassName: "whitespace-nowrap",
        } satisfies ColumnMeta,
        cell: ({ row }) => <RequestStatusPill status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        size: 140,
        minSize: 140,
        meta: {
          className: "whitespace-normal overflow-hidden pr-8",
          headerClassName: "whitespace-nowrap pr-8",
        } satisfies ColumnMeta,
        cell: ({ row }) => {
          const submitted = formatSubmittedAt(row.original.createdAt);
          return (
            <div className="min-w-0 space-y-0.5 pr-2">
              <p className="text-sm font-medium text-foreground">{submitted.day}</p>
              {submitted.time ? (
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {submitted.time}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "review",
        header: () => <div className="w-full text-right">Review</div>,
        size: 250,
        minSize: 250,
        enableHiding: false,
        meta: {
          className: "whitespace-nowrap pl-10",
          headerClassName: "whitespace-nowrap pl-10 text-right",
        } satisfies ColumnMeta,
        cell: ({ row }) => (
          <div className="pl-2">
            <RequestReviewActions
              requestId={row.original.id}
              status={row.original.status}
              onDone={onChanged}
            />
          </div>
        ),
      },
    ],
    [onChanged],
  );

  return (
    <div className="space-y-5">
      <Tabs
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        className="w-full"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2.5 rounded-none border-0 bg-transparent p-0 pl-4 shadow-none sm:pl-5">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="apex-tabs-trigger h-11 flex-none gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2 text-left leading-none shadow-sm transition-all duration-150 hover:border-white/12 hover:bg-white/4.5 data-[state=active]:border-[oklch(0.68_0.05_85/0.28)] data-[state=active]:bg-[oklch(0.24_0.014_265)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_8px_20px_-12px_oklch(0.88_0.06_85/0.45)]"
            >
              <span className="text-sm font-medium tracking-tight">{tab.label}</span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground dark:bg-white/10">
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
            <Printer className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Request snapshot
              </p>
              <Badge variant="secondary">
                {statusFilter === "all"
                  ? "All requests"
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Approve to switch the café order mode. Rejected requests leave the current
              mode unchanged.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-500/14 bg-amber-500/6 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
              Pending review
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.pending}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Waiting for Apex action</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              To analog
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.toAnalog}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Thermal printer requests</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              To digital
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {snapshot.toDigital}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Kitchen/bar screen requests</p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/4">
            <Printer className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No order mode requests</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {statusFilter === "pending"
              ? "No pending digital/analog switch requests right now."
              : "No requests match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-background/40">
          <ApexDataTable
            data={filtered}
            columns={columns}
            noun="requests"
            pageSize={10}
            showToolbar
            searchPlaceholder="Search property, TIN, mode…"
            rowClassName="hover:bg-white/3"
          />
        </div>
      )}
    </div>
  );
}
