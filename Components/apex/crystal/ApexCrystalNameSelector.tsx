"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/Components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import type { CrystalNameRow } from "@/lib/apex/actions";

type Props = {
  valueId: number | null;
  onChange: (row: CrystalNameRow | null) => void;
  catalog: CrystalNameRow[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function norm(s: string) {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function rank(catalog: CrystalNameRow[], q: string, limit: number) {
  const query = norm(q);
  if (!query) return catalog.slice(0, limit);
  const scored = catalog
    .map((row) => {
      const blob = norm(
        `${row.amharic} ${row.romanized} ${row.english} ${row.crystalLabel}`,
      );
      let score = 0;
      if (blob.includes(query)) score += 50;
      if (norm(row.romanized).startsWith(query)) score += 30;
      if (norm(row.english).startsWith(query)) score += 20;
      // subsequence
      let qi = 0;
      for (const ch of blob) {
        if (ch === query[qi]) qi += 1;
        if (qi >= query.length) {
          score += 10;
          break;
        }
      }
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.row.english.localeCompare(b.row.english));
  return scored.slice(0, limit).map((x) => x.row);
}

/**
 * Apex-side crystal catalog selector (no Add-as-new).
 * Used to pick a merge target for pending proposals.
 */
export function ApexCrystalNameSelector({
  valueId,
  onChange,
  catalog,
  placeholder = "Select crystal to merge into…",
  disabled = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = useMemo(
    () => catalog.find((r) => r.id === valueId) ?? null,
    [catalog, valueId],
  );
  const visible = useMemo(
    () => rank(catalog, search, 60),
    [catalog, search],
  );

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "h-10 w-full min-w-0 justify-between px-3 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {selected ? (
              <>
                <span className="truncate text-left">
                  {selected.amharic} / {selected.romanized}
                </span>
                <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">
                  {selected.english}
                </span>
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search catalog…"
            value={search}
            onValueChange={setSearch}
          />
          <div className="max-h-56 overflow-y-auto">
            {catalog.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading catalog…
              </div>
            ) : (
              <>
                <CommandEmpty>No crystal found.</CommandEmpty>
                <CommandGroup>
                  {visible.map((row) => (
                    <CommandItem
                      key={row.id}
                      value={row.crystalLabel}
                      onSelect={() => {
                        onChange(row);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          valueId === row.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {row.amharic} / {row.romanized}
                      </span>
                      <span className="max-w-[40%] shrink-0 truncate text-right text-xs text-muted-foreground">
                        {row.english}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
