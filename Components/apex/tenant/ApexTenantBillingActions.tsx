"use client";

import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Separator } from "@/Components/ui/separator";
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

  return (
    <Card className="apex-panel-surface border-[oklch(0.55_0.04_85/0.2)]">
      <CardHeader>
        <CardTitle className="text-base text-[oklch(0.82_0.03_85)]">Billing actions</CardTitle>
        <CardDescription>
          Approve or reject payments, manage billing hold — subscription status:{" "}
          <span className="font-medium text-foreground">{tenant.subscriptionStatus}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Setup fee</p>
            <p className="font-medium">
              {tenant.setupFeeETB.toLocaleString()} ETB ·{" "}
              {tenant.setupFeeApproved ? "Approved" : "Pending"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{renewalLabel} fee</p>
            <p className="font-medium">
              {renewalAmount.toLocaleString()} ETB
              {isYearly ? (
                <span className="block text-xs font-normal text-muted-foreground">
                  4× quarterly ({tenant.quarterlyFeeETB.toLocaleString()} ETB)
                </span>
              ) : null}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid until</p>
            <p className="font-medium">
              {tenant.subscriptionPaidUntil
                ? new Date(tenant.subscriptionPaidUntil).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{isYearly ? "Years paid" : "Quarters paid"}</p>
            <p className="font-medium">{tenant.paidQuartersCount}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Setup payment
          </p>
          <div className="flex flex-wrap gap-2">
            {!tenant.setupFeeApproved ? (
              <Button
                size="sm"
                variant="success"
                className="apex-row-action"
                disabled={busy}
                onClick={onApproveSetup}
              >
                Approve setup
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Setup already approved</span>
            )}
          </div>
          {!tenant.setupFeeApproved ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-8 max-w-xs text-xs"
                placeholder="Reject reason (required)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                size="sm"
                variant="destructive"
                className="apex-row-action"
                disabled={busy || !rejectReason.trim()}
                onClick={() => onRejectSetup(rejectReason)}
              >
                Reject setup
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {renewalLabel} payment
          </p>
          <div className="flex flex-wrap gap-2">
            {(tenant.subscriptionStatus === "grace" ||
              tenant.subscriptionStatus === "pending_approval" ||
              pendingRenewal) && (
              <Button
                size="sm"
                variant="success"
                className="apex-row-action"
                disabled={busy}
                onClick={onApproveRenewal}
              >
                Approve {renewalKind}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Billing hold
          </p>
          <div className="flex flex-wrap gap-2">
            {tenant.billingHold ? (
              <Button
                size="sm"
                variant="outline"
                className="apex-row-action"
                disabled={busy}
                onClick={onReleaseHold}
              >
                Release billing hold
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="apex-row-action"
                disabled={busy}
                onClick={onSetBillingHold}
              >
                Place on billing hold
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          CBE: <span className="font-mono">1000418779358</span>
          {pendingSetup ? (
            <span className="block">
              Pending setup ref: {pendingSetup.transactionRef}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}
