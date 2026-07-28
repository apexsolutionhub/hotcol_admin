"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { ChevronRight, PencilLine, Plus, Sparkles, Trash2 } from "lucide-react";
import { ApexDataTable } from "@/Components/apex/layout/ApexDataTable";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { APEX_BUSINESS_TYPES, businessTypeLabel } from "@/constants/businessTypes";
import { APEX_SUBSCRIPTION_MODULES } from "@/constants/subscriptionModules";
import {
  deletePricingRule,
  upsertPricingRule,
  type PricingRuleRow,
} from "@/lib/apex/actions";
import { cn } from "@/lib/utils";

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

function moduleCountLabel(count: number) {
  return `${count} ${count === 1 ? "module" : "modules"}`;
}

function PricingRuleStatusPill({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.14)]" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/70" />
      Inactive
    </span>
  );
}

function PricingRulePreview({
  row,
  onOpenDetail,
}: {
  row: PricingRuleRow;
  onOpenDetail: () => void;
}) {
  const modules = (row.modules as string[]) ?? [];
  const business = businessTypeLabel(row.businessType);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{business}</p>
        <p className="text-[11px] text-muted-foreground">
          {moduleCountLabel(modules.length)} · {row.isActive ? "Active" : "Inactive"}
        </p>
      </div>

      {row.description ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {row.description}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Setup</dt>
          <dd className="mt-0.5 font-semibold text-foreground">
            {row.setupFeeETB.toLocaleString()} ETB
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Quarterly</dt>
          <dd className="mt-0.5 font-semibold text-foreground">
            {row.quarterlyFeeETB.toLocaleString()} ETB
          </dd>
        </div>
      </dl>

      <div className="space-y-1.5 border-t border-border/50 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Included modules
        </p>
        <div className="flex flex-wrap gap-1.5">
          {modules.length > 0 ? (
            modules.map((moduleName) => (
              <Badge
                key={moduleName}
                variant="secondary"
                className="rounded-md px-2 py-0.5 text-[10px]"
              >
                {moduleName}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px]">
              Base package
            </Badge>
          )}
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={onOpenDetail}>
        Open detail
      </Button>
    </div>
  );
}

function PricingRuleSheetBody({
  row,
  onEdit,
}: {
  row: PricingRuleRow;
  onEdit: () => void;
}) {
  const modules = (row.modules as string[]) ?? [];

  return (
    <div className="space-y-5 pb-2">
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-muted-foreground">Business type</dt>
            <dd className="font-medium">{businessTypeLabel(row.businessType)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Status</dt>
            <dd className="space-y-1.5">
              <PricingRuleStatusPill isActive={row.isActive} />
              <p className="text-xs text-muted-foreground">
                {row.isActive
                  ? "Currently available for matching tenant pricing."
                  : "Hidden from active pricing selection."}
              </p>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Setup fee</dt>
            <dd className="font-medium tabular-nums">
              {row.setupFeeETB.toLocaleString()} ETB
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Quarterly fee</dt>
            <dd className="font-medium tabular-nums">
              {row.quarterlyFeeETB.toLocaleString()} ETB
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] text-muted-foreground">Rule key</dt>
            <dd className="font-mono text-xs font-medium break-all">
              {row.modulesKey || "base"}
            </dd>
          </div>
          {row.description ? (
            <div className="sm:col-span-2">
              <dt className="text-[11px] text-muted-foreground">Description</dt>
              <dd className="leading-relaxed">{row.description}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Included modules</p>
          <span className="text-xs tabular-nums text-muted-foreground">
            {moduleCountLabel(modules.length)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modules.length > 0 ? (
            modules.map((moduleName) => (
              <Badge
                key={moduleName}
                variant="secondary"
                className="rounded-md px-2 py-0.5 text-[11px]"
              >
                {moduleName}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">Base package</Badge>
          )}
        </div>
      </div>

      <Button variant="apex" className="w-full" onClick={onEdit}>
        Edit pricing rule
      </Button>
    </div>
  );
}

function PricingRuleDetailTrigger({
  row,
  children,
  className,
  onEdit,
}: {
  row: PricingRuleRow;
  children: ReactNode;
  className?: string;
  onEdit: () => void;
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
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
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
              "group/detail w-full rounded-md text-left outline-none transition-colors",
              "hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/40",
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
            aria-label={`Details for ${businessTypeLabel(row.businessType)}`}
          >
            <span className="inline-flex w-full items-start gap-1">
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
          className="flex w-80 flex-col overflow-hidden border-border/70 p-0 shadow-lg"
          onMouseEnter={schedulePreviewOpen}
          onMouseLeave={schedulePreviewClose}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-3">
            <PricingRulePreview
              row={row}
              onOpenDetail={openSheet}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[min(100%,32rem)] max-w-[min(100%,32rem)] sm:w-lg sm:max-w-lg">
          <SheetHeader className="space-y-1 border-b border-border/60 pb-4">
            <SheetTitle>{businessTypeLabel(row.businessType)}</SheetTitle>
            <SheetDescription>
              Review this pricing tier, then open the editor if you need to change
              its modules or fee values.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <PricingRuleSheetBody
              row={row}
              onEdit={() => {
                setSheetOpen(false);
                onEdit();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ApexPricingRulesTable({ rules, onChanged }: Props) {
  const [filterBt, setFilterBt] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<EditorState>(() => emptyEditor(BUSINESS_TYPE_KEYS[0]));
  const displayableRules = useMemo(
    () => rules.filter((row) => ((row.modules as string[]) ?? []).length > 0),
    [rules],
  );

  const filtered = useMemo(() => {
    if (filterBt === "all") return displayableRules;
    return displayableRules.filter((r) => r.businessType === filterBt);
  }, [displayableRules, filterBt]);

  const tabItems = useMemo(
    () => [
      {
        value: "all",
        label: "All business types",
        count: displayableRules.length,
      },
      ...BUSINESS_TYPE_KEYS.map((bt) => ({
        value: bt,
        label: businessTypeLabel(bt),
        count: displayableRules.filter((r) => r.businessType === bt).length,
      })),
    ],
    [displayableRules],
  );

  const activeCount = filtered.filter((row) => row.isActive).length;
  const inactiveCount = filtered.length - activeCount;

  const columns = useMemo<ColumnDef<PricingRuleRow>[]>(
    () => [
      {
        accessorKey: "businessType",
        header: "Business type",
        cell: ({ row }) => (
          <PricingRuleDetailTrigger
            row={row.original}
            className="px-1 py-0.5 -mx-1"
            onEdit={() => openEdit(row.original)}
          >
            <div
              className={cn(
                "min-w-0",
                ((row.original.modules as string[]) ?? []).length > 0 && "space-y-1",
              )}
            >
              <p className="font-medium text-foreground transition-colors group-hover/detail:text-[oklch(0.82_0.04_85)] group-hover/price:text-[oklch(0.82_0.04_85)]">
                {businessTypeLabel(row.original.businessType)}
              </p>
              {((row.original.modules as string[]) ?? []).length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {moduleCountLabel(((row.original.modules as string[]) ?? []).length)}
                </p>
              ) : null}
            </div>
          </PricingRuleDetailTrigger>
        ),
      },
      {
        accessorKey: "setupFeeETB",
        header: () => <div className="text-right">Setup</div>,
        meta: { label: "Setup" },
        cell: ({ row }) => (
          <div className="text-right">
            <p className="tabular-nums text-sm font-semibold">
              {row.original.setupFeeETB.toLocaleString()} ETB
            </p>
            <p className="text-[11px] text-muted-foreground">One-time onboarding fee</p>
          </div>
        ),
      },
      {
        accessorKey: "quarterlyFeeETB",
        header: () => <div className="text-right">Quarterly</div>,
        meta: { label: "Quarterly" },
        cell: ({ row }) => (
          <div className="text-right">
            <p className="tabular-nums text-sm font-semibold">
              {row.original.quarterlyFeeETB.toLocaleString()} ETB
            </p>
            <p className="text-[11px] text-muted-foreground">Recurring every 3 months</p>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          <PricingRuleStatusPill isActive={row.original.isActive} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer rounded-lg px-3 text-muted-foreground transition-colors group-hover/price:text-foreground"
              disabled={busy}
              onClick={() => openEdit(row.original)}
            >
              <PencilLine className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer rounded-lg border-destructive/25 px-3 text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => removeRule(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [busy],
  );

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

  const removeRule = async (row: PricingRuleRow) => {
    const label = businessTypeLabel(row.businessType);
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(`Delete pricing rule for ${label}? This action cannot be undone.`);
    if (!confirmed) return;
    setBusy(true);
    try {
      await deletePricingRule(row.id);
      toast.success("Pricing rule deleted");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <Tabs value={filterBt} onValueChange={setFilterBt} className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2.5 rounded-none border-0 bg-transparent p-0 shadow-none">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="apex-tabs-trigger h-11 flex-none gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2 text-left leading-none shadow-sm transition-all duration-150 hover:border-white/12 hover:bg-white/4.5 data-[state=active]:border-[oklch(0.68_0.05_85/0.28)] data-[state=active]:bg-[oklch(0.24_0.014_265)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_8px_20px_-12px_oklch(0.88_0.06_85/0.45)]"
              >
                <span className="text-sm font-medium tracking-tight">{tab.label}</span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground dark:bg-white/10">
                  {tab.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-linear-to-r from-background/95 via-background/82 to-background/95 px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[oklch(0.68_0.05_85/0.16)] bg-[oklch(0.68_0.05_85/0.08)] p-2.5">
                <Sparkles className="h-4.5 w-4.5 text-[oklch(0.82_0.05_85)]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Pricing snapshot
                  </p>
                  <Badge variant="secondary">
                    {filterBt === "all" ? "All pricing tiers" : businessTypeLabel(filterBt)}
                  </Badge>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {filterBt === "all"
                    ? "Review every saved pricing tier across business types, including active and inactive catalog rules."
                    : `Review pricing tiers for ${businessTypeLabel(filterBt)} and manage the rule set that controls setup and quarterly fees.`}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="apex"
              className="cursor-pointer self-start rounded-xl px-4"
              onClick={openCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add pricing rule
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/7 bg-background/55 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Visible rules
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {filtered.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Out of {displayableRules.length} visible catalog rules
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/14 bg-emerald-500/6 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-200/80">
                Active
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {activeCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Currently available for use
              </p>
            </div>

            <div className="rounded-xl border border-white/7 bg-background/55 px-3.5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Inactive
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                {inactiveCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Preserved for reference or reuse
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="apex-panel-surface overflow-hidden rounded-2xl border border-white/8">
        <ApexDataTable
          data={filtered}
          columns={columns}
          noun="rules"
          pageSize={10}
          showToolbar
          searchPlaceholder="Search rules, modules, fees…"
          rowClassName={(row) =>
            [
              "group/price transition-all duration-150 active:scale-[0.998]",
              !row.isActive ? "opacity-55" : undefined,
            ]
              .filter(Boolean)
              .join(" ")
          }
          emptyState={
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No rules yet. Run the pricing seed script or add a rule.
            </div>
          }
        />
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
