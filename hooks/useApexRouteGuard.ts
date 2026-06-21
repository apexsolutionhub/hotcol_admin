"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApexToken } from "@/lib/apex/auth";

export function useApexRouteGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getApexToken()) {
      router.push("/");
      return;
    }
    setReady(true);
  }, [router]);

  return ready;
}
