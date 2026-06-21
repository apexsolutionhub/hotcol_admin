"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPricingRulesTable } from "@/Components/apex/pricing/ApexPricingRulesTable";
import { fetchPricingRules, type PricingRuleRow } from "@/lib/apex/actions";

export default function PricingCatalogPage() {
  const [rules, setRules] = useState<PricingRuleRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchPricingRules();
      setRules(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load pricing catalog";
      setLoadError(msg);
      setRules([]);
      toast.error(msg);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (rules === null) {
    return <ApexPageLoader label="Loading pricing catalog…" />;
  }

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Pricing catalog"
        description="Setup and quarterly fees by business type and module combination. Tenants can override fees individually."
        breadcrumbs={[{ label: "Pricing catalog" }]}
      />
      {loadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}
      <ApexPricingRulesTable rules={rules} onChanged={() => reload()} />
    </div>
  );
}
