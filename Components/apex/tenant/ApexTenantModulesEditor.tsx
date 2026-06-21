"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { APEX_SUBSCRIPTION_MODULES } from "@/constants/subscriptionModules";
import type { TenantDetail } from "@/lib/apex/actions";

function formatEtb(n: number) {
  return `${n.toLocaleString("en-US")} ETB`;
}

type Props = {
  tenant: TenantDetail;
  busy: boolean;
  onSaveModules: (modules: string[], recalcFees: boolean) => void;
  onSyncStaff: () => void;
};

export function ApexTenantModulesEditor({ tenant, busy, onSaveModules, onSyncStaff }: Props) {
  const initial = useMemo(
    () => new Set((tenant.modules as string[]) ?? []),
    [tenant.modules, tenant.tinNumber],
  );
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [recalcOnSave, setRecalcOnSave] = useState(!tenant.feesManuallySet);

  const toggle = (mod: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(mod);
      else next.delete(mod);
      return next;
    });
  };

  return (
    <Card className="apex-panel-surface border-[oklch(0.5_0.03_220/0.2)]">
      <CardHeader>
        <CardTitle className="text-base text-[oklch(0.8_0.025_220)]">Modules</CardTitle>
        <CardDescription>
          Catalog pricing for current modules: setup {formatEtb(tenant.suggestedSetupFeeETB)},
          quarterly {formatEtb(tenant.suggestedQuarterlyFeeETB)}.
          {tenant.feesManuallySet
            ? " Custom fees are locked — enable recalc below to update amounts on save."
            : " Saving modules will refresh fees from the catalog."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {APEX_SUBSCRIPTION_MODULES.map((mod) => (
            <div key={mod} className="flex items-center gap-2">
              <Checkbox
                id={`mod-${mod}`}
                checked={selected.has(mod)}
                onCheckedChange={(v) => toggle(mod, Boolean(v))}
              />
              <Label htmlFor={`mod-${mod}`} className="cursor-pointer font-normal">
                {mod}
              </Label>
            </div>
          ))}
        </div>

        {tenant.feesManuallySet ? (
          <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
            <Switch
              id="recalc-fees"
              checked={recalcOnSave}
              onCheckedChange={setRecalcOnSave}
            />
            <Label htmlFor="recalc-fees" className="cursor-pointer font-normal">
              Recalculate setup &amp; quarterly from catalog when saving modules
            </Label>
          </div>
        ) : (
          <Badge variant="outline">Fees auto-sync with catalog on save</Badge>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="apex"
            className="cursor-pointer"
            disabled={busy}
            onClick={() => onSaveModules([...selected], recalcOnSave)}
          >
            Save modules
            {recalcOnSave ? " & recalc fees" : ""}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="apex-row-action cursor-pointer"
            disabled={busy}
            onClick={onSyncStaff}
          >
            Sync staff modules from owner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
