"use client";

import { AlertTriangle, Ban, Pause, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { ApexTenantTabShell } from "@/Components/apex/tenant/ApexTenantTabShell";
import { AccountStatusBadge } from "@/Components/apex/StatusBadge";
import type { TenantDetail } from "@/lib/apex/actions";

type Props = {
  tenant: TenantDetail;
  reason: string;
  busy: boolean;
  onReasonChange: (value: string) => void;
  onSuspend: () => void;
  onBan: () => void;
  onUnsuspend: () => void;
  onUnban: () => void;
};

export function ApexTenantAccessControl({
  tenant,
  reason,
  busy,
  onReasonChange,
  onSuspend,
  onBan,
  onUnsuspend,
  onUnban,
}: Props) {
  const isActive = tenant.accountStatus === "active";
  const isSuspended = tenant.accountStatus === "suspended";

  return (
    <ApexTenantTabShell
      title="Access control"
      description="Suspend, ban, or restore this property — applies to all staff logins."
      icon={Shield}
      tone="rose"
      actions={<AccountStatusBadge status={tenant.accountStatus} />}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Current state
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-foreground">
              {tenant.accountStatus}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isActive
                ? "Property can sign in normally."
                : isSuspended
                  ? "Temporarily locked — unsuspend to restore."
                  : "Permanently blocked — unban to restore."}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/3 p-4 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Recorded reasons
            </p>
            {tenant.suspendedReason ? (
              <p className="text-sm text-muted-foreground">
                <Badge variant="warning" className="mr-2">
                  Suspended
                </Badge>
                {tenant.suspendedReason}
              </p>
            ) : null}
            {tenant.bannedReason ? (
              <p className="text-sm text-muted-foreground">
                <Badge variant="destructive" className="mr-2">
                  Banned
                </Badge>
                {tenant.bannedReason}
              </p>
            ) : null}
            {!tenant.suspendedReason && !tenant.bannedReason ? (
              <p className="text-sm text-muted-foreground">No prior enforcement notes.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="access-reason">
            Reason
          </label>
          <Textarea
            id="access-reason"
            placeholder="Required for suspend or ban — shown in audit history"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
          {isActive && !reason.trim() ? (
            <p className="flex items-center gap-1.5 text-xs text-[oklch(0.82_0.06_75)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Enter a reason before suspending or banning.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onSuspend}
              >
                <Pause className="h-3.5 w-3.5" />
                Suspend
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="apex-row-action gap-1.5"
                disabled={busy || !reason.trim()}
                onClick={onBan}
              >
                <Ban className="h-3.5 w-3.5" />
                Ban property
              </Button>
            </>
          ) : isSuspended ? (
            <Button
              size="sm"
              variant="success"
              className="apex-row-action gap-1.5"
              disabled={busy}
              onClick={onUnsuspend}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Unsuspend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              className="apex-row-action gap-1.5"
              disabled={busy}
              onClick={onUnban}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Unban
            </Button>
          )}
        </div>
      </div>
    </ApexTenantTabShell>
  );
}
