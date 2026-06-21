"use client";

import { cn } from "@/lib/utils";

export type TenantSection = {
  id: string;
  label: string;
};

const DEFAULT_SECTIONS: TenantSection[] = [
  { id: "billing-actions", label: "Payments" },
  { id: "access", label: "Access" },
  { id: "billing-settings", label: "Billing" },
  { id: "modules", label: "Modules" },
  { id: "operations", label: "Operations" },
  { id: "staff", label: "Staff" },
  { id: "payments-history", label: "History" },
];

export function ApexTenantSectionNav({
  sections = DEFAULT_SECTIONS,
  className,
}: {
  sections?: TenantSection[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Tenant sections"
      className={cn(
        "apex-tenant-nav sticky top-[3.75rem] z-[5] -mx-1 flex gap-1 overflow-x-auto px-1 pb-1",
        className,
      )}
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="apex-tenant-nav-link shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
