"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { TenantUserMonitoringRow } from "@/lib/apex/actions";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import { businessTypeLabel } from "@/constants/businessTypes";
import { cn } from "@/lib/utils";

export type TenantUsersGroup = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string;
  roleCount: number;
  roles: string[];
  userCount: number;
  disabledCount: number;
  pays: boolean;
  standingLabel: string;
  subscriptionStatus: string | null;
  accountStatus: string | null;
  isIllustrationTenant: boolean;
  users: TenantUserMonitoringRow[];
};

/** Third meta segment: Banned / Suspended / Pays / Doesn't pay */
export function tenantStandingLabel(input: {
  accountStatus?: string | null;
  subscriptionStatus?: string | null;
  isIllustrationTenant?: boolean;
}): string {
  const account = String(input.accountStatus || "").trim().toLowerCase();
  if (account === "banned") return "Banned";
  if (account === "suspended") return "Suspended";

  const subscription = String(input.subscriptionStatus || "").trim().toLowerCase();
  if (input.isIllustrationTenant || subscription === "exempt") {
    return "Doesn't pay";
  }

  if (
    subscription === "active" ||
    subscription === "warning" ||
    subscription === "trial"
  ) {
    return "Pays";
  }

  return "Doesn't pay";
}

export function tenantUsersMetaLine(group: TenantUsersGroup) {
  return `${businessTypeLabel(group.businessType)} · ${group.roleCount} ${
    group.roleCount === 1 ? "role" : "roles"
  } · ${group.standingLabel}`;
}

function usersGroupedByRole(users: TenantUserMonitoringRow[]) {
  const map = new Map<string, TenantUserMonitoringRow[]>();
  for (const user of users) {
    const key = String(user.role || "").trim() || "Unassigned";
    const list = map.get(key);
    if (list) list.push(user);
    else map.set(key, [user]);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function UserDetailCard({ user }: { user: TenantUserMonitoringRow }) {
  return (
    <div className="w-full min-w-0 rounded-lg border border-border/60 bg-card/80 px-3 py-2.5">
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium wrap-break-word">{user.userName}</p>
          <p className="text-xs text-muted-foreground wrap-break-word">
            Role: <span className="text-foreground/90">{user.role || "—"}</span>
          </p>
          {user.loginDisabled && user.loginDisabledReason ? (
            <p className="text-[11px] text-destructive/90 wrap-break-word">
              {user.loginDisabledReason}
            </p>
          ) : null}
        </div>
        {user.loginDisabled ? (
          <Badge variant="destructive" className="w-fit shrink-0 text-[10px] font-normal">
            Disabled
          </Badge>
        ) : (
          <Badge variant="success" className="w-fit shrink-0 text-[10px] font-normal">
            Active
          </Badge>
        )}
      </div>
    </div>
  );
}

function TenantIdentity({ group }: { group: TenantUsersGroup }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold wrap-break-word">{group.hotelDisplayName}</p>
      <p className="text-[11px] leading-snug text-muted-foreground wrap-break-word">
        {tenantUsersMetaLine(group)}
      </p>
    </div>
  );
}

function PreviewBody({ group }: { group: TenantUsersGroup }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <TenantIdentity group={group} />
        <p className="shrink-0 text-xs font-semibold tabular-nums">
          {group.userCount} user{group.userCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-1.5 text-[11px] text-muted-foreground">
        <p className="break-all">
          <span className="text-foreground/80">TIN</span> {group.tinNumber}
        </p>
        {group.roles.length > 0 ? (
          <p className="wrap-break-word">
            <span className="text-foreground/80">Roles</span>{" "}
            {group.roles.join(", ")}
          </p>
        ) : null}
        <p className="wrap-break-word">
          <span className="text-foreground/80">Standing</span> {group.standingLabel}
          {group.isIllustrationTenant ? " · illustration" : ""}
        </p>
        <p>
          <span className="text-foreground/80">Login</span>{" "}
          {group.disabledCount > 0
            ? `${group.disabledCount} disabled · ${group.userCount - group.disabledCount} active`
            : "All active"}
        </p>
      </div>

      <div className="space-y-1.5 border-t border-border/50 pt-2">
        {group.users.map((user) => (
          <UserDetailCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function SheetBody({ group }: { group: TenantUsersGroup }) {
  const byRole = usersGroupedByRole(group.users);
  return (
    <div className="w-full min-w-0 space-y-5 pb-2">
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4">
        <TenantIdentity group={group} />

        <dl className="grid w-full min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">TIN</dt>
            <dd className="font-mono text-xs font-medium break-all">
              {group.tinNumber}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Business type</dt>
            <dd className="font-medium wrap-break-word">
              {businessTypeLabel(group.businessType)}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-[11px] text-muted-foreground">Roles</dt>
            <dd className="font-medium wrap-break-word">
              {group.roleCount}{" "}
              {group.roleCount === 1 ? "role" : "roles"}
              {group.roles.length > 0 ? ` — ${group.roles.join(", ")}` : ""}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-[11px] text-muted-foreground">Standing</dt>
            <dd className="font-medium wrap-break-word">
              {group.standingLabel}
              {group.isIllustrationTenant ? " · illustration tenant" : ""}
              {group.subscriptionStatus
                ? ` · ${group.subscriptionStatus.replace(/_/g, " ")}`
                : ""}
              {group.accountStatus ? ` · account ${group.accountStatus}` : ""}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Users</dt>
            <dd className="font-medium tabular-nums">{group.userCount}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">Login</dt>
            <dd className="font-medium wrap-break-word">
              {group.disabledCount > 0 ? (
                <span className="text-destructive">
                  {group.disabledCount} disabled
                </span>
              ) : (
                "All active"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="w-full min-w-0 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 shrink-0 opacity-70" />
          Staff accounts
        </div>
        {byRole.map(([role, users]) => (
          <section key={role} className="w-full min-w-0 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="min-w-0 text-sm font-semibold wrap-break-word">
                {role}
              </h3>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {users.length}
              </span>
            </div>
            <div className="w-full min-w-0 space-y-1.5">
              {users.map((user) => (
                <UserDetailCard key={user.id} user={user} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Button asChild variant="outline" size="sm" className="w-full">
        <Link href={`/tenants/${encodeURIComponent(group.tinNumber)}`}>
          Open property page
        </Link>
      </Button>
    </div>
  );
}

export function ApexTenantUsersDetailTrigger({
  group,
  children,
  className,
}: {
  group: TenantUsersGroup;
  children: ReactNode;
  className?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };

  const schedulePreviewOpen = () => {
    if (sheetOpen) return;
    clearTimers();
    openTimer.current = setTimeout(() => setPreviewOpen(true), 220);
  };

  const schedulePreviewClose = () => {
    clearTimers();
    closeTimer.current = setTimeout(() => setPreviewOpen(false), 160);
  };

  const openSheet = () => {
    clearTimers();
    setPreviewOpen(false);
    setSheetOpen(true);
  };

  return (
    <>
      <Popover
        open={previewOpen && !sheetOpen}
        onOpenChange={(next) => {
          if (!next) setPreviewOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group/detail max-w-full rounded-md text-left outline-none transition-colors",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/40",
              "cursor-pointer",
              className,
            )}
            onMouseEnter={schedulePreviewOpen}
            onMouseLeave={schedulePreviewClose}
            onFocus={schedulePreviewOpen}
            onBlur={schedulePreviewClose}
            onClick={(e) => {
              e.stopPropagation();
              openSheet();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openSheet();
              }
            }}
            aria-label={`Details for ${group.hotelDisplayName}`}
          >
            <span className="inline-flex max-w-full items-start gap-1">
              <span className="min-w-0 flex-1">{children}</span>
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/detail:opacity-70" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="flex max-h-[min(80vh,36rem)] w-[min(100vw-2rem,28rem)] flex-col overflow-hidden border-border/70 p-0 shadow-lg"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <PreviewBody group={group} />
          </div>
          <div className="shrink-0 border-t border-border/60 bg-popover p-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full cursor-pointer"
              onClick={openSheet}
            >
              Open full detail
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-[min(100%,32rem)] max-w-[min(100%,32rem)] flex-col gap-0 overflow-hidden p-0 sm:w-lg sm:max-w-lg"
        >
          <SheetHeader className="shrink-0 space-y-1.5 border-b border-border/60 px-5 py-4 pr-14 text-left">
            <SheetTitle className="text-base leading-snug wrap-break-word">
              {group.hotelDisplayName}
            </SheetTitle>
            <SheetDescription className="text-xs leading-snug wrap-break-word">
              {tenantUsersMetaLine(group)}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4">
            <SheetBody group={group} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
