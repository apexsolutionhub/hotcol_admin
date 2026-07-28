"use client";

import { useMemo, useState } from "react";
import { format, isValid, startOfDay } from "date-fns";
import {
  CalendarDays,
  CalendarIcon,
  CircleDollarSign,
  NotebookPen,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import {
  ApexTenantMetricTile,
  ApexTenantTabShell,
} from "@/Components/apex/tenant/ApexTenantTabShell";
import type { TenantDetail } from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

function formatEtb(n: number) {
  return `${n.toLocaleString("en-US")} ETB`;
}

function parseTrialDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isValid(d) ? startOfDay(d) : undefined;
}

function toDateKey(d: Date | undefined): string {
  return d && isValid(d) ? format(d, "yyyy-MM-dd") : "";
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
  const [quarterlyFee, setQuarterlyFee] = useState(
    String(tenant.quarterlyFeeETB),
  );
  const [notes, setNotes] = useState(tenant.billingNotes ?? "");
  const [illustration, setIllustration] = useState(tenant.isIllustrationTenant);
  const [hold, setHold] = useState(tenant.billingHold);
  const [trialEnd, setTrialEnd] = useState<Date | undefined>(() =>
    parseTrialDate(tenant.freeTrialEndsAt),
  );
  const [trialOpen, setTrialOpen] = useState(false);

  const setupNum = Number(setupFee) || 0;
  const quarterlyNum = Number(quarterlyFee) || 0;

  const dirty = useMemo(() => {
    return (
      setupNum !== tenant.setupFeeETB ||
      quarterlyNum !== tenant.quarterlyFeeETB ||
      notes.trim() !== (tenant.billingNotes ?? "").trim() ||
      illustration !== tenant.isIllustrationTenant ||
      hold !== tenant.billingHold ||
      toDateKey(trialEnd) !== toDateKey(parseTrialDate(tenant.freeTrialEndsAt))
    );
  }, [
    setupNum,
    quarterlyNum,
    notes,
    illustration,
    hold,
    trialEnd,
    tenant,
  ]);

  const feeBadge = tenant.feesManuallySet ? (
    <Badge variant="warning">Custom fees</Badge>
  ) : tenant.feesMatchCatalog ? (
    <Badge variant="success">Matches catalog</Badge>
  ) : (
    <Badge variant="outline">Catalog drift</Badge>
  );

  const yearlyPreview = quarterlyNum * 4;

  return (
    <ApexTenantTabShell
      title="Billing & fees"
      description="Edit setup and quarterly amounts. Catalog pricing follows business type and modules."
      icon={Settings2}
      tone="violet"
      actions={feeBadge}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <ApexTenantMetricTile
            label="Catalog setup"
            value={formatEtb(tenant.suggestedSetupFeeETB)}
            sub="Suggested from pricing rules"
          />
          <ApexTenantMetricTile
            label="Catalog quarterly"
            value={formatEtb(tenant.suggestedQuarterlyFeeETB)}
            sub="Suggested from pricing rules"
          />
        </div>

        {!tenant.feesMatchCatalog && onApplyCatalog ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[oklch(0.72_0.08_85/0.25)] bg-[oklch(0.55_0.04_85/0.08)] px-4 py-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.82_0.06_85)]" />
              <p className="text-sm text-muted-foreground">
                Current fees differ from the catalog for this module mix.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="apex-row-action"
              disabled={busy}
              onClick={onApplyCatalog}
            >
              Apply catalog pricing
            </Button>
          </div>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-[oklch(0.78_0.06_85)]" />
            <h3 className="text-sm font-semibold">Fee amounts</h3>
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
                className="h-11 tabular-nums"
              />
              <p className="text-[11px] text-muted-foreground">
                One-time onboarding charge
              </p>
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
                className="h-11 tabular-nums"
              />
              <p className="text-[11px] text-muted-foreground">
                Yearly lodging rate ≈ {formatEtb(yearlyPreview)} (4×)
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[oklch(0.72_0.08_195)]" />
            <h3 className="text-sm font-semibold">Free trial</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Trial end date</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={trialOpen} onOpenChange={setTrialOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      id="trial-end"
                      className={cn(
                        "h-11 min-w-[16rem] flex-1 justify-start gap-2 px-3 font-normal sm:max-w-sm",
                        !trialEnd && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0 text-[oklch(0.75_0.05_85)]" />
                      {trialEnd ? (
                        <span className="tabular-nums">
                          {format(trialEnd, "PPP")}
                        </span>
                      ) : (
                        <span>Select trial end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto border-border/70 p-0 shadow-xl"
                    align="start"
                    sideOffset={6}
                  >
                    <Calendar
                      mode="single"
                      selected={trialEnd}
                      captionLayout="dropdown"
                      buttonVariant="ghost"
                      defaultMonth={trialEnd ?? new Date()}
                      onSelect={(date) => {
                        setTrialEnd(date ? startOfDay(date) : undefined);
                        setTrialOpen(false);
                      }}
                      disabled={{ before: startOfDay(new Date()) }}
                    />
                    <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => {
                          setTrialEnd(undefined);
                          setTrialOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={() => setTrialOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {trialEnd ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 shrink-0"
                    aria-label="Clear trial end date"
                    onClick={() => setTrialEnd(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Optional. Leave empty if this property is not on a free trial.
                {trialEnd
                  ? ` Ends ${format(trialEnd, "EEEE, MMM d, yyyy")}.`
                  : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-[oklch(0.72_0.08_300)]" />
            <h3 className="text-sm font-semibold">Notes & enforcement</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-notes">Apex billing notes</Label>
            <Textarea
              id="billing-notes"
              rows={4}
              className="min-h-26 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Discounts, legacy terms, WhatsApp follow-up…"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label
              htmlFor="illustration"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3.5 transition-colors hover:border-white/14"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">Illustration tenant</p>
                <p className="text-xs text-muted-foreground">
                  No billing enforcement
                </p>
              </div>
              <Switch
                id="illustration"
                checked={illustration}
                onCheckedChange={setIllustration}
              />
            </label>
            <label
              htmlFor="billing-hold"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3.5 transition-colors hover:border-white/14"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">Billing hold</p>
                <p className="text-xs text-muted-foreground">
                  Pause collection pressure
                </p>
              </div>
              <Switch
                id="billing-hold"
                checked={hold}
                onCheckedChange={setHold}
              />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
          <p className="text-xs text-muted-foreground">
            {dirty
              ? "You have unsaved billing changes."
              : "All billing settings are saved."}
          </p>
          <Button
            size="sm"
            variant="apex"
            className="cursor-pointer min-w-40"
            disabled={busy || !dirty}
            onClick={() =>
              onSave({
                setupFeeETB: setupNum,
                quarterlyFeeETB: quarterlyNum,
                billingNotes: notes.trim() || null,
                isIllustrationTenant: illustration,
                billingHold: hold,
                freeTrialEndsAt: trialEnd
                  ? startOfDay(trialEnd).toISOString()
                  : null,
              })
            }
          >
            {busy ? "Saving…" : "Save billing settings"}
          </Button>
        </div>
      </div>
    </ApexTenantTabShell>
  );
}
