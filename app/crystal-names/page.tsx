"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexCrystalNamesTable } from "@/Components/apex/crystal/ApexCrystalNamesTable";
import { ApexCrystalNameProposalsPanel } from "@/Components/apex/crystal/ApexCrystalNameProposalsPanel";
import {
  fetchApexCrystalNameProposals,
  fetchApexCrystalNames,
  repairCrystalNamePropagations,
  type CrystalNameProposalRow,
  type CrystalNameRow,
} from "@/lib/apex/actions";

export default function CrystalNamesPage() {
  const [rows, setRows] = useState<CrystalNameRow[] | null>(null);
  const [proposals, setProposals] = useState<CrystalNameProposalRow[] | null>(
    null,
  );

  const reload = useCallback(async () => {
    try {
      // Fix any inventory/request rows still using provisional names from
      // already-approved/merged proposals (e.g. "new thing" → full crystal).
      try {
        const repair = await repairCrystalNamePropagations(200);
        if (repair.updated > 0) {
          toast.success(
            `Updated ${repair.updated} item name${repair.updated === 1 ? "" : "s"} to approved crystal labels`,
          );
        }
      } catch {
        // Non-fatal — catalog still loads.
      }

      const [catalog, pending] = await Promise.all([
        fetchApexCrystalNames(),
        fetchApexCrystalNameProposals("pending"),
      ]);
      setRows(catalog);
      setProposals(pending);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not load crystal names",
      );
      setRows((prev) => prev ?? []);
      setProposals((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (rows === null || proposals === null) {
    return <ApexPageLoader label="Loading crystal names…" />;
  }

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Crystal names"
        description="Manage the global Amharic|Romanized|English catalog. Property proposals are naming-only reviews (merge / approve / reject) and never block hotel or cafe request workflows."
        breadcrumbs={[{ label: "Crystal names" }]}
      />
      <ApexCrystalNameProposalsPanel
        proposals={proposals}
        catalog={rows}
        onChanged={() => void reload()}
      />
      <ApexCrystalNamesTable rows={rows} onChanged={() => void reload()} />
    </div>
  );
}
