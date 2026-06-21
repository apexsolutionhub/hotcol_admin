"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  fetchFeedbackDirectory,
  invalidateApexCaches,
  type FeedbackDirectoryRow,
} from "@/lib/apex/actions";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexSearchInput } from "@/Components/apex/layout/ApexSearchInput";
import { ApexResultCount } from "@/Components/apex/layout/ApexFilterTabs";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexStartChatDialog } from "@/Components/apex/feedback/ApexStartChatDialog";
import { ApexTableSkeleton } from "@/Components/apex/layout/ApexTableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
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
          <ApexTableWrap>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Business</TableHead>
                  <TableHead>Chat</TableHead>
                  <TableHead>Unread</TableHead>
                  <TableHead>Last message</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.tinNumber} className="group">
                    <TableCell>
                      <Link
                        href={`/tenants/${encodeURIComponent(t.tinNumber)}`}
                        className="font-medium transition-colors group-hover:text-[oklch(0.82_0.04_85)]"
                      >
                        {t.hotelDisplayName}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{t.tinNumber}</p>
                    </TableCell>
                    <TableCell>
                      {t.threadId ? (
                        <Badge variant="outline" className="capitalize">
                          {t.chatStatus}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No chat yet</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.unreadFromTenant > 0 ? (
                        <Badge variant="success">
                          {t.unreadFromTenant}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {t.lastMessage?.body ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.threadId ? (
                        <Button asChild size="sm" variant="outline" className="apex-row-action">
                          <Link href={`/feedback/${t.threadId}`}>Open chat</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="apex" className="apex-row-action">
                          <Link href={`/feedback?tin=${encodeURIComponent(t.tinNumber)}`}>
                            Start chat
                          </Link>
                        </Button>
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
