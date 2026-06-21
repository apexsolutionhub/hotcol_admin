"use client";

import { useState } from "react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import type { TenantDetail } from "@/lib/apex/actions";

function formatEtb(n: number) {
  return `${n.toLocaleString("en-US")} ETB`;
}

type Props = {
  tenant: TenantDetail;
  busy: boolean;
  onSave: (values: {
    setupFeeETB: number;
    quarterlyFeeETB: number;
    billingNotes: string | null;
    isIllustrationTenant: boolean;
    billingHold: boolean;
    freeTrialEndsAt: string | null;
  }) => void;
  onApplyCatalog?: () => void;
};

export function ApexTenantBillingSettings({
  tenant,
  busy,
  onSave,
  onApplyCatalog,
}: Props) {
  const [setupFee, setSetupFee] = useState(String(tenant.setupFeeETB));
  const [quarterlyFee, setQuarterlyFee] = useState(String(tenant.quarterlyFeeETB));
  const [notes, setNotes] = useState(tenant.billingNotes ?? "");
  const [illustration, setIllustration] = useState(tenant.isIllustrationTenant);
  const [hold, setHold] = useState(tenant.billingHold);
  const [trialEnd, setTrialEnd] = useState(
    tenant.freeTrialEndsAt
      ? new Date(tenant.freeTrialEndsAt).toISOString().slice(0, 10)
      : "",
  );

  const setupNum = Number(setupFee) || 0;
  const quarterlyNum = Number(quarterlyFee) || 0;
  const dirty =
    setupNum !== tenant.setupFeeETB ||
    quarterlyNum !== tenant.quarterlyFeeETB ||
    notes.trim() !== (tenant.billingNotes ?? "").trim() ||
    illustration !== tenant.isIllustrationTenant ||
    hold !== tenant.billingHold ||
    (trialEnd
      ? new Date(trialEnd).toISOString().slice(0, 10)
      : "") !==
      (tenant.freeTrialEndsAt
        ? new Date(tenant.freeTrialEndsAt).toISOString().slice(0, 10)
        : "");

  return (
    <Card className="apex-panel-surface border-white/8">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Billing & fees</CardTitle>
          <CardDescription>
            Setup and quarterly amounts are editable. Catalog pricing follows business type and
            modules.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {tenant.feesManuallySet ? (
            <Badge variant="warning">Custom fees</Badge>
          ) : tenant.feesMatchCatalog ? (
            <Badge variant="success">Matches catalog</Badge>
          ) : (
            <Badge variant="outline">Catalog drift</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-white/8 bg-white/5 px-4 py-3 text-sm">
          <p className="text-muted-foreground">Suggested from pricing catalog</p>
          <p className="mt-1 font-medium text-foreground">
            Setup {formatEtb(tenant.suggestedSetupFeeETB)} · Quarterly{" "}
            {formatEtb(tenant.suggestedQuarterlyFeeETB)}
          </p>
          {onApplyCatalog && !tenant.feesMatchCatalog ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="apex-row-action mt-3"
              disabled={busy}
              onClick={onApplyCatalog}
            >
              Apply catalog pricing
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="setup-fee">Setup fee (ETB)</Label>
            <Input
              id="setup-fee"
              type="number"
              min={0}
              step={1000}
              value={setupFee}
              onChange={(e) => setSetupFee(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quarterly-fee">Quarterly fee (ETB)</Label>
            <Input
              id="quarterly-fee"
              type="number"
              min={0}
              step={1000}
              value={quarterlyFee}
              onChange={(e) => setQuarterlyFee(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trial-end">Free trial ends (optional)</Label>
          <Input
            id="trial-end"
            type="date"
            value={trialEnd}
            onChange={(e) => setTrialEnd(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing-notes">Apex billing notes</Label>
          <Textarea
            id="billing-notes"
            rows={3}
            className="resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Discounts, legacy terms, WhatsApp follow-up…"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Switch id="illustration" checked={illustration} onCheckedChange={setIllustration} />
            <Label htmlFor="illustration" className="cursor-pointer font-normal">
              Illustration tenant (no billing enforcement)
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="billing-hold" checked={hold} onCheckedChange={setHold} />
            <Label htmlFor="billing-hold" className="cursor-pointer font-normal">
              Billing hold
            </Label>
          </div>
        </div>

        <Button
          size="sm"
          variant="apex"
          className="cursor-pointer"
          disabled={busy || !dirty}
          onClick={() =>
            onSave({
              setupFeeETB: setupNum,
              quarterlyFeeETB: quarterlyNum,
              billingNotes: notes.trim() || null,
              isIllustrationTenant: illustration,
              billingHold: hold,
              freeTrialEndsAt: trialEnd ? new Date(trialEnd).toISOString() : null,
            })
          }
        >
          Save billing settings
        </Button>
      </CardContent>
    </Card>
  );
}
