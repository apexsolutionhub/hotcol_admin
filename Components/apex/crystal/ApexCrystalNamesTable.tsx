"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import {
  deleteCrystalName,
  upsertCrystalName,
  type CrystalNameRow,
} from "@/lib/apex/actions";

type Props = {
  rows: CrystalNameRow[];
  onChanged: () => void;
};

type EditorState = {
  id?: number;
  amharic: string;
  romanized: string;
  english: string;
};

function emptyEditor(): EditorState {
  return { amharic: "", romanized: "", english: "" };
}

export function ApexCrystalNamesTable({ rows, onChanged }: Props) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CrystalNameRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = useMemo<ColumnDef<CrystalNameRow>[]>(
    () => [
      {
        accessorKey: "amharic",
        header: "Amharic",
        cell: ({ row }) => (
          <span className="font-medium tracking-wide">{row.original.amharic}</span>
        ),
      },
      {
        accessorKey: "romanized",
        header: "Romanized",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.romanized}</span>
        ),
      },
      {
        accessorKey: "english",
        header: "English",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.english}
          </span>
        ),
      },
      {
        accessorKey: "crystalLabel",
        header: "Crystal label",
        cell: ({ row }) => (
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {row.original.crystalLabel}
          </code>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Edit ${row.original.crystalLabel}`}
              onClick={() =>
                setEditor({
                  id: row.original.id,
                  amharic: row.original.amharic,
                  romanized: row.original.romanized,
                  english: row.original.english,
                })
              }
            >
              <PencilLine className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Delete ${row.original.crystalLabel}`}
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const save = async () => {
    if (!editor) return;
    const amharic = editor.amharic.trim();
    const romanized = editor.romanized.trim();
    const english = editor.english.trim();
    if (!amharic || !romanized || !english) {
      toast.error("Amharic, romanized, and English are all required");
      return;
    }
    setSaving(true);
    try {
      await upsertCrystalName({
        id: editor.id,
        amharic,
        romanized,
        english,
      });
      toast.success(editor.id ? "Crystal name updated" : "Crystal name added");
      setEditor(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCrystalName(deleteTarget.id);
      toast.success("Crystal name deleted");
      setDeleteTarget(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setEditor(emptyEditor())}>
          <Plus className="mr-2 h-4 w-4" />
          Add crystal name
        </Button>
      </div>

      <ApexDataTable
        columns={columns}
        data={rows}
        noun="crystal names"
        emptyState={
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No crystal names yet. Add Amharic|Romanized|English triples for
            inventory, purchase, and recipe selectors.
          </p>
        }
      />

      <Dialog
        open={editor != null}
        onOpenChange={(open) => !open && setEditor(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? "Edit crystal name" : "New crystal name"}
            </DialogTitle>
            <DialogDescription>
              Stored as{" "}
              <span className="font-medium text-foreground">
                Amharic|Romanized|English
              </span>
              . Romanized is Amharic written with English letters (e.g. Dabo),
              not a Latin translation.
            </DialogDescription>
          </DialogHeader>
          {editor ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crystal-amharic">Amharic</Label>
                <Input
                  id="crystal-amharic"
                  placeholder="ዳቦ"
                  value={editor.amharic}
                  onChange={(e) =>
                    setEditor({ ...editor, amharic: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crystal-romanized">Romanized</Label>
                <Input
                  id="crystal-romanized"
                  placeholder="Dabo"
                  value={editor.romanized}
                  onChange={(e) =>
                    setEditor({ ...editor, romanized: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crystal-english">English</Label>
                <Input
                  id="crystal-english"
                  placeholder="Bread"
                  value={editor.english}
                  onChange={(e) =>
                    setEditor({ ...editor, english: e.target.value })
                  }
                />
              </div>
              {(editor.amharic.trim() ||
                editor.romanized.trim() ||
                editor.english.trim()) && (
                <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                  Preview:{" "}
                  <code className="text-foreground">
                    {`${editor.amharic.trim() || "…"}|${editor.romanized.trim() || "…"}|${editor.english.trim() || "…"}`}
                  </code>
                </p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditor(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : editor?.id ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="apex-glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete crystal name?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.crystalLabel}
              </span>{" "}
              from the global catalog. Existing inventory rows that already use
              this label keep their stored text.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
