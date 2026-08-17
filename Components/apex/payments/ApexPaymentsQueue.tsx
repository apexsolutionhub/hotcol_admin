"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchPendingPayments,
  approveSetup,
  approveQuarterly,
  approveYearly,
  rejectPayment,
  invalidateApexCaches,
  type PaymentRow,
} from "@/lib/apex/actions";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexApproveRejectActions } from "@/Components/apex/layout/ApexApproveRejectActions";
import { Badge } from "@/Components/ui/badge";
import { CafeOrderModeBadge } from "@/Components/apex/CafeOrderModeBadge";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";

type PaymentKind = "setup" | "quarterly" | "yearly";

const META: Record<
  PaymentKind,
  {
    title: string;
    description: string;
    icon: typeof UserPlus;
    badgeKey:
      | "pendingSetupPayments"
      | "pendingQuarterlyPayments"
      | "pendingYearlyPayments";
  }
> = {
  setup: {
    title: "Setup payments",
    description:
      "One-time setup fee submissions — verify references, then approve or reject each property.",
    icon: UserPlus,
    badgeKey: "pendingSetupPayments",
  },
  quarterly: {
    title: "Quarterly payments",
    description:
      "Café and restaurant quarterly subscriptions — verify references, then approve to extend paid-until.",
    icon: CreditCard,
    badgeKey: "pendingQuarterlyPayments",
  },
  yearly: {
    title: "Yearly payments",
    description:
      "Hotel yearly subscriptions (4× quarterly rate) — verify references, then approve to extend paid-until.",
    icon: CreditCard,
    badgeKey: "pendingYearlyPayments",
  },
};

export function ApexPaymentsQueue({ kind }: { kind: PaymentKind }) {
  const meta = META[kind];
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const coordinator = useLoadCoordinator();
  const { refresh: refreshSummary, summary } = useApexDashboard();

  const load = useCallback((force = false) => {
    if (force) invalidateApexCaches(`apex:payments:${kind}`);
    void coordinator.run(async (isStale) => {
      setLoading(true);
      try {
        const data = await fetchPendingPayments(kind);
        if (!isStale()) setRows(data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load payments");
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [coordinator, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, fn: () => Promise<void>) => {
    setBusyId(id);
    try {
      await fn();
      toast.success("Payment updated");
      load(true);
      void refreshSummary(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = summary?.[meta.badgeKey];
  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <Link
            href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
            className="font-medium transition-colors hover:text-[oklch(0.82_0.04_85)]"
          >
            {row.original.hotelDisplayName ?? "—"}
          </Link>
        ),
      },
      {
        id: "cafeOrderMode",
        header: "Order mode",
        cell: ({ row }) => <CafeOrderModeBadge mode={row.original.cafeOrderMode} />,
      },
      {
        accessorKey: "tinNumber",
        header: "TIN",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.tinNumber}</span>
        ),
      },
      {
        accessorKey: "amountETB",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {row.original.amountETB.toLocaleString()} ETB
          </span>
        ),
      },
      {
        accessorKey: "paymentChannel",
        header: "Channel",
      },
      {
        accessorKey: "transactionRef",
        header: "Reference",
        cell: ({ row }) => (
          <span className="block max-w-40 truncate font-mono text-xs">
            {row.original.transactionRef}
          </span>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {new Date(row.original.submittedAt).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        minSize: 220,
        meta: { className: "whitespace-nowrap", headerClassName: "whitespace-nowrap" },
        cell: ({ row }) => (
          <div className="flex justify-end whitespace-nowrap">
            <ApexApproveRejectActions
              busy={busyId === row.original.id}
              rejectTitle={`Reject ${kind} payment`}
              onApprove={() =>
                act(row.original.id, () =>
                  kind === "setup"
                    ? approveSetup(row.original.tinNumber)
                    : kind === "yearly"
                      ? approveYearly(row.original.tinNumber)
                      : approveQuarterly(row.original.tinNumber),
                )
              }
              onReject={(reason) =>
                act(row.original.id, () => rejectPayment(row.original.id, reason))
              }
            />
          </div>
        ),
      },
    ],
    [busyId, kind],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={meta.title}
        description={meta.description}
        actions={
          pendingCount != null && pendingCount > 0 ? (
            <Badge variant="secondary">{pendingCount} pending</Badge>
          ) : null
        }
      />

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={meta.icon}
            title={`No pending ${kind} payments`}
            description="New submissions from tenants will appear here."
          />
        ) : (
          <ApexDataTable
            data={rows}
            columns={columns}
            noun="payments"
            pageSize={10}
            tableClassName="min-w-max"
          />
        )}
      </ApexPanel>
    </div>
  );
}
