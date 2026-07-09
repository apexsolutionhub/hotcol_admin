"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchTenantDetail,
  fetchTenantPaymentHistory,
  approveSetup,
  approveQuarterly,
  approveYearly,
  rejectSetup,
  releaseHold,
  suspendTenant,
  unsuspendTenant,
  banTenant,
  unbanTenant,
  setUserLoginDisabled,
  applySuggestedTenantFees,
  updateTenantBilling,
  updateTenantModules,
  syncTenantStaffModules,
  type TenantDetail,
} from "@/lib/apex/actions";
import { Button } from "@/Components/ui/button";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexTenantSummaryStrip } from "@/Components/apex/tenant/ApexTenantSummaryStrip";
import { ApexTenantSectionNav } from "@/Components/apex/tenant/ApexTenantSectionNav";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { ApexOperationalSnapshot } from "@/Components/apex/tenant/ApexOperationalSnapshot";
import { ApexTenantBillingActions } from "@/Components/apex/tenant/ApexTenantBillingActions";
import { ApexTenantBillingSettings } from "@/Components/apex/tenant/ApexTenantBillingSettings";
import { ApexTenantAccessControl } from "@/Components/apex/tenant/ApexTenantAccessControl";
import { ApexTenantModulesEditor } from "@/Components/apex/tenant/ApexTenantModulesEditor";
import { ApexTenantStaffTable } from "@/Components/apex/tenant/ApexTenantStaffTable";
import { ApexTenantPaymentsTable } from "@/Components/apex/tenant/ApexTenantPaymentsTable";
import { ApexPortfolioOwnerPanel } from "@/Components/apex/tenant/ApexPortfolioOwnerPanel";

export default function TenantDetailPage() {
  const params = useParams();
  const tin = decodeURIComponent(String(params.tin ?? ""));
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [payments, setPayments] = useState<TenantDetail["recentPayments"]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh: refreshSummary } = useApexDashboard();

  const reload = useCallback(async () => {
    const [detail, history] = await Promise.all([
      fetchTenantDetail(tin),
      fetchTenantPaymentHistory(tin, 50),
    ]);
    setTenant(detail);
    setPayments(history);
  }, [tin]);

  useEffect(() => {
    void reload().catch((e) => toast.error(e instanceof Error ? e.message : "Load failed"));
  }, [reload]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      toast.success("Updated");
      await reload();
      void refreshSummary(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!tenant) {
    return <ApexPageLoader label="Loading tenant…" />;
  }

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={tenant.hotelDisplayName}
        description={tenant.tinNumber}
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: tenant.hotelDisplayName },
        ]}
        actions={
          <Button asChild size="sm" variant="apex">
            <Link href={`/feedback?tin=${encodeURIComponent(tin)}`}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Open chat
            </Link>
          </Button>
        }
      />

      <ApexTenantSummaryStrip tenant={tenant} />

      <ApexTenantSectionNav />

      <div className="grid gap-6 lg:grid-cols-2">
        <div id="billing-actions" className="scroll-mt-28">
          <ApexTenantBillingActions
            tenant={tenant}
            busy={busy}
            onApproveSetup={() => run(() => approveSetup(tin))}
            onRejectSetup={(reason) => run(() => rejectSetup(tin, reason))}
            onApproveRenewal={() =>
              run(() =>
                tenant.businessType === "Hotel" ||
                tenant.businessType === "Resort" ||
                tenant.businessType === "Pension"
                  ? approveYearly(tin)
                  : approveQuarterly(tin),
              )
            }
            onReleaseHold={() => run(() => releaseHold(tin))}
            onSetBillingHold={() =>
              run(() => updateTenantBilling(tin, { billingHold: true }))
            }
          />
        </div>
        <div id="access" className="scroll-mt-28">
          <ApexTenantAccessControl
            tenant={tenant}
            reason={reason}
            busy={busy}
            onReasonChange={setReason}
            onSuspend={() => run(() => suspendTenant(tin, reason))}
            onBan={() => run(() => banTenant(tin, reason))}
            onUnsuspend={() => run(() => unsuspendTenant(tin))}
            onUnban={() => run(() => unbanTenant(tin))}
          />
        </div>
      </div>

      <div id="billing-settings" className="scroll-mt-28">
        <ApexTenantBillingSettings
          key={`billing-${tenant.tinNumber}-${tenant.quarterlyFeeETB}-${tenant.feesManuallySet}`}
          tenant={tenant}
          busy={busy}
          onApplyCatalog={() => run(() => applySuggestedTenantFees(tin))}
          onSave={(values) =>
            run(() =>
              updateTenantBilling(tin, {
                setupFeeETB: values.setupFeeETB,
                quarterlyFeeETB: values.quarterlyFeeETB,
                billingNotes: values.billingNotes,
                isIllustrationTenant: values.isIllustrationTenant,
                billingHold: values.billingHold,
                freeTrialEndsAt: values.freeTrialEndsAt,
              }),
            )
          }
        />
      </div>

      <div id="modules" className="scroll-mt-28">
        <ApexTenantModulesEditor
          key={`modules-${tenant.tinNumber}-${(tenant.modules as string[]).join(",")}`}
          tenant={tenant}
          busy={busy}
          onSaveModules={(modules, recalcFees) =>
            run(() => updateTenantModules(tin, modules, recalcFees))
          }
          onSyncStaff={() => run(() => syncTenantStaffModules(tin))}
        />
      </div>

      {tenant.operationalSnapshot ? (
        <div id="operations" className="scroll-mt-28">
          <ApexOperationalSnapshot snapshot={tenant.operationalSnapshot} />
        </div>
      ) : null}

      <div id="staff" className="scroll-mt-28">
        <ApexTenantStaffTable
          users={tenant.users}
          busy={busy}
          onToggleLogin={(userId, wasDisabled) =>
            run(() => setUserLoginDisabled(userId, !wasDisabled, reason || undefined))
          }
        />
      </div>

      <div id="payments-history" className="scroll-mt-28">
        <ApexTenantPaymentsTable
          tinNumber={tin}
          payments={payments}
          busy={busy}
          onChanged={() => reload()}
        />
      </div>

      <ApexPortfolioOwnerPanel tinNumber={tin} hotelDisplayName={tenant.hotelDisplayName} />
    </div>
  );
}
