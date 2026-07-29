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
  deleteTenant,
  restoreDeletedTenant,
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
import {
  ApexTenantSectionNav,
  type TenantTabId,
} from "@/Components/apex/tenant/ApexTenantSectionNav";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { ApexTenantReporting } from "@/Components/apex/tenant/ApexTenantReporting";
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
  const [tab, setTab] = useState<TenantTabId>("reports");
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
    void reload().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Load failed"),
    );
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
    <div className="space-y-6">
      <ApexPageHeader
        title={tenant.hotelDisplayName}
        description={`TIN ${tenant.tinNumber}`}
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: tenant.hotelDisplayName },
        ]}
        actions={
          tenant.accountStatus === "active" ? (
            <Button asChild size="sm" variant="apex">
              <Link href={`/feedback?tin=${encodeURIComponent(tin)}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Open chat
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ApexTenantSummaryStrip tenant={tenant} />

      <ApexTenantSectionNav value={tab} onValueChange={setTab} />

      <div key={tab} className="apex-tenant-tab-panel space-y-6">
        {tab === "reports" ? (
          <ApexTenantReporting tenant={tenant} payments={payments} />
        ) : null}

        {tab === "payments" ? (
          <div className="space-y-6">
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
            <ApexTenantPaymentsTable
              tinNumber={tin}
              payments={payments}
              busy={busy}
              onChanged={() => reload()}
            />
          </div>
        ) : null}

        {tab === "access" ? (
          <ApexTenantAccessControl
            tenant={tenant}
            reason={reason}
            busy={busy}
            onReasonChange={setReason}
            onSuspend={() => run(() => suspendTenant(tin, reason))}
            onBan={() => run(() => banTenant(tin, reason))}
            onUnsuspend={() => run(() => unsuspendTenant(tin))}
            onUnban={() => run(() => unbanTenant(tin))}
            onDelete={() => run(() => deleteTenant(tin, reason))}
            onRestore={() => run(() => restoreDeletedTenant(tin, reason || undefined))}
          />
        ) : null}

        {tab === "billing" ? (
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
        ) : null}

        {tab === "modules" ? (
          <ApexTenantModulesEditor
            key={`modules-${tenant.tinNumber}-${(tenant.modules as string[]).join(",")}`}
            tenant={tenant}
            busy={busy}
            onSaveModules={(modules, recalcFees) =>
              run(() => updateTenantModules(tin, modules, recalcFees))
            }
            onSyncStaff={() => run(() => syncTenantStaffModules(tin))}
          />
        ) : null}

        {tab === "staff" ? (
          <ApexTenantStaffTable
            users={tenant.users}
            busy={busy}
            onToggleLogin={(userId, wasDisabled) =>
              run(() =>
                setUserLoginDisabled(userId, !wasDisabled, reason || undefined),
              )
            }
          />
        ) : null}

        {tab === "owner" ? (
          <ApexPortfolioOwnerPanel
            tinNumber={tin}
            hotelDisplayName={tenant.hotelDisplayName}
          />
        ) : null}
      </div>
    </div>
  );
}
