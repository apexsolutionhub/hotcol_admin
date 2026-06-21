"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Phone, UserPlus } from "lucide-react";
import {
  fetchSignupPipeline,
  approveSetup,
  rejectSetup,
  type SignupPipelineRow,
} from "@/lib/apex/actions";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexInfoBanner } from "@/Components/apex/layout/ApexInfoBanner";
import { ApexApproveRejectActions } from "@/Components/apex/layout/ApexApproveRejectActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { businessTypeLabel } from "@/constants/businessTypes";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { mapApexApiError } from "@/lib/apex/api";
import { Badge } from "@/Components/ui/badge";

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

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="New signups"
        description="Properties awaiting setup fee approval — typical wait ~30 minutes"
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
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Setup fee</TableHead>
                  <TableHead>Payment ref</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const waitMins = Math.floor(
                    (Date.now() - new Date(row.registeredAt).getTime()) / 60000,
                  );
                  const isBusy = busyTin === row.tinNumber;
                  return (
                    <TableRow key={row.tinNumber}>
                      <TableCell>
                        <Link
                          href={`/tenants/${encodeURIComponent(row.tinNumber)}`}
                          className="font-medium hover:text-primary"
                        >
                          {row.hotelDisplayName}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">{row.tinNumber}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {businessTypeLabel(row.businessType)}
                      </TableCell>
                      <TableCell className="text-sm">{row.ownerUserName}</TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {row.setupFeeETB.toLocaleString()} ETB
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.paymentTransactionRef || "—"}
                        {row.paymentChannel ? (
                          <span className="block text-muted-foreground">{row.paymentChannel}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(row.registeredAt).toLocaleString()}
                        <Badge
                          variant={waitMins > 45 ? "warning" : "secondary"}
                          className="mt-1.5 block w-fit text-[10px]"
                        >
                          Waiting {waitMins} min
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ApexApproveRejectActions
                          busy={isBusy}
                          approveLabel="Approve setup"
                          rejectTitle="Reject setup payment"
                          rejectDescription="The property owner will need to resubmit payment with a corrected reference."
                          onApprove={() =>
                            runAction(
                              row.tinNumber,
                              () => approveSetup(row.tinNumber),
                              "Setup approved — tenant can log in",
                            )
                          }
                          onReject={(reason) =>
                            runAction(
                              row.tinNumber,
                              () => rejectSetup(row.tinNumber, reason),
                              "Setup rejected",
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ApexTableWrap>
        )}
      </ApexPanel>
    </div>
  );
}
