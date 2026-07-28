"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  fetchFeedbackDirectory,
  invalidateApexCaches,
  type FeedbackDirectoryRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel } from "@/Components/apex/layout/ApexPanel";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/Components/apex/layout/ApexSearchInput";
import { ApexResultCount } from "@/Components/apex/layout/ApexFilterTabs";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexStartChatDialog } from "@/Components/apex/feedback/ApexStartChatDialog";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { useLoadCoordinator } from "@/hooks/useLoadCoordinator";
import { mapApexApiError } from "@/lib/apex/api";

export default function FeedbackPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading chats…" />}>
      <FeedbackList />
    </Suspense>
  );
}

function FeedbackList() {
  const searchParams = useSearchParams();
  const filterTin = searchParams.get("tin");
  const [search, setSearch] = useState("");
  const [allRows, setAllRows] = useState<FeedbackDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const coordinator = useLoadCoordinator();

  const load = useCallback(
    (force = false) => {
      if (force) invalidateApexCaches("apex:feedback-dir");
      void coordinator.run(async (isStale) => {
        setLoading(true);
        setError(null);
        try {
          const list = await fetchFeedbackDirectory();
          if (!isStale()) setAllRows(list);
        } catch (e) {
          const msg = mapApexApiError(e, "Failed to load properties");
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

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allRows;
    if (filterTin) list = list.filter((t) => t.tinNumber === filterTin);
    if (q) {
      list = list.filter((t) => {
        const hay = `${t.hotelDisplayName} ${t.tinNumber}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [allRows, search, filterTin]);

  const columns = useMemo<ColumnDef<FeedbackDirectoryRow>[]>(
    () => [
      {
        accessorKey: "hotelDisplayName",
        header: "Business",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/tenants/${encodeURIComponent(row.original.tinNumber)}`}
              className="font-medium transition-colors hover:text-[oklch(0.82_0.04_85)]"
            >
              {row.original.hotelDisplayName}
            </Link>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.tinNumber}
            </p>
          </div>
        ),
      },
      {
        id: "chat",
        header: "Chat",
        cell: ({ row }) =>
          row.original.threadId ? (
            <Badge variant="outline" className="capitalize">
              {row.original.chatStatus}
            </Badge>
          ) : (
            <Badge variant="secondary">No chat yet</Badge>
          ),
      },
      {
        accessorKey: "unreadFromTenant",
        header: "Unread",
        cell: ({ row }) =>
          row.original.unreadFromTenant > 0 ? (
            <Badge variant="success">{row.original.unreadFromTenant}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "lastMessage",
        header: "Last message",
        cell: ({ row }) => (
          <span className="block max-w-xs truncate text-sm text-muted-foreground">
            {row.original.lastMessage?.body ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleString()
              : "—"}
          </span>
        ),
      },
      {
        id: "open",
        header: () => <div className="text-right">Open</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.threadId ? (
              <Button asChild size="sm" variant="outline" className="apex-row-action">
                <Link href={`/feedback/${row.original.threadId}`}>Open chat</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="apex" className="apex-row-action">
                <Link href={`/feedback?tin=${encodeURIComponent(row.original.tinNumber)}`}>
                  Start chat
                </Link>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <ApexPageHeader
        title="Property chat"
        description={
          filterTin
            ? `All properties — filtered to TIN ${filterTin}`
            : "Every HotCol property — open an existing thread or start a new chat"
        }
        breadcrumbs={
          filterTin
            ? [{ label: "Property chat", href: "/feedback" }, { label: filterTin }]
            : undefined
        }
        actions={<ApexStartChatDialog defaultTin={filterTin ?? undefined} />}
      />

      <ApexSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Filter by business name or TIN…"
      />

      <ApexResultCount shown={rows.length} total={allRows.length} noun="properties" />

      {error ? <ApexErrorAlert message={error} /> : null}

      <ApexPanel>
        {loading ? (
          <ApexTableSkeleton cols={6} />
        ) : rows.length === 0 ? (
          <ApexEmptyState
            icon={MessageCircle}
            title="No properties match"
            description={
              search.trim()
                ? "Try a different search term."
                : "Every HotCol property will appear here for chat."
            }
            action={
              filterTin ? (
                <ApexStartChatDialog defaultTin={filterTin} />
              ) : undefined
            }
          />
        ) : (
          <ApexDataTable
            data={rows}
            columns={columns}
            noun="properties"
            pageSize={10}
          />
        )}
      </ApexPanel>
    </div>
  );
}
