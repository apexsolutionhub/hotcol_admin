"use client";

import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import type { TenantDetail } from "@/lib/apex/actions";

type Props = {
  users: TenantDetail["users"];
  busy: boolean;
  onToggleLogin: (userId: number, wasDisabled: boolean) => void;
};

export function ApexTenantStaffTable({ users, busy, onToggleLogin }: Props) {
  return (
    <ApexPanel contentClassName="p-0">
      <div className="border-b border-border/60 px-4 py-3 sm:px-6">
        <h2 className="font-semibold">Staff accounts</h2>
        <p className="text-sm text-muted-foreground">Emergency per-user login disable</p>
      </div>
      <ApexTableWrap>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Login</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.UserName}</TableCell>
                <TableCell>{u.Role}</TableCell>
                <TableCell>
                  {u.loginDisabled ? (
                    <Badge variant="destructive">Disabled</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={u.loginDisabled ? "success" : "destructive"}
                      className="apex-row-action"
                      disabled={busy}
                    onClick={() => onToggleLogin(u.id, u.loginDisabled)}
                  >
                    {u.loginDisabled ? "Enable" : "Disable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ApexTableWrap>
    </ApexPanel>
  );
}
