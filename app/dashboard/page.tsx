"use client";

import Link from "next/link";
import { Building2, MessageCircle, CreditCard } from "lucide-react";
import { useApexDashboard } from "@/lib/apex/dashboard-context";
import { getApexMember } from "@/lib/apex/auth";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPageHeader } from "@/Components/apex/layout/ApexPageHeader";
import { ApexSectionHeader } from "@/Components/apex/layout/ApexFilterTabs";
import { ApexErrorAlert } from "@/Components/apex/layout/ApexErrorAlert";
import { ApexEmptyState } from "@/Components/apex/layout/ApexEmptyState";
import { ApexStatGrid, ApexTotalTenantsBanner } from "@/Components/apex/overview/ApexStatGrid";
import { ApexDashboardQuickActions } from "@/Components/apex/overview/ApexDashboardQuickActions";
import { ApexBusinessTypeBreakdown } from "@/Components/apex/overview/ApexBusinessTypeBreakdown";
import { ApexMonitoringStats } from "@/Components/apex/overview/ApexMonitoringStats";
import { Button } from "@/Components/ui/button";
import { LayoutDashboard } from "lucide-react";

export default function DashboardHomePage() {
  const { summary, loading, error } = useApexDashboard();
  const member = getApexMember();
  const firstName = (member?.displayName || member?.UserName || "there").split(/\s+/)[0];

  if (loading && !summary) {
    return <ApexPageLoader label="Loading overview…" />;
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <ApexPageHeader title="Overview" description="Platform snapshot and action queues" />
        <ApexErrorAlert message={error} />
      </div>
    );
  }

  if (!summary) {
    return (
      <ApexEmptyState
        icon={LayoutDashboard}
        title="No overview data"
        description="Refresh the page or check your connection to the Apex API."
      />
    );
  }

  const pendingTotal =
    summary.pendingSetupPayments +
    summary.pendingQuarterlyPayments +
    summary.pendingYearlyPayments +
    summary.unreadFeedback;

  return (
    <div className="space-y-10">
      <ApexPageHeader
        title={`Welcome back, ${firstName}`}
        description={
          pendingTotal > 0
            ? `${pendingTotal} item${pendingTotal === 1 ? "" : "s"} across your queues need attention today.`
            : `${summary.totalTenants} properties on HotCol — all queues are clear.`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="cursor-pointer">
              <Link href="/tenants">
                <Building2 className="mr-2 h-4 w-4" />
                All tenants
              </Link>
            </Button>
            <Button asChild size="sm" variant="apex">
              <Link href="/feedback">
                <MessageCircle className="mr-2 h-4 w-4" />
                Property chat
              </Link>
            </Button>
          </div>
        }
      />

      <ApexDashboardQuickActions summary={summary} />

      <ApexTotalTenantsBanner total={summary.totalTenants} />

      <section className="space-y-5">
        <ApexSectionHeader
          title="Action queues"
          description="Click a card to open the matching workflow."
          action={
            (summary.pendingSetupPayments > 0 ||
              summary.pendingQuarterlyPayments > 0 ||
              summary.pendingYearlyPayments > 0) ? (
              <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
                <Link href="/payments/setup">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </Link>
              </Button>
            ) : undefined
          }
        />
        <ApexStatGrid summary={summary} />
      </section>

      <section className="space-y-5">
        <ApexSectionHeader
          title="Platform monitoring"
          description="Users, module requests, and property mix across the portfolio."
        />
        <ApexMonitoringStats summary={summary} />
      </section>

      <section>
        <ApexBusinessTypeBreakdown summary={summary} />
      </section>
    </div>
  );
}
