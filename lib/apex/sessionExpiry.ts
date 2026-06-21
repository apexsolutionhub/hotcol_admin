import { toast } from "sonner";
import { clearApexSession } from "./auth";

const LOGIN_PATH = "/";
const TOAST_ID = "apex-session-expired";

let redirectScheduled = false;

export function scheduleApexSessionExpiredRedirect(): void {
  if (typeof window === "undefined") return;
  if (redirectScheduled) return;
  redirectScheduled = true;
  toast.error("Your session has expired. Please sign in again.", {
    id: TOAST_ID,
    duration: 8000,
  });
  clearApexSession();
  window.setTimeout(() => {
    window.location.href = LOGIN_PATH;
  }, 1200);
}

export class ApexSessionExpiredError extends Error {
  readonly isSessionExpired = true;
  constructor() {
    super("SESSION_EXPIRED");
    this.name = "ApexSessionExpiredError";
  }
}

export function isApexSessionExpiredError(e: unknown): e is ApexSessionExpiredError {
  return e instanceof ApexSessionExpiredError;
}

export function graphqlMessageIndicatesApexSessionExpiry(raw: string): boolean {
  const m = String(raw || "").trim().toLowerCase();
  if (m === "not authenticated" || m === "not authenticated.") return true;
  if (m === "unauthorized") return true;
  if (m.includes("jwt expired")) return true;
  if (m.includes("jwt malformed")) return true;
  if (m.includes("invalid token")) return true;
  if (m.includes("invalid signature")) return true;
  return false;
}

export function graphqlErrorsIndicateApexSessionExpiry(
  errors: Array<{ message?: string }> | undefined,
): boolean {
  if (!Array.isArray(errors) || errors.length === 0) return false;
  return errors.some((e) =>
    graphqlMessageIndicatesApexSessionExpiry(String(e?.message ?? "")),
  );
}
