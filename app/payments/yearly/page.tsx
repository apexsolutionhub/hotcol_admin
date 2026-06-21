import { Suspense } from "react";
import { ApexPageLoader } from "@/Components/apex/ApexPageLoader";
import { ApexPaymentsQueue } from "@/Components/apex/payments/ApexPaymentsQueue";

export default function YearlyPaymentsPage() {
  return (
    <Suspense fallback={<ApexPageLoader label="Loading yearly payments…" />}>
      <ApexPaymentsQueue kind="yearly" />
    </Suspense>
  );
}
