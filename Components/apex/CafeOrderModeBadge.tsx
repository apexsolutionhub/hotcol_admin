"use client";

import { MonitorSmartphone, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CAFE_ORDER_MODE_SHORT_LABELS,
  parseCafeOrderMode,
  type CafeOrderMode,
} from "@/lib/cafeOrderMode";

export function CafeOrderModeBadge({
  mode,
  className,
}: {
  mode: string | null | undefined;
  className?: string;
}) {
  if (mode == null || String(mode).trim() === "") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const parsed: CafeOrderMode = parseCafeOrderMode(mode);
  const Icon = parsed === "analog" ? Printer : MonitorSmartphone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-foreground",
        className,
      )}
    >
      <Icon className="h-3 w-3 text-muted-foreground" />
      {CAFE_ORDER_MODE_SHORT_LABELS[parsed]}
    </span>
  );
}
