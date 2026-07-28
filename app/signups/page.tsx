"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Phone, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchSignupPipeline,
  approveSetup,
  rejectSetup,
  type SignupPipelineRow,
} from "@/lib/apex/actions";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexInfoBanner } from "@/Components/apex/layout/ApexInfoBanner";
import { ApexApproveRejectActions } from "@/Components/apex/layout/ApexApproveRejectActions";
import { businessTypeLabel } from "@/constants/businessTypes";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { mapApexApiError } from "@/lib/apex/api";
import { Badge } from "@/Components/ui/badge";
import { ApexCreateTenantTrigger } from "@/Components/apex/onboarding/ApexCreateTenantTrigger";

const WHATSAPP = ["+251935000642", "+251930272975"];

export default function SignupsPage() {
  const [rows, setRows] = useState<SignupPipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTin, setBusyTin] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();
  const { refresh: refreshSummary } = useApexDashboard();

  const load = () => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchSignupPipeline(80);
        if (!isStale()) setRows(list);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load signups");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  };

  useEffect(() => {
    load();
  }, [coordinator]);

  const runAction = async (tin: string, fn: () => Promise<void>, successMsg: string) => {
    setBusyTin(tin);
    try {
      await fn();
      toast.success(successMsg);
      load();
      void refreshSummary(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyTin(null);
    }
  };

  const columns = useMemo<ColumnDef<SignupPipelineRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
              className="font-medium hover:text-primary"
            >
              {row.original.hotelDisplayName}
            </Link>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.tinNumber}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "businessType",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-sm">
            {businessTypeLabel(row.original.businessType)}
          </span>
        ),
      },
      {
        accessorKey: "ownerUserName",
        header: "Admin / Manager",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.ownerUserName}</span>
        ),
      },
      {
        accessorKey: "setupFeeETB",
        header: "Setup fee",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {row.original.setupFeeETB.toLocaleString()} ETB
          </span>
        ),
      },
      {
        accessorKey: "paymentTransactionRef",
        header: "Payment ref",
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            {row.original.paymentTransactionRef || "—"}
            {row.original.paymentChannel ? (
              <span className="block text-muted-foreground">
                {row.original.paymentChannel}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "registeredAt",
        header: "Registered",
        cell: ({ row }) => {
          const waitMins = Math.floor(
            (Date.now() - new Date(row.original.registeredAt).getTime()) / 60000,
          );
          return (
            <div className="text-sm text-muted-foreground">
              {new Date(row.original.registeredAt).toLocaleString()}
              <Badge
                variant={waitMins > 45 ? "warning" : "secondary"}
                className="mt-1.5 block w-fit text-[10px]"
              >
                Waiting {waitMins} min
              </Badge>
            </div>
          );
        },
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const isBusy = busyTin === row.original.tinNumber;
          return (
            <div className="text-right">
              <ApexApproveRejectActions
                busy={isBusy}
                approveLabel="Approve setup"
                rejectTitle="Reject setup payment"
                rejectDescription="The property owner will need to resubmit payment with a corrected reference."
                onApprove={() =>
                  runAction(
                    row.original.tinNumber,
                    () => approveSetup(row.original.tinNumber),
                    "Setup approved — tenant can log in",
                  )
                }
                onReject={(reason) =>
                  runAction(
                    row.original.tinNumber,
                    () => rejectSetup(row.original.tinNumber, reason),
                    "Setup rejected",
                  )
                }
              />
            </div>
          );
        },
      },
    ],
    [busyTin],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="New signups"
        description="Properties awaiting setup fee approval — typical wait ~30 minutes"
        actions={
          <ApexCreateTenantTrigger size="sm" variant="apex">
            Create tenant manually
          </ApexCreateTenantTrigger>
        }
      />

      <ApexInfoBanner icon={Phone}>
        Escalation WhatsApp: {WHATSAPP.join(" · ")} · CBE account{" "}
        <span className="font-mono">1000418779358</span>
      </ApexInfoBanner>

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={7} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={UserPlus}
            title="No pending signups"
            description="New registrations waiting for setup approval will appear here."
          />
        ) : (
          <ApexDataTable
            data={rows}
            columns={columns}
            noun="signups"
            pageSize={10}
          />
        )}
      </ApexPanel>
    </div>
  );
}
