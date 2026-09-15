"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, GitMerge, Trash2 } from "lucide-react";
import { ApexCrystalNameSelector } from "@/Components/apex/crystal/ApexCrystalNameSelector";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
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

function hasFullTriple(p: CrystalNameProposalRow) {
  return Boolean(
    p.amharic?.trim() && p.romanized?.trim() && p.english?.trim(),
  );
}

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
  const [approveTarget, setApproveTarget] =
    useState<CrystalNameProposalRow | null>(null);
  const [approveDraft, setApproveDraft] = useState({
    amharic: "",
    romanized: "",
    english: "",
  });
  const [approving, setApproving] = useState(false);

  const pending = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals],
  );

  const openApprove = (p: CrystalNameProposalRow) => {
    setApproveTarget(p);
    setApproveDraft({
      amharic: p.amharic?.trim() || "",
      romanized: p.romanized?.trim() || "",
      english: p.english?.trim() || "",
    });
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    const amharic = approveDraft.amharic.trim();
    const romanized = approveDraft.romanized.trim();
    const english = approveDraft.english.trim();
    if (!amharic || !romanized || !english) {
      toast.error("Amharic, romanized, and English are required to approve");
      return;
    }
    setApproving(true);
    setBusyId(approveTarget.id);
    try {
      await approveCrystalNameProposal(approveTarget.id, {
        amharic,
        romanized,
        english,
      });
      toast.success("Approved as new crystal name");
      setApproveTarget(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setApproving(false);
      setBusyId(null);
    }
  };

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
          Naming only — does not block property workflows. Staff may send typed
          text only; complete Amharic|Romanized|English when approving as new,
          or merge via the selector.
        </p>
      </div>

      <ul className="space-y-3">
        {pending.map((p) => {
          const targetId = mergeTargetById[p.id] ?? null;
          const busy = busyId === p.id;
          const complete = hasFullTriple(p);
          return (
            <li
              key={p.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">
                    {complete ? (
                      <>
                        {p.amharic} / {p.romanized}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          {p.english}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-200">Needs languages</span>
                        <span className="ml-2 text-sm font-normal text-foreground">
                          {p.rawText}
                        </span>
                      </>
                    )}
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
                        by{" "}
                        <span className="text-foreground">{p.proposedBy}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => openApprove(p)}
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

      <Dialog
        open={approveTarget != null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve as new crystal</DialogTitle>
            <DialogDescription>
              Typed by property:{" "}
              <span className="font-medium text-foreground">
                {approveTarget?.rawText}
              </span>
              . Set the three language segments for the catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="approve-am">Amharic</Label>
              <Input
                id="approve-am"
                value={approveDraft.amharic}
                onChange={(e) =>
                  setApproveDraft((d) => ({ ...d, amharic: e.target.value }))
                }
                placeholder="ዳቦ"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approve-rom">Romanized</Label>
              <Input
                id="approve-rom"
                value={approveDraft.romanized}
                onChange={(e) =>
                  setApproveDraft((d) => ({ ...d, romanized: e.target.value }))
                }
                placeholder="Dabo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approve-en">English</Label>
              <Input
                id="approve-en"
                value={approveDraft.english}
                onChange={(e) =>
                  setApproveDraft((d) => ({ ...d, english: e.target.value }))
                }
                placeholder="Bread"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={approving}
              onClick={() => setApproveTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={approving}
              onClick={() => void confirmApprove()}
            >
              {approving ? "Saving…" : "Approve into catalog"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
