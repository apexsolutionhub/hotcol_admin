import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import type { TenantDetail } from "@/lib/apex/actions";
import {
  ClipboardList,
  Package,
  ShoppingCart,
  Users,
  UtensilsCrossed,
} from "lucide-react";

const METRICS = [
  { key: "staffCount" as const, label: "Staff accounts", icon: Users },
  { key: "ordersToday" as const, label: "Orders today", icon: UtensilsCrossed },
  { key: "openOrders" as const, label: "Open orders", icon: ShoppingCart },
  {
    key: "pendingPurchaseRequests" as const,
    label: "Pending PRs",
    icon: ClipboardList,
  },
  {
    key: "pendingStockOutRequests" as const,
    label: "Pending stock-outs",
    icon: Package,
  },
  {
    key: "pendingItemRegistrations" as const,
    label: "Item registrations",
    icon: Package,
  },
];

export function ApexOperationalSnapshot({
  snapshot,
}: {
  snapshot: TenantDetail["operationalSnapshot"];
}) {
  return (
    <Card className="apex-panel-surface border-[oklch(0.5_0.03_220/0.2)]">
      <CardHeader>
        <CardTitle className="text-base text-[oklch(0.8_0.025_220)]">Live operations</CardTitle>
        <CardDescription>
          Staff, orders, and pending workflows for this property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map(({ key, label, icon: Icon }) => {
            const value = snapshot[key];
            const highlight = value > 0 && key !== "staffCount" && key !== "ordersToday";
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.28_0.02_220)] text-[oklch(0.78_0.025_220)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p
                    className={
                      highlight
                        ? "text-lg font-semibold tabular-nums text-[oklch(0.82_0.04_85)]"
                        : "text-lg font-semibold tabular-nums"
                    }
                  >
                    {value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
