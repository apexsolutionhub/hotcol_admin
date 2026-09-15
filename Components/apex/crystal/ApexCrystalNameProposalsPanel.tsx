"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, GitMerge, Trash2 } from "lucide-react";
import { ApexCrystalNameSelector } from "@/Components/apex/crystal/ApexCrystalNameSelector";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
  approveCrystalNameProposal,
  mergeCrystalNameProposal,
  rejectCrystalNameProposal,
  type CrystalNameProposalRow,
  type CrystalNameRow,
} from "@/lib/apex/actions";

type Props = {
  proposals: CrystalNameProposalRow[];
  catalog: CrystalNameRow[];
  onChanged: () => void;
};

export function ApexCrystalNameProposalsPanel({
  proposals,
  catalog,
  onChanged,
}: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [mergeTargetById, setMergeTargetById] = useState<
    Record<number, number | null>
  >({});
  const [rejectNoteById, setRejectNoteById] = useState<Record<number, string>>(
    {},
  );

  const pending = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
  );

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-muted-foreground">
        No pending crystal proposals from properties. When staff use{" "}
        <span className="font-medium text-foreground">Add as new</span> on
        registration, purchase, or recipe, they appear here for merge or
        approval.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Pending proposals ({pending.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Naming only — does not block property registration, purchase
          authorize/approve, or cafe status. Use the crystal selector to merge
          into an existing name, or approve as a new catalog entry.
        </p>
      </div>

      <ul className="space-y-3">
        {pending.map((p) => {
          const targetId = mergeTargetById[p.id] ?? null;
          const busy = busyId === p.id;
          return (
            <li
              key={p.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">
                    {p.amharic} / {p.romanized}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {p.english}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Typed: <code className="text-foreground">{p.rawText}</code>
                    {" · "}
                    source <span className="text-foreground">{p.source}</span>
                    {p.HotelName || p.tinNumber ? (
                      <>
                        {" · "}
                        property{" "}
                        <span className="text-foreground">
                          {p.HotelName || p.tinNumber}
                        </span>
                      </>
                    ) : null}
                    {p.proposedBy ? (
                      <>
                        {" · "}
                        by <span className="text-foreground">{p.proposedBy}</span>
                      </>
                    ) : null}
                  </p>
                  <code className="block text-[11px] text-muted-foreground">
                    {p.crystalLabel}
                  </code>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void (async () => {
                        setBusyId(p.id);
                        try {
                          await approveCrystalNameProposal(p.id);
                          toast.success("Approved as new crystal name");
                          onChanged();
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Approve failed",
                          );
                        } finally {
                          setBusyId(null);
                        }
                      })()
                    }
                  >
                    <CheckCheck className="mr-1.5 h-4 w-4" />
                    Approve as new
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Merge into existing (selector)
                  </p>
                  <ApexCrystalNameSelector
                    catalog={catalog}
                    valueId={targetId}
                    disabled={busy}
                    onChange={(row) =>
                      setMergeTargetById((prev) => ({
                        ...prev,
                        [p.id]: row?.id ?? null,
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || targetId == null}
                  onClick={() =>
                    void (async () => {
                      if (targetId == null) {
                        toast.error("Select a crystal name to merge into");
                        return;
                      }
                      setBusyId(p.id);
                      try {
                        await mergeCrystalNameProposal(p.id, targetId);
                        toast.success("Merged into selected crystal");
                        onChanged();
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Merge failed",
                        );
                      } finally {
                        setBusyId(null);
                      }
                    })()
                  }
                >
                  <GitMerge className="mr-1.5 h-4 w-4" />
                  Merge
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="Reject reason (optional)"
                  value={rejectNoteById[p.id] ?? ""}
                  disabled={busy}
                  className="h-9"
                  onChange={(e) =>
                    setRejectNoteById((prev) => ({
                      ...prev,
                      [p.id]: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  className="text-destructive"
                  onClick={() =>
                    void (async () => {
                      setBusyId(p.id);
                      try {
                        await rejectCrystalNameProposal(
                          p.id,
                          rejectNoteById[p.id],
                        );
                        toast.success("Proposal rejected");
                        onChanged();
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Reject failed",
                        );
                      } finally {
                        setBusyId(null);
                      }
                    })()
                  }
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
