"use client";

import { Suspense } from "react";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPaymentsQueue } from "@/Components/apex/payments/ApexPaymentsQueue";

export default function QuarterlyPaymentsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading quarterly payments…" />}>
      <ApexPaymentsQueue kind="quarterly" />
    </Suspense>
  );
}
