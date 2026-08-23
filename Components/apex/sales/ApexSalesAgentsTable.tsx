"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import {
  deleteSalesAgent,
  setSalesAgentActive,
  upsertSalesAgent,
  type SalesAgentRow,
} from "@/lib/apex/actions";

type Props = {
  agents: SalesAgentRow[];
  onChanged: () => void;
};

type EditorState = {
  id?: number;
  displayName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  isActive: boolean;
};

function emptyEditor(): EditorState {
  return {
    displayName: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
    isActive: true,
  };
}

export function ApexSalesAgentsTable({ agents, onChanged }: Props) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const columns = useMemo<ColumnDef<SalesAgentRow>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.displayName}</p>
            {row.original.phone ? (
              <p className="text-xs text-muted-foreground">{row.original.phone}</p>
            ) : null}
            {row.original.email ? (
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.city?.trim() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Inactive
            </span>
          ),
      },
      {
        accessorKey: "tenantCount",
        header: "Properties",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">{row.original.tenantCount}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busyId === row.original.id}
              onClick={() =>
                void (async () => {
                  setBusyId(row.original.id);
                  try {
                    await setSalesAgentActive(
                      row.original.id,
                      !row.original.isActive,
                    );
                    onChanged();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Update failed");
                  } finally {
                    setBusyId(null);
                  }
                })()
              }
            >
              {row.original.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                setEditor({
                  id: row.original.id,
                  displayName: row.original.displayName,
                  phone: row.original.phone ?? "",
                  email: row.original.email ?? "",
                  city: row.original.city ?? "",
                  notes: row.original.notes ?? "",
                  isActive: row.original.isActive,
                })
              }
            >
              <PencilLine className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={busyId === row.original.id}
              onClick={() =>
                void (async () => {
                  if (
                    !window.confirm(
                      `Delete ${row.original.displayName}? Existing tenants keep no sales agent.`,
                    )
                  ) {
                    return;
                  }
                  setBusyId(row.original.id);
                  try {
                    await deleteSalesAgent(row.original.id);
                    toast.success("Sales agent deleted");
                    onChanged();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Delete failed");
                  } finally {
                    setBusyId(null);
                  }
                })()
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [busyId, onChanged],
  );

  const save = async () => {
    if (!editor) return;
    const name = editor.displayName.trim();
    if (!name) {
      toast.error("Enter a name");
      return;
    }
    setSaving(true);
    try {
      await upsertSalesAgent({
        id: editor.id,
        displayName: name,
        phone: editor.phone.trim() || null,
        email: editor.email.trim() || null,
        city: editor.city.trim() || null,
        notes: editor.notes.trim() || null,
        isActive: editor.isActive,
      });
      toast.success(editor.id ? "Sales agent updated" : "Sales agent added");
      setEditor(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setEditor(emptyEditor())}>
          <Plus className="mr-2 h-4 w-4" />
          Add sales agent
        </Button>
      </div>
      <ApexDataTable
        columns={columns}
        data={agents}
        noun="sales agents"
        emptyState={
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Add the field team so signup and create-tenant can attribute deals.
          </p>
        }
      />
      <Dialog open={editor != null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.id ? "Edit sales agent" : "New sales agent"}
            </DialogTitle>
            <DialogDescription>
              Name is required. Everything else is optional. Inactive agents stay
              on old tenants but are hidden on new signups.
            </DialogDescription>
          </DialogHeader>
          {editor ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sa-name">Name</Label>
                <Input
                  id="sa-name"
                  value={editor.displayName}
                  onChange={(e) =>
                    setEditor({ ...editor, displayName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sa-phone">Phone</Label>
                  <Input
                    id="sa-phone"
                    value={editor.phone}
                    onChange={(e) =>
                      setEditor({ ...editor, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sa-email">Email</Label>
                  <Input
                    id="sa-email"
                    type="email"
                    value={editor.email}
                    onChange={(e) =>
                      setEditor({ ...editor, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-city">City / coverage</Label>
                <Input
                  id="sa-city"
                  placeholder="Addis Ababa, Hawassa, …"
                  value={editor.city}
                  onChange={(e) =>
                    setEditor({ ...editor, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-notes">Notes</Label>
                <Textarea
                  id="sa-notes"
                  rows={3}
                  placeholder="Internal notes — territory, commission, etc."
                  value={editor.notes}
                  onChange={(e) =>
                    setEditor({ ...editor, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <Label htmlFor="sa-active">Active</Label>
                <Switch
                  id="sa-active"
                  checked={editor.isActive}
                  onCheckedChange={(v) => setEditor({ ...editor, isActive: v })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
