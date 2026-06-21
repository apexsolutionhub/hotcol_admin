"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Puzzle } from "lucide-react";
import { fetchModuleChangeRequests, type ModuleChangeRequestRow } from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexFilterTabs } from "@/Components/apex/layout/ApexFilterTabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Badge } from "@/Components/ui/badge";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";
import { ApexModuleRequestActions } from "@/Components/apex/modules/ApexModuleRequestActions";
import { invalidateApexCaches } from "@/lib/apex/actions";

export default function ModulesPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading module requests…" />}>
      <ModulesContent />
    </Suspense>
  );
}

function ModulesContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "pending";
  const [rows, setRows] = useState<ModuleChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  useEffect(() => {
    void coordinator.run(async (isStale) => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchModuleChangeRequests(
          statusFilter !== "all" ? statusFilter : undefined,
        );
        if (!isStale()) setRows(list);
      } catch (e) {
        const msg = mapApexApiError(e, "Failed to load module requests");
        if (!isStale() && msg) setError(msg);
      } finally {
        if (!isStale()) setLoading(false);
      }
    });
  }, [statusFilter, coordinator]);

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Module requests"
        description="Properties requesting module changes — review pending items first"
      />

      <ApexFilterTabs
        value={statusFilter}
        tabs={[
          { value: "pending", label: "Pending", href: "/modules?status=pending" },
          { value: "approved", label: "Approved", href: "/modules?status=approved" },
          { value: "rejected", label: "Rejected", href: "/modules?status=rejected" },
          { value: "all", label: "All", href: "/modules?status=all" },
        ]}
      />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={5} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={Puzzle}
            title="No module requests"
            description={
              statusFilter === "pending"
                ? "No pending module change requests."
                : "No requests match this filter."
            }
          />
        ) : (
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Property</TableHead>
                  <TableHead>Requested modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/tenants/${encodeURIComponent(row.tinNumber)}`}
                        className="font-medium hover:text-[oklch(0.82_0.04_85)]"
                      >
                        {row.hotelDisplayName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{row.tinNumber}</p>
                      {row.requestNote ? (
                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                          {row.requestNote}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.requestedModules.map((m) => (
                          <Badge key={m} variant="outline" className="font-normal">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "approved"
                            ? "success"
                            : row.status === "rejected"
                              ? "destructive"
                              : "warning"
                        }
                        className="capitalize"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{row.requestedBySide}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <ApexModuleRequestActions
                        requestId={row.id}
                        status={row.status}
                        onDone={() => {
                          invalidateApexCaches("apex:modules");
                          void coordinator.run(async (isStale) => {
                            setLoading(true);
                            try {
                              const list = await fetchModuleChangeRequests(
                                statusFilter !== "all" ? statusFilter : undefined,
                              );
                              if (!isStale()) setRows(list);
                            } finally {
                              if (!isStale()) setLoading(false);
                            }
                          });
                        }}
                      />
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
