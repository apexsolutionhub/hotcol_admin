"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { APEX_BUSINESS_TYPES, businessTypeLabel } from "@/constants/businessTypes";
import { APEX_SUBSCRIPTION_MODULES } from "@/constants/subscriptionModules";
import {
  setPricingRuleActive,
  upsertPricingRule,
  type PricingRuleRow,
} from "@/lib/apex/actions";

type Props = {
  rules: PricingRuleRow[];
  onChanged: () => void;
};

type EditorState = {
  id?: number;
  businessType: string;
  modules: Set<string>;
  setupFeeETB: string;
  quarterlyFeeETB: string;
  description: string;
};

const BUSINESS_TYPE_KEYS = APEX_BUSINESS_TYPES.map((b) => b.key);

function emptyEditor(bt: string): EditorState {
  return {
    businessType: bt,
    modules: new Set(),
    setupFeeETB: "0",
    quarterlyFeeETB: "0",
    description: "",
  };
}

export function ApexPricingRulesTable({ rules, onChanged }: Props) {
  const [filterBt, setFilterBt] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<EditorState>(() => emptyEditor(BUSINESS_TYPE_KEYS[0]));

  const filtered = useMemo(() => {
    if (filterBt === "all") return rules;
    return rules.filter((r) => r.businessType === filterBt);
  }, [rules, filterBt]);

  const openCreate = () => {
    setEditor(
      emptyEditor(filterBt === "all" ? BUSINESS_TYPE_KEYS[0] : filterBt),
    );
    setOpen(true);
  };

  const openEdit = (row: PricingRuleRow) => {
    setEditor({
      id: row.id,
      businessType: row.businessType,
      modules: new Set((row.modules as string[]) ?? []),
      setupFeeETB: String(row.setupFeeETB),
      quarterlyFeeETB: String(row.quarterlyFeeETB),
      description: row.description ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await upsertPricingRule({
        id: editor.id,
        businessType: editor.businessType,
        modules: [...editor.modules],
        setupFeeETB: Number(editor.setupFeeETB) || 0,
        quarterlyFeeETB: Number(editor.quarterlyFeeETB) || 0,
        description: editor.description.trim() || null,
        isActive: true,
      });
      toast.success(editor.id ? "Rule updated" : "Rule created");
      setOpen(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row: PricingRuleRow) => {
    setBusy(true);
    try {
      await setPricingRuleActive(row.id, !row.isActive);
      toast.success(row.isActive ? "Rule deactivated" : "Rule activated");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterBt} onValueChange={setFilterBt}>
          <SelectTrigger className="w-[220px] cursor-pointer">
            <SelectValue placeholder="Business type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All business types</SelectItem>
            {BUSINESS_TYPE_KEYS.map((bt) => (
              <SelectItem key={bt} value={bt}>
                {businessTypeLabel(bt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="apex" className="cursor-pointer" onClick={openCreate}>
          Add pricing rule
        </Button>
      </div>

      <div className="apex-panel-surface overflow-hidden rounded-xl border border-white/8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business type</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead className="text-right">Setup</TableHead>
              <TableHead className="text-right">Quarterly</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No rules yet. Run the pricing seed script or add a rule.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} className={!row.isActive ? "opacity-50" : undefined}>
                  <TableCell>{businessTypeLabel(row.businessType)}</TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {(row.modules as string[]).length
                      ? (row.modules as string[]).join(", ")
                      : "Base"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.setupFeeETB.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.quarterlyFeeETB.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {row.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer"
                        disabled={busy}
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer"
                        disabled={busy}
                        onClick={() => toggleActive(row)}
                      >
                        {row.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editor.id ? "Edit pricing rule" : "New pricing rule"}</DialogTitle>
            <DialogDescription>
              Fees apply when modules match this set (order-independent).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business type</Label>
              <Select
                value={editor.businessType}
                onValueChange={(v) => setEditor((e) => ({ ...e, businessType: v }))}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_KEYS.map((bt) => (
                    <SelectItem key={bt} value={bt}>
                      {businessTypeLabel(bt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Modules in this tier</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {APEX_SUBSCRIPTION_MODULES.map((mod) => (
                  <div key={mod} className="flex items-center gap-2">
                    <Checkbox
                      id={`price-mod-${mod}`}
                      checked={editor.modules.has(mod)}
                      onCheckedChange={(v) =>
                        setEditor((e) => {
                          const next = new Set(e.modules);
                          if (v) next.add(mod);
                          else next.delete(mod);
                          return { ...e, modules: next };
                        })
                      }
                    />
                    <Label htmlFor={`price-mod-${mod}`} className="cursor-pointer font-normal">
                      {mod}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Setup fee (ETB)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editor.setupFeeETB}
                  onChange={(e) =>
                    setEditor((ed) => ({ ...ed, setupFeeETB: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Quarterly fee (ETB)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editor.quarterlyFeeETB}
                  onChange={(e) =>
                    setEditor((ed) => ({ ...ed, quarterlyFeeETB: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={editor.description}
                onChange={(e) => setEditor((ed) => ({ ...ed, description: e.target.value }))}
                placeholder="Shown in Apex catalog table"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="apex" className="cursor-pointer" disabled={busy} onClick={save}>
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
