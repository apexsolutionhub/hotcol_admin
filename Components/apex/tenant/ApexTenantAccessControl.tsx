"use client";

import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Textarea } from "@/Components/ui/textarea";
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
  return (
    <Card className="apex-panel-surface border-rose-500/15">
      <CardHeader>
        <CardTitle className="text-base text-rose-200">Access control</CardTitle>
        <CardDescription>Suspend, ban, or restore this property (all staff)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tenant.suspendedReason ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Suspended:</span> {tenant.suspendedReason}
          </p>
        ) : null}
        {tenant.bannedReason ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Banned:</span> {tenant.bannedReason}
          </p>
        ) : null}
        <Textarea
          placeholder="Reason (required for suspend or ban)"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex flex-wrap gap-2">
          {tenant.accountStatus === "active" ? (
            <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="apex-row-action"
                    disabled={busy || !reason.trim()}
                    onClick={onSuspend}
                  >
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="apex-row-action"
                    disabled={busy || !reason.trim()}
                    onClick={onBan}
                  >
                    Ban property
                  </Button>
            </>
          ) : tenant.accountStatus === "suspended" ? (
                <Button
                  size="sm"
                  variant="success"
                  className="apex-row-action"
                  disabled={busy}
                  onClick={onUnsuspend}
                >
                  Unsuspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="success"
                  className="apex-row-action"
                  disabled={busy}
                  onClick={onUnban}
                >
                  Unban
                </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
