"use client";

import { useEffect, useState } from "react";
import { Building2, UserPlus } from "lucide-react";
import {
  fetchTenantsWithoutOwner,
  type TenantWithoutOwnerRow,
} from "@/lib/apex/actions";
import { ApexCreateTenantOwnerDialog } from "@/Components/apex/onboarding/ApexCreateTenantOwnerDialog";
import { tenantPrimaryRole } from "@/lib/signup/subscriptionModules";
import type { BusinessType } from "@/constants/signup";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { businessTypeLabel } from "@/constants/businessTypes";
import { ApexCreateTenantTrigger } from "@/Components/apex/onboarding/ApexCreateTenantTrigger";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function TenantsWithoutOwnerPage() {
  const [rows, setRows] = useState<TenantWithoutOwnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TenantWithoutOwnerRow | null>(null);
  const coordinator = useLoadCoordinator();

  const load = () => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchTenantsWithoutOwner();
        if (!isStale()) setRows(list);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load properties");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  };

  useEffect(() => {
    load();
  }, [coordinator]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Properties without Admin/Manager"
        description="Tenant accounts that exist but have no Admin (café) or Manager (hotel) login yet."
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: "Missing Admin/Manager" },
        ]}
        actions={
          <ApexCreateTenantTrigger size="sm" variant="apex">
            <UserPlus className="mr-2 h-4 w-4" />
            Create new tenant
          </ApexCreateTenantTrigger>
        }
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={5} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={Building2}
            title="All properties have Admin or Manager logins"
            description="When a tenant account exists without an Admin or Manager user, it will appear here."
          />
        ) : (
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.tinNumber}>
                    <TableCell>
                      <p className="font-medium">{row.hotelDisplayName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{row.tinNumber}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {businessTypeLabel(row.businessType)}
                    </TableCell>
                    <TableCell>
                      {row.hasStaffUsers ? (
                        <Badge variant="secondary">Has staff users</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No staff yet</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="apex"
                        onClick={() => setSelected(row)}
                      >
                        Create {tenantPrimaryRole((row.businessType ?? "Cafe and Restaurant") as BusinessType)}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ApexTableWrap>
        )}
      </ApexPanel>

      {selected ? (
        <ApexCreateTenantOwnerDialog
          tenant={selected}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          onCreated={load}
        />
      ) : null}
    </div>
  );
}
