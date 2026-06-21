"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, MessageCircle } from "lucide-react";
import { fetchTenants, type TenantListItem } from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
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

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={filterSetupPending ? "Setup pending" : "Tenants"}
        description={
          filterSetupPending
            ? "Properties waiting for setup fee approval"
            : "Search by business name, TIN, or owner username"
        }
        breadcrumbs={
          filterSetupPending
            ? [
                { label: "Tenants", href: "/tenants" },
                { label: "Setup pending" },
              ]
            : undefined
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
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.tinNumber} className="group">
                    <TableCell>
                      <Link
                        href={`/tenants/${encodeURIComponent(t.tinNumber)}`}
                        className="font-medium text-foreground transition-colors group-hover:text-[oklch(0.82_0.04_85)]"
                      >
                        {t.hotelDisplayName}
                      </Link>
                      {t.unreadFeedback > 0 ? (
                        <span className="mt-1 flex items-center gap-1 text-xs text-[oklch(0.72_0.04_220)]">
                          <MessageCircle className="h-3 w-3" />
                          {t.unreadFeedback} unread
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <BusinessTypeBadge businessType={t.businessType} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.tinNumber}
                    </TableCell>
                    <TableCell>
                      <AccountStatusBadge status={t.accountStatus} />
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={t.subscriptionStatus} />
                      {t.billingHold ? (
                        <Badge variant="warning" className="ml-1">
                          Hold
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">{t.ownerUserName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ApexTableWrap>
        )}
      </ApexPanel>
    </div>
  );
}
