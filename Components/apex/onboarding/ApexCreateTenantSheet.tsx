"use client";

import { useRouter } from "next/navigation";
import { ApexCreateTenantForm } from "@/Components/apex/onboarding/ApexCreateTenantForm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/Components/ui/sheet";
import { useCreateTenantSheet } from "@/lib/apex/create-tenant-sheet";

export function ApexCreateTenantSheet() {
  const router = useRouter();
  const { open, setOpen } = useCreateTenantSheet();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-6 py-5 text-left">
          <SheetTitle className="text-xl tracking-tight">Create tenant</SheetTitle>
          <SheetDescription className="text-pretty leading-relaxed">
            Register a café or hotel on behalf of a customer. Creates an{" "}
            <strong>Admin</strong> login for cafés or a <strong>Manager</strong> login for
            hotels.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <ApexCreateTenantForm
            key={open ? "create-tenant-open" : "create-tenant-closed"}
            onCreated={(result) => {
              setOpen(false);
              router.push(`/tenants/${encodeURIComponent(result.tinNumber)}`);
            }}
            onNavigateWithoutOwner={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
