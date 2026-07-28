"use client";

import { useState } from "react";
import { CreditCard, Landmark, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
  ApexTenantMetricTile,
  ApexTenantTabShell,
} from "@/Components/apex/tenant/ApexTenantTabShell";
import { SubscriptionStatusBadge } from "@/Components/apex/StatusBadge";
import type { TenantDetail } from "@/lib/apex/actions";

type Props = {
  tenant: TenantDetail;
  busy: boolean;
  onApproveSetup: () => void;
  onRejectSetup: (reason: string) => void;
  onApproveRenewal: () => void;
  onReleaseHold: () => void;
  onSetBillingHold: () => void;
};

function isLodgingBusinessType(businessType: string | null | undefined): boolean {
  const bt = String(businessType ?? "").trim();
  return bt === "Hotel" || bt === "Resort" || bt === "Pension";
}

export function ApexTenantBillingActions({
  tenant,
  busy,
  onApproveSetup,
  onRejectSetup,
  onApproveRenewal,
  onReleaseHold,
  onSetBillingHold,
}: Props) {
  const [rejectReason, setRejectReason] = useState("");
  const isYearly = isLodgingBusinessType(tenant.businessType);
  const renewalKind = isYearly ? "yearly" : "quarterly";
  const renewalLabel = isYearly ? "Yearly" : "Quarterly";
  const renewalAmount = isYearly
    ? tenant.quarterlyFeeETB * 4
    : tenant.quarterlyFeeETB;

  const pendingSetup = tenant.recentPayments.find(
    (p) => p.paymentKind === "setup" && p.status === "pending",
  );
  const pendingRenewal = tenant.recentPayments.find(
    (p) => p.paymentKind === renewalKind && p.status === "pending",
  );
  const canApproveRenewal =
    tenant.subscriptionStatus === "grace" ||
    tenant.subscriptionStatus === "pending_approval" ||
    Boolean(pendingRenewal);

  return (
    <ApexTenantTabShell
      title="Billing actions"
      description="Approve or reject payments and manage billing hold for this property."
      icon={CreditCard}
      tone="gold"
      actions={<SubscriptionStatusBadge status={tenant.subscriptionStatus} />}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ApexTenantMetricTile
            label="Setup fee"
            value={`${tenant.setupFeeETB.toLocaleString()} ETB`}
            sub={tenant.setupFeeApproved ? "Approved" : "Pending approval"}
          />
          <ApexTenantMetricTile
            label={`${renewalLabel} fee`}
            value={`${renewalAmount.toLocaleString()} ETB`}
            sub={
              isYearly
                ? `4× quarterly (${tenant.quarterlyFeeETB.toLocaleString()} ETB)`
                : "Per quarter"
            }
          />
          <ApexTenantMetricTile
            label="Paid until"
            value={
              tenant.subscriptionPaidUntil
                ? new Date(tenant.subscriptionPaidUntil).toLocaleDateString()
                : "—"
            }
            sub={`${tenant.paidQuartersCount} ${isYearly ? "year" : "quarter"}${tenant.paidQuartersCount === 1 ? "" : "s"} paid`}
          />
          <ApexTenantMetricTile
            label="Bank transfer"
            value={<span className="font-mono text-xs">1000418779358</span>}
            sub="CBE account"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Setup payment</h3>
              {tenant.setupFeeApproved ? (
                <Badge variant="success">Approved</Badge>
              ) : (
                <Badge variant="warning">Pending</Badge>
              )}
            </div>
            {pendingSetup ? (
              <p className="text-xs text-muted-foreground">
                Ref:{" "}
                <span className="font-mono text-foreground/90">
                  {pendingSetup.transactionRef}
                </span>
              </p>
            ) : null}
            {!tenant.setupFeeApproved ? (
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="success"
                  className="apex-row-action w-full sm:w-auto"
                  disabled={busy}
                  onClick={onApproveSetup}
                >
                  Approve setup
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    className="h-8 text-xs"
                    placeholder="Reject reason (required)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="apex-row-action shrink-0"
                    disabled={busy || !rejectReason.trim()}
                    onClick={() => onRejectSetup(rejectReason)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Setup already approved.</p>
            )}
          </section>

          <section className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{renewalLabel} payment</h3>
              {canApproveRenewal ? (
                <Badge variant="warning">Action needed</Badge>
              ) : (
                <Badge variant="outline">Quiet</Badge>
              )}
            </div>
            {pendingRenewal ? (
              <p className="text-xs text-muted-foreground">
                Ref:{" "}
                <span className="font-mono text-foreground/90">
                  {pendingRenewal.transactionRef}
                </span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Approve when status is grace or payment is pending.
              </p>
            )}
            {canApproveRenewal ? (
              <Button
                size="sm"
                variant="success"
                className="apex-row-action"
                disabled={busy}
                onClick={onApproveRenewal}
              >
                Approve {renewalKind}
              </Button>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Billing hold</h3>
              {tenant.billingHold ? (
                <Badge variant="warning">On hold</Badge>
              ) : (
                <Badge variant="success">Open</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Holds pause billing enforcement without changing account status.
            </p>
            {tenant.billingHold ? (
              <Button
                size="sm"
                variant="outline"
                className="apex-row-action gap-1.5"
                disabled={busy}
                onClick={onReleaseHold}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Release hold
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="apex-row-action gap-1.5"
                disabled={busy}
                onClick={onSetBillingHold}
              >
                <PauseCircle className="h-3.5 w-3.5" />
                Place on hold
              </Button>
            )}
          </section>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Landmark className="h-3.5 w-3.5 shrink-0" />
          Verify CBE transfer references before approving.
        </p>
      </div>
    </ApexTenantTabShell>
  );
}
