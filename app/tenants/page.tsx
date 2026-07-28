"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, MessageCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchTenants, type TenantListItem } from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/Components/apex/layout/ApexPanel";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/Components/apex/layout/ApexSearchInput";
import { ApexFilterTabs } from "@/Components/apex/layout/ApexFilterTabs";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import {
  AccountStatusBadge,
  BusinessTypeBadge,
  SubscriptionStatusBadge,
} from "@/Components/apex/StatusBadge";
import { Badge } from "@/Components/ui/badge";
import { ApexCreateTenantTrigger } from "@/Components/apex/onboarding/ApexCreateTenantTrigger";
import { ApexTenantListSummary } from "@/Components/apex/tenant/ApexTenantListSummary";
import { APEX_BUSINESS_TYPES } from "@/constants/businessTypes";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function TenantsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading tenants…" />}>
      <TenantsContent />
    </Suspense>
  );
}

function TenantsContent() {
  const searchParams = useSearchParams();
  const filterSetupPending = searchParams.get("filter") === "setup_pending";
  const typeFilter = searchParams.get("type") || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchTenants(
          debouncedSearch || undefined,
          typeFilter !== "all" ? typeFilter : undefined,
        );
        const filtered = filterSetupPending
          ? list.filter((t) => t.subscriptionStatus === "setup_pending")
          : list;
        if (!isStale()) setTenants(filtered);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load tenants");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [debouncedSearch, filterSetupPending, typeFilter, coordinator]);

  const columns = useMemo<ColumnDef<TenantListItem>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
              className="font-medium text-foreground transition-colors hover:text-[oklch(0.82_0.04_85)]"
            >
              {row.original.hotelDisplayName}
            </Link>
            {row.original.unreadFeedback > 0 ? (
              <span className="mt-1 flex items-center gap-1 text-xs text-[oklch(0.72_0.04_220)]">
                <MessageCircle className="h-3 w-3" />
                {row.original.unreadFeedback} unread
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "businessType",
        header: "Type",
        cell: ({ row }) => (
          <BusinessTypeBadge businessType={row.original.businessType} />
        ),
      },
      {
        accessorKey: "tinNumber",
        header: "TIN",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.tinNumber}
          </span>
        ),
      },
      {
        accessorKey: "accountStatus",
        header: "Account",
        cell: ({ row }) => (
          <AccountStatusBadge status={row.original.accountStatus} />
        ),
      },
      {
        accessorKey: "subscriptionStatus",
        header: "Subscription",
        cell: ({ row }) => (
          <div>
            <SubscriptionStatusBadge status={row.original.subscriptionStatus} />
            {row.original.billingHold ? (
              <Badge variant="warning" className="ml-1">
                Hold
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "ownerUserName",
        header: "Admin / Manager",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.ownerUserName}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={filterSetupPending ? "Setup pending" : "Tenants"}
        description={
          filterSetupPending
            ? "Properties waiting for setup fee approval"
            : "Search by business name, TIN, or Admin/Manager username"
        }
        breadcrumbs={
          filterSetupPending
            ? [
                { label: "Tenants", href: "/tenants" },
                { label: "Setup pending" },
              ]
            : undefined
        }
        actions={
          !filterSetupPending ? (
            <ApexCreateTenantTrigger size="sm" variant="apex">
              Create tenant
            </ApexCreateTenantTrigger>
          ) : undefined
        }
      />

      {!filterSetupPending ? (
        <ApexFilterTabs
          value={typeFilter}
          wrap
          tabs={[
            { value: "all", label: "All types", href: "/tenants" },
            ...APEX_BUSINESS_TYPES.map((t) => ({
              value: t.key,
              label: t.label,
              href: `/tenants?type=${encodeURIComponent(t.key)}`,
            })),
          ]}
        />
      ) : null}

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search name, TIN, username…"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      {!loading && tenants.length > 0 ? (
        <ApexTenantListSummary tenants={tenants} total={tenants.length} />
      ) : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : tenants.length === 0 ? (
          <ApexEmptyState
            icon={Building2}
            title="No tenants found"
            description={
              debouncedSearch
                ? "Try a different search term."
                : "No properties match this filter."
            }
          />
        ) : (
          <ApexDataTable
            data={tenants}
            columns={columns}
            noun="tenants"
            pageSize={10}
          />
        )}
      </ApexPanel>
    </div>
  );
}
