"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { ApexPanel, ApexTableWrap } from "@/Components/apex/layout/ApexPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  approveQuarterly,
  approveYearly,
  approveSetup,
  rejectPayment,
  type TenantDetail,
} from "@/lib/apex/actions";

type Payment = TenantDetail["recentPayments"][number];

type Props = {
  tinNumber: string;
  payments: Payment[];
  busy: boolean;
  onChanged: () => void;
};

export function ApexTenantPaymentsTable({ tinNumber, payments, busy, onChanged }: Props) {
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [actingId, setActingId] = useState<number | null>(null);

  const run = async (id: number, fn: () => Promise<void>) => {
    setActingId(id);
    try {
      await fn();
      toast.success("Payment updated");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActingId(null);
    }
  };

  return (
    <ApexPanel contentClassName="p-0">
      <div className="border-b border-white/6 px-4 py-4 sm:px-6">
        <h2 className="font-semibold">Payment history</h2>
        <p className="text-sm text-muted-foreground">
          Approve or reject pending submissions from this property
        </p>
      </div>
      {payments.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">No payment submissions yet.</p>
      ) : (
        <ApexTableWrap>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Kind</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="capitalize">{p.paymentKind}</TableCell>
                  <TableCell className="tabular-nums">
                    {p.amountETB.toLocaleString()} ETB
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.transactionRef}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(p.submittedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "pending" ? (
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          className="apex-row-action"
                          disabled={busy || actingId === p.id}
                          onClick={() =>
                            run(p.id, () =>
                              p.paymentKind === "setup"
                                ? approveSetup(tinNumber)
                                : p.paymentKind === "yearly"
                                  ? approveYearly(tinNumber)
                                  : approveQuarterly(tinNumber),
                            )
                          }
                        >
                          Approve
                        </Button>
                        <div className="flex gap-1">
                          <Input
                            className="h-7 w-28 text-xs"
                            placeholder="Reject reason"
                            value={rejectReason[p.id] ?? ""}
                            onChange={(e) =>
                              setRejectReason((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="apex-row-action"
                            disabled={
                              busy || actingId === p.id || !rejectReason[p.id]?.trim()
                            }
                            onClick={() =>
                              run(p.id, () => rejectPayment(p.id, rejectReason[p.id] ?? ""))
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ApexTableWrap>
      )}
    </ApexPanel>
  );
}
