"use client";

import type { TenantDetail } from "@/lib/apex/actions";
import {
  AccountStatusBadge,
  BusinessTypeBadge,
  SubscriptionStatusBadge,
} from "@/Components/apex/StatusBadge";

function isLodging(bt: string | null | undefined) {
  const t = String(bt ?? "").trim();
  return t === "Hotel" || t === "Resort" || t === "Pension";
}

export function ApexTenantSummaryStrip({ tenant }: { tenant: TenantDetail }) {
  const yearly = isLodging(tenant.businessType);
  const renewalAmount = yearly
    ? tenant.quarterlyFeeETB * 4
    : tenant.quarterlyFeeETB;
  const renewalLabel = yearly ? "Yearly fee" : "Quarterly fee";

  const items = [
    {
      label: "Setup fee",
      value: `${tenant.setupFeeETB.toLocaleString()} ETB`,
      sub: tenant.setupFeeApproved ? "Approved" : "Pending",
    },
    {
      label: renewalLabel,
      value: `${renewalAmount.toLocaleString()} ETB`,
      sub: yearly ? "4× quarterly rate" : "Per quarter",
    },
    {
      label: "Paid until",
      value: tenant.subscriptionPaidUntil
        ? new Date(tenant.subscriptionPaidUntil).toLocaleDateString()
        : "—",
      sub: `${tenant.paidQuartersCount} period${tenant.paidQuartersCount === 1 ? "" : "s"} paid`,
    },
    {
      label: "Staff",
      value: String(tenant.users.length),
      sub: "Accounts on property",
    },
  ];

  return (
    <div className="apex-tenant-summary-strip apex-panel-surface overflow-hidden">
      <div className="h-1 bg-linear-to-r from-[oklch(0.72_0.065_85/0.7)] via-[oklch(0.62_0.05_220/0.6)] to-[oklch(0.62_0.06_300/0.5)]" />
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <BusinessTypeBadge businessType={tenant.businessType} />
          <AccountStatusBadge status={tenant.accountStatus} />
          <SubscriptionStatusBadge status={tenant.subscriptionStatus} />
          {tenant.billingHold ? (
            <span className="rounded-full border border-[oklch(0.75_0.12_75/0.35)] bg-[oklch(0.55_0.05_75/0.12)] px-2.5 py-0.5 text-[11px] font-medium text-[oklch(0.88_0.04_75)]">
              Billing hold
            </span>
          ) : null}
          {tenant.isIllustrationTenant ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Illustration
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold tabular-nums tracking-tight text-foreground">
                {item.value}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
