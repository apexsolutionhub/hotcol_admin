"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CreditCard, UserPlus } from "lucide-react";
import {
  fetchPendingPayments,
  approveSetup,
  approveQuarterly,
  approveYearly,
  rejectPayment,
  invalidateApexCaches,
  type PaymentRow,
} from "@/lib/apex/actions";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexApproveRejectActions } from "@/Components/apex/layout/ApexApproveRejectActions";
import { Badge } from "@/Components/ui/badge";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";

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

  const load = (force = false) => {
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
  };

  useEffect(() => {
    load();
  }, [kind]);

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
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/tenants/${encodeURIComponent(row.tinNumber)}`}
                        className="font-medium transition-colors hover:text-[oklch(0.82_0.04_85)]"
                      >
                        {row.hotelDisplayName ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.tinNumber}</TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {row.amountETB.toLocaleString()} ETB
                    </TableCell>
                    <TableCell>{row.paymentChannel}</TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs">
                      {row.transactionRef}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(row.submittedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <ApexApproveRejectActions
                        busy={busyId === row.id}
                        rejectTitle={`Reject ${kind} payment`}
                        onApprove={() =>
                          act(row.id, () =>
                            kind === "setup"
                              ? approveSetup(row.tinNumber)
                              : kind === "yearly"
                                ? approveYearly(row.tinNumber)
                                : approveQuarterly(row.tinNumber),
                          )
                        }
                        onReject={(reason) =>
                          act(row.id, () => rejectPayment(row.id, reason))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ApexTableWrap>
        )}
      </ApexPanel>
    </div>
  );
}
