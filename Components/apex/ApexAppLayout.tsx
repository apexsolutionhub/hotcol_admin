"use client";

import { Suspense, type ReactNode } from "react";
import { ApexShell } from "@/Components/apex/ApexShell";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexDashboardProvider } from "@/lib/apex/dashboard-context";

export function ApexAppLayout({ children }: { children: ReactNode }) {
  return (
    <ApexDashboardProvider>
      <Suspense fallback={<ApexPageLoader fullScreen label="Loading…" />}>
        <ApexShell>{children}</ApexShell>
      </Suspense>
    </ApexDashboardProvider>
  );
}
