"use client";

import { Suspense } from "react";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPaymentsQueue } from "@/Components/apex/payments/ApexPaymentsQueue";

export default function SetupPaymentsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading setup payments…" />}>
      <ApexPaymentsQueue kind="setup" />
    </Suspense>
  );
}
