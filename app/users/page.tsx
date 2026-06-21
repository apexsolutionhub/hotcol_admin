"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { fetchTenantUsers, type TenantUserMonitoringRow } from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/Components/apex/layout/ApexSearchInput";
import { ApexFilterTabs } from "@/Components/apex/layout/ApexFilterTabs";
import { Badge } from "@/Components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { APEX_BUSINESS_TYPES, businessTypeLabel } from "@/constants/businessTypes";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function UsersPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading users…" />}>
      <UsersContent />
    </Suspense>
  );
}

function UsersContent() {
  const searchParams = useSearchParams();
  const filterDisabled = searchParams.get("filter") === "disabled";
  const typeFilter = searchParams.get("type") || "all";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<TenantUserMonitoringRow[]>([]);
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
        const list = await fetchTenantUsers(
          debouncedSearch || undefined,
          typeFilter !== "all" ? typeFilter : undefined,
        );
        const filtered = filterDisabled ? list.filter((u) => u.loginDisabled) : list;
        if (!isStale()) setRows(filtered);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load users");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [debouncedSearch, filterDisabled, typeFilter, coordinator]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title={filterDisabled ? "Disabled logins" : "Tenant users"}
        description={
          filterDisabled
            ? "Staff accounts with login disabled"
            : "All staff accounts across HotCol properties"
        }
        breadcrumbs={
          filterDisabled
            ? [{ label: "Tenant users", href: "/users" }, { label: "Disabled" }]
            : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <ApexFilterTabs
          value={filterDisabled ? "disabled" : "all"}
          tabs={[
            {
              value: "all",
              label: "All users",
              href: `/users${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`,
            },
            {
              value: "disabled",
              label: "Disabled only",
              href: `/users?filter=disabled${typeFilter !== "all" ? `&type=${typeFilter}` : ""}`,
            },
          ]}
        />

        <ApexFilterTabs
          value={typeFilter}
          wrap
          tabs={[
            {
              value: "all",
              label: "All types",
              href: `/users${filterDisabled ? "?filter=disabled" : ""}`,
            },
            ...APEX_BUSINESS_TYPES.map((t) => ({
              value: t.key,
              label: t.label,
              href: `/users?${filterDisabled ? "filter=disabled&" : ""}type=${encodeURIComponent(t.key)}`,
            })),
          ]}
        />
      </div>

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search username, property, TIN…"
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={Users}
            title="No users found"
            description={
              debouncedSearch ? "Try a different search term." : "No accounts match this filter."
            }
          />
        ) : (
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>TIN</TableHead>
                  <TableHead>Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.userName}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <Link
                        href={`/tenants/${encodeURIComponent(u.tinNumber)}`}
                        className="text-foreground hover:text-[oklch(0.82_0.04_85)]"
                      >
                        {u.hotelDisplayName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {businessTypeLabel(u.businessType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.tinNumber}
                    </TableCell>
                    <TableCell>
                      {u.loginDisabled ? (
                        <Badge variant="destructive" title={u.loginDisabledReason ?? undefined}>
                          Disabled
                        </Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
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
