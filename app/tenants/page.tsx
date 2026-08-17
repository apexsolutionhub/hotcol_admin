"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, MessageCircle, ShieldOff } from "lucide-react";
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
import { CafeOrderModeBadge } from "@/Components/apex/CafeOrderModeBadge";
import { Badge } from "@/Components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { ApexCreateTenantTrigger } from "@/Components/apex/onboarding/ApexCreateTenantTrigger";
import { ApexTenantListSummary } from "@/Components/apex/tenant/ApexTenantListSummary";
import { APEX_BUSINESS_TYPES } from "@/constants/businessTypes";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

type AccountStatusFilter = "all" | "active" | "suspended" | "banned" | "deleted";
type InactiveStatusFilter = "all" | "suspended" | "banned" | "deleted";

const ACCOUNT_STATUS_OPTIONS: { value: AccountStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
  { value: "deleted", label: "Deleted" },
];

const INACTIVE_STATUSES = new Set(["suspended", "banned", "deleted"]);

function tenantsHref(opts: {
  status?: string;
  type?: string;
  filter?: string | null;
}) {
  const params = new URLSearchParams();
  if (opts.filter) params.set("filter", opts.filter);
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.type && opts.type !== "all") params.set("type", opts.type);
  const qs = params.toString();
  return qs ? `/tenants?${qs}` : "/tenants";
}

function matchesAccountStatusFilter(
  accountStatus: string,
  statusFilter: AccountStatusFilter,
) {
  const status = String(accountStatus || "").toLowerCase();
  if (statusFilter === "all") return status !== "deleted";
  return status === statusFilter;
}

function isInactiveAccount(accountStatus: string) {
  return INACTIVE_STATUSES.has(String(accountStatus || "").toLowerCase());
}

export default function TenantsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading tenants…" />}>
      <TenantsContent />
    </Suspense>
  );
}

function TenantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFilter = searchParams.get("filter");
  const filterInactive =
    rawFilter === "inactive" || rawFilter === "setup_pending";
  const typeFilter = searchParams.get("type") || "all";
  const rawStatus = searchParams.get("status") || "all";
  const statusFilter: AccountStatusFilter = ACCOUNT_STATUS_OPTIONS.some(
    (option) => option.value === rawStatus,
  )
    ? (rawStatus as AccountStatusFilter)
    : "all";
  const inactiveStatusFilter: InactiveStatusFilter =
    rawStatus === "suspended" || rawStatus === "banned" || rawStatus === "deleted"
      ? rawStatus
      : "all";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [allInactive, setAllInactive] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    if (rawFilter === "setup_pending") {
      router.replace("/tenants?filter=inactive");
    }
  }, [rawFilter, router]);

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
        if (filterInactive) {
          const inactive = list.filter((t) => isInactiveAccount(t.accountStatus));
          const filtered =
            inactiveStatusFilter === "all"
              ? inactive
              : inactive.filter(
                  (t) =>
                    String(t.accountStatus).toLowerCase() === inactiveStatusFilter,
                );
          if (!isStale()) {
            setAllInactive(inactive);
            setTenants(filtered);
          }
        } else {
          const filtered = list.filter((t) =>
            matchesAccountStatusFilter(t.accountStatus, statusFilter),
          );
          if (!isStale()) {
            setAllInactive([]);
            setTenants(filtered);
          }
        }
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load tenants");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [
    debouncedSearch,
    filterInactive,
    typeFilter,
    statusFilter,
    inactiveStatusFilter,
    coordinator,
  ]);

  const inactiveTabItems = useMemo(
    () => [
      {
        value: "all" as const,
        label: "All",
        count: allInactive.length,
      },
      {
        value: "suspended" as const,
        label: "Suspended",
        count: allInactive.filter(
          (t) => String(t.accountStatus).toLowerCase() === "suspended",
        ).length,
      },
      {
        value: "banned" as const,
        label: "Banned",
        count: allInactive.filter(
          (t) => String(t.accountStatus).toLowerCase() === "banned",
        ).length,
      },
      {
        value: "deleted" as const,
        label: "Deleted",
        count: allInactive.filter(
          (t) => String(t.accountStatus).toLowerCase() === "deleted",
        ).length,
      },
    ],
    [allInactive],
  );

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
        id: "cafeOrderMode",
        header: "Order mode",
        cell: ({ row }) => <CafeOrderModeBadge mode={row.original.cafeOrderMode} />,
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
        title={filterInactive ? "Inactive Tenants" : "Tenants"}
        description={
          filterInactive
            ? "Suspended, banned, and deleted properties — no hotcol-user access while inactive"
            : statusFilter === "deleted"
              ? "Soft-deleted properties kept for records — no hotcol-user access"
              : "Search by business name, TIN, or Admin/Manager username"
        }
        breadcrumbs={
          filterInactive
            ? [
                { label: "Tenants", href: "/tenants" },
                { label: "Inactive Tenants" },
              ]
            : undefined
        }
        actions={
          !filterInactive && statusFilter !== "deleted" ? (
            <ApexCreateTenantTrigger size="sm" variant="apex">
              Create tenant
            </ApexCreateTenantTrigger>
          ) : undefined
        }
      />

      {filterInactive ? (
        <div className="space-y-5">
          <Tabs
            value={inactiveStatusFilter}
            onValueChange={(value) => {
              router.push(
                tenantsHref({
                  filter: "inactive",
                  status: value,
                  type: typeFilter,
                }),
              );
            }}
            className="w-full"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-2.5 rounded-none border-0 bg-transparent p-0 shadow-none">
              {inactiveTabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="apex-tabs-trigger h-11 flex-none gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2 text-left leading-none shadow-sm transition-all duration-150 hover:border-white/12 hover:bg-white/4.5 data-[state=active]:border-[oklch(0.68_0.05_85/0.28)] data-[state=active]:bg-[oklch(0.24_0.014_265)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_8px_20px_-12px_oklch(0.88_0.06_85/0.45)]"
                >
                  <span className="text-sm font-medium tracking-tight">
                    {tab.label}
                  </span>
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground dark:bg-white/10">
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
                <ShieldOff className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Inactive snapshot
                  </p>
                  <Badge variant="secondary">
                    {inactiveStatusFilter === "all"
                      ? "All inactive"
                      : inactiveStatusFilter.charAt(0).toUpperCase() +
                        inactiveStatusFilter.slice(1)}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  These properties cannot sign in to hotcol-user until restored from
                  Access control on the tenant detail page.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-500/14 bg-amber-500/6 px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-100/80">
                  Suspended
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {inactiveTabItems[1]?.count ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/14 bg-rose-500/6 px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-200/80">
                  Banned
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {inactiveTabItems[2]?.count ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/4 px-3.5 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Deleted
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {inactiveTabItems[3]?.count ?? 0}
                </p>
              </div>
            </div>
          </div>

          <ApexFilterTabs
            value={typeFilter}
            wrap
            tabs={[
              {
                value: "all",
                label: "All types",
                href: tenantsHref({
                  filter: "inactive",
                  status: inactiveStatusFilter,
                  type: "all",
                }),
              },
              ...APEX_BUSINESS_TYPES.map((t) => ({
                value: t.key,
                label: t.label,
                href: tenantsHref({
                  filter: "inactive",
                  status: inactiveStatusFilter,
                  type: t.key,
                }),
              })),
            ]}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <ApexFilterTabs
              value={typeFilter}
              wrap
              tabs={[
                {
                  value: "all",
                  label: "All types",
                  href: tenantsHref({ status: statusFilter, type: "all" }),
                },
                ...APEX_BUSINESS_TYPES.map((t) => ({
                  value: t.key,
                  label: t.label,
                  href: tenantsHref({ status: statusFilter, type: t.key }),
                })),
              ]}
            />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 sm:pl-2">
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              Status
            </span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                router.push(
                  tenantsHref({
                    status: value,
                    type: typeFilter,
                  }),
                );
              }}
            >
              <SelectTrigger className="h-10 w-46 rounded-xl border-white/10 bg-white/4">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search name, TIN, username…"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      {!loading && !filterInactive && tenants.length > 0 ? (
        <ApexTenantListSummary tenants={tenants} total={tenants.length} />
      ) : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : tenants.length === 0 ? (
          <ApexEmptyState
            icon={filterInactive ? ShieldOff : Building2}
            title={filterInactive ? "No inactive tenants" : "No tenants found"}
            description={
              debouncedSearch
                ? "Try a different search term."
                : filterInactive
                  ? inactiveStatusFilter === "all"
                    ? "No suspended, banned, or deleted properties right now."
                    : `No ${inactiveStatusFilter} tenants match this filter.`
                  : statusFilter === "deleted"
                    ? "No deleted tenants yet."
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
