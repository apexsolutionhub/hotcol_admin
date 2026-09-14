"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexCrystalNamesTable } from "@/Components/apex/crystal/ApexCrystalNamesTable";
import {
  fetchApexCrystalNames,
  type CrystalNameRow,
} from "@/lib/apex/actions";

export default function CrystalNamesPage() {
  const [rows, setRows] = useState<CrystalNameRow[] | null>(null);

  const reload = useCallback(async () => {
    try {
      setRows(await fetchApexCrystalNames());
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not load crystal names",
      );
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (rows === null) {
    return <ApexPageLoader label="Loading crystal names…" />;
  }

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Crystal names"
        description="Manage the global Amharic|Romanized|English catalog used by tenant inventory, purchase requests, and recipes."
        breadcrumbs={[{ label: "Crystal names" }]}
      />
      <ApexCrystalNamesTable rows={rows} onChanged={() => void reload()} />
    </div>
  );
}
