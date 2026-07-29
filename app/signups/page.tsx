"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import {
  fetchMonthlySignups,
  invalidateApexCaches,
  type MonthlySignupRow,
} from "@/lib/apex/actions";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/Components/apex/layout/ApexPanel";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexInfoBanner } from "@/Components/apex/layout/ApexInfoBanner";
import { ApexSignupsTable } from "@/Components/apex/signups/ApexSignupsTable";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { mapApexApiError } from "@/lib/apex/api";
import { ApexCreateTenantTrigger } from "@/Components/apex/onboarding/ApexCreateTenantTrigger";

const WHATSAPP = ["+251935000642", "+251930272975"];

export default function SignupsPage() {
  const [rows, setRows] = useState<MonthlySignupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();
  const { refresh: refreshSummary } = useApexDashboard();

  const load = useCallback(
    (force = false) => {
      if (force) {
        invalidateApexCaches("apex:signups");
        invalidateApexCaches("apex:tenants");
        invalidateApexCaches("apex:tenant-payments");
        invalidateApexCaches("apex:payments");
      }
      void coordinator.run(async (isStale) => {
        setLoading(true);
        setError(null);
        try {
          const list = await fetchMonthlySignups();
          if (!isStale()) setRows(list);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load signups");
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
        title="New signups"
        description="Properties that signed up this month — filter by pending, approved, or rejected setup"
        actions={
          <ApexCreateTenantTrigger size="sm" variant="apex">
            Create tenant manually
          </ApexCreateTenantTrigger>
        }
      />

      <ApexInfoBanner icon={Phone}>
        Escalation WhatsApp: {WHATSAPP.join(" · ")} · CBE account{" "}
        <span className="font-mono">1000418779358</span>
      </ApexInfoBanner>

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={8} />
        ) : (
          <ApexSignupsTable
            rows={rows}
            onChanged={() => {
              load(true);
              void refreshSummary(true);
            }}
          />
        )}
      </ApexPanel>
    </div>
  );
}
