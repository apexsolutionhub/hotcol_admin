"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  fetchOrderModeChangeRequests,
  invalidateApexCaches,
  type OrderModeChangeRequestRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/Components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexOrderModeRequestsTable } from "@/Components/apex/order-mode/ApexOrderModeRequestsTable";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function OrderModePage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading order mode requests…" />}>
      <OrderModeContent />
    </Suspense>
  );
}

function OrderModeContent() {
  const [rows, setRows] = useState<OrderModeChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  const load = useCallback(
    (force = false) => {
      if (force) invalidateApexCaches("apex:order-mode");
      void coordinator.run(async (isStale) => {
        setLoading(true);
        setError(null);
        try {
          const list = await fetchOrderModeChangeRequests("all");
          if (!isStale()) setRows(list);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load order mode requests");
          if (!isStale() && msg) setError(msg);
        } finally {
          if (!isStale()) setLoading(false);
        }
      });
    },
    [coordinator],
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Order mode requests"
        description="Café properties requesting a switch between digital ordering and thermal-printer (analog) mode"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : (
          <ApexOrderModeRequestsTable rows={rows} onChanged={() => load(true)} />
        )}
      </ApexPanel>
    </div>
  );
}
