import { apexGraphql, mapApexApiError } from "./api";
import {
  invalidateApexListCache,
  readListCache,
  writeListCache,
} from "./graphqlListCache";
import { persistApexSession, type ApexMember } from "./auth";
import { normalizeModuleList } from "./moduleChangeRequest";

export type DashboardSummary = {
  pendingSetupPayments: number;
  pendingQuarterlyPayments: number;
  pendingYearlyPayments: number;
  unreadFeedback: number;
  suspendedTenants: number;
  bannedTenants: number;
  setupPendingTenants: number;
  inactiveTenants: number;
  billingHoldTenants: number;
  graceOrExpiredTenants: number;
  trialsEndingSoon: number;
  trialExpiredTenants: number;
  totalTenants: number;
  totalUsers: number;
  disabledUsers: number;
  pendingModuleRequests: number;
  pendingOrderModeRequests: number;
  tenantsByBusinessType: { businessType: string; label: string; count: number }[];
};

export type SignupPipelineRow = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  ownerUserName: string;
  setupFeeETB: number;
  paymentTransactionRef: string | null;
  paymentChannel: string | null;
  registeredAt: string;
  pendingSetupPaymentId: number | null;
  cafeOrderMode?: string | null;
};

export type SignupReviewStatus = "pending" | "approved" | "rejected";

/** Tenant signed up in the current calendar month, with setup review status. */
export type MonthlySignupRow = SignupPipelineRow & {
  status: SignupReviewStatus;
  subscriptionStatus: string;
};

function isInCurrentCalendarMonth(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  );
}

export type TenantBillingInput = {
  setupFeeETB?: number;
  quarterlyFeeETB?: number;
  billingNotes?: string | null;
  isIllustrationTenant?: boolean;
  billingHold?: boolean;
  freeTrialEndsAt?: string | null;
};

export type PricingRuleRow = {
  id: number;
  businessType: string;
  modulesKey: string;
  modules: string[];
  setupFeeETB: number;
  quarterlyFeeETB: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type PricingRuleInput = {
  id?: number;
  businessType: string;
  modules: string[];
  setupFeeETB: number;
  quarterlyFeeETB: number;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type TenantListItem = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  accountStatus: string;
  subscriptionStatus: string;
  setupFeeApproved: boolean;
  setupFeeETB: number;
  quarterlyFeeETB: number;
  ownerUserName: string;
  createdAt: string | null;
  billingHold: boolean;
  isIllustrationTenant: boolean;
  unreadFeedback: number;
  cafeOrderMode?: string | null;
};

export type TenantDetail = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  logoUrl: string | null;
  accountStatus: string;
  subscriptionStatus: string;
  modules: string[];
  setupFeeETB: number;
  quarterlyFeeETB: number;
  suggestedSetupFeeETB: number;
  suggestedQuarterlyFeeETB: number;
  feesManuallySet: boolean;
  pricingRuleId: number | null;
  feesMatchCatalog: boolean;
  setupFeeApproved: boolean;
  subscriptionPaymentApproved: boolean;
  subscriptionPaidUntil: string | null;
  paidQuartersCount: number;
  billingHold: boolean;
  billingStartedAt: string | null;
  isIllustrationTenant: boolean;
  freeTrialEndsAt: string | null;
  billingNotes: string | null;
  paymentChannel: string | null;
  paymentTransactionRef: string | null;
  ownerUserName: string;
  suspendedReason: string | null;
  bannedReason: string | null;
  users: {
    id: number;
    UserName: string;
    Role: string;
    loginDisabled: boolean;
    loginDisabledReason: string | null;
    createdAt: string;
  }[];
  recentPayments: {
    id: number;
    paymentKind: string;
    amountETB: number;
    status: string;
    transactionRef: string;
    submittedAt: string;
  }[];
  operationalSnapshot: {
    staffCount: number;
    ordersToday: number;
    openOrders: number;
    pendingPurchaseRequests: number;
    pendingStockOutRequests: number;
    pendingItemRegistrations: number;
  };
  cafeOrderMode: string;
  cafeOrderModeHistory: { mode: string; effectiveFrom: string; effectiveTo: string | null }[];
};

export type PaymentRow = {
  id: number;
  tinNumber: string;
  paymentKind: string;
  amountETB: number;
  paymentChannel: string;
  transactionRef: string;
  status: string;
  submittedAt: string;
  hotelDisplayName: string | null;
  cafeOrderMode?: string | null;
};

export type TenantUserMonitoringRow = {
  id: number;
  userName: string;
  role: string;
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string;
  loginDisabled: boolean;
  loginDisabledReason: string | null;
  createdAt: string | null;
};

export type AuditLogRow = {
  id: number;
  action: string;
  targetTinNumber: string | null;
  targetUserId: number | null;
  reason: string | null;
  apexMemberName: string | null;
  createdAt: string;
};

export type ModuleChangeRequestRow = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  status: string;
  requestedBySide: string;
  requestNote: string | null;
  requestedModules: string[];
  requestedCafeOrderMode?: string | null;
  createdAt: string;
};

export type OrderModeChangeRequestRow = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  status: string;
  requestedBySide: string;
  requestNote: string | null;
  currentMode: string;
  requestedMode: string;
  createdAt: string;
};

export type FeedbackThreadRow = {
  id: number;
  tinNumber: string;
  hotelDisplayName: string;
  status: string;
  unreadFromTenant: number;
  updatedAt: string;
  lastMessage?: { body: string; senderSide: string; createdAt: string } | null;
};

export type FeedbackDirectoryRow = {
  tinNumber: string;
  hotelDisplayName: string;
  logoUrl?: string | null;
  threadId: number | null;
  chatStatus: string;
  unreadFromTenant: number;
  updatedAt: string | null;
  lastMessage?: { body: string; senderSide: string; createdAt: string } | null;
};

export type SignupPricingPreview = {
  setupFeeETB: number;
  quarterlyFeeETB: number;
  source: string;
};

export type TenantOnboardingResult = {
  tinNumber: string;
  hotelDisplayName: string;
  ownerUserName: string;
  ownerRole: string;
  setupFeeETB: number;
  setupFeeApproved: boolean;
  userId: number;
};

export type TenantWithoutOwnerRow = {
  tinNumber: string;
  hotelDisplayName: string;
  businessType: string | null;
  hasStaffUsers: boolean;
};

export type OwnerAccountRow = {
  id: number;
  userName: string;
  displayName: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  propertyCount: number;
  createdAt: string;
};

export type ApexCreateTenantInput = {
  hotelName: string;
  userName: string;
  password: string;
  businessType: string;
  modules: string[];
  logoUrl?: string | null;
  tinNumber?: string | null;
  paymentChannel?: string | null;
  paymentTransactionRef?: string | null;
  confirmPaymentReceived?: boolean;
  isIllustrationTenant?: boolean;
  billingNotes?: string | null;
  cafeOrderMode?: string | null;
};

export type ApexCreateTenantOwnerInput = {
  tinNumber: string;
  userName: string;
  password: string;
  logoUrl?: string | null;
  paymentChannel?: string | null;
  paymentTransactionRef?: string | null;
  confirmPaymentReceived?: boolean;
};

export type ApexCreateOwnerAccountInput = {
  userName: string;
  password: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  linkTinNumber?: string | null;
};

const listInflight = new Map<string, Promise<unknown>>();

function dedupeApexRead<T>(key: string, run: () => Promise<T>): Promise<T> {
  const cached = readListCache<T>(key);
  if (cached != null) return Promise.resolve(cached);

  const existing = listInflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      const result = await run();
      writeListCache(key, result);
      return result;
    } finally {
      listInflight.delete(key);
    }
  })();
  listInflight.set(key, p);
  return p;
}

export function invalidateApexCaches(prefix?: string): void {
  invalidateApexListCache(prefix);
}

function invalidateTenantDetailCaches() {
  invalidateApexCaches("apex:tenant:");
  invalidateApexCaches("apex:tenant-payments:");
}

function afterPaymentMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:payments");
  invalidateApexCaches("apex:tenants");
  invalidateApexCaches("apex:signups");
  invalidateTenantDetailCaches();
}

function afterTenantAccountMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:tenants");
  invalidateApexCaches("apex:signups");
  invalidateTenantDetailCaches();
}

function afterUserMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:users");
  invalidateTenantDetailCaches();
}

function afterBillingMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:tenants");
  invalidateApexCaches("apex:payments");
  invalidateTenantDetailCaches();
}

function afterModuleMutation() {
  invalidateApexCaches("apex:summary");
  invalidateApexCaches("apex:modules");
  invalidateApexCaches("apex:order-mode");
  invalidateApexCaches("apex:tenants");
  invalidateTenantDetailCaches();
}

function afterPricingMutation() {
  invalidateApexCaches("apex:pricing");
  invalidateApexCaches("apex:tenants");
  invalidateTenantDetailCaches();
}

export function mapApexLoginError(error: unknown): string {
  const mapped = mapApexApiError(error, "");
  const raw = (mapped || (error instanceof Error ? error.message : String(error ?? ""))).trim();
  const m = raw.toLowerCase();
  if (m.includes("invalid username or password")) {
    return "Invalid username or password.";
  }
  if (m.includes("pool timeout") || m.includes("failed to retrieve a connection")) {
    return "Apex API could not open a database connection. Set DATABASE_URL on hotcol-admin-backend and redeploy.";
  }
  return raw || "Login failed";
}

export async function apexLoginAction(
  UserName: string,
  Password: string,
): Promise<{ token: string; member: ApexMember }> {
  const data = await apexGraphql<{
    apexLogin: { token: string; member: ApexMember };
  }>(
    `mutation ApexLogin($UserName: String!, $Password: String!) {
      apexLogin(UserName: $UserName, Password: $Password) {
        token
        member { id UserName displayName role }
      }
    }`,
    { UserName: UserName.trim(), Password },
  );
  persistApexSession(data.apexLogin.token, data.apexLogin.member);
  return data.apexLogin;
}

export async function fetchDashboardSummary() {
  return dedupeApexRead("apex:summary", async () => {
    const data = await apexGraphql<{ apexDashboardSummary: DashboardSummary }>(`
      query { apexDashboardSummary {
        pendingSetupPayments pendingQuarterlyPayments pendingYearlyPayments unreadFeedback
        suspendedTenants bannedTenants setupPendingTenants inactiveTenants
        billingHoldTenants graceOrExpiredTenants trialsEndingSoon trialExpiredTenants
        totalTenants totalUsers disabledUsers pendingModuleRequests pendingOrderModeRequests
        tenantsByBusinessType { businessType label count }
      }}
    `);
    return data.apexDashboardSummary;
  });
}

export async function fetchTenants(search?: string, businessType?: string) {
  const key = `apex:tenants:${(search || "").trim().toLowerCase()}:${businessType || "all"}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexTenants: TenantListItem[] }>(
      `query($search: String, $businessType: String) {
        apexTenants(search: $search, businessType: $businessType) {
          tinNumber hotelDisplayName businessType accountStatus subscriptionStatus
          setupFeeApproved setupFeeETB quarterlyFeeETB ownerUserName createdAt
          billingHold isIllustrationTenant unreadFeedback cafeOrderMode
        }
      }`,
      { search: search?.trim() || null, businessType: businessType || null },
    );
    return data.apexTenants;
  });
}

export async function fetchTenantDetail(tinNumber: string) {
  const key = `apex:tenant:${tinNumber}`;
  return dedupeApexRead(key, async () => {
  const data = await apexGraphql<{ apexTenantDetail: TenantDetail }>(
    `query($tin: String!) {
      apexTenantDetail(tinNumber: $tin) {
        tinNumber hotelDisplayName businessType logoUrl accountStatus subscriptionStatus
        modules setupFeeETB quarterlyFeeETB suggestedSetupFeeETB suggestedQuarterlyFeeETB
        feesManuallySet pricingRuleId feesMatchCatalog
        setupFeeApproved subscriptionPaymentApproved
        subscriptionPaidUntil paidQuartersCount billingHold billingStartedAt
        isIllustrationTenant freeTrialEndsAt billingNotes paymentChannel paymentTransactionRef
        ownerUserName suspendedReason bannedReason
        users { id UserName Role loginDisabled loginDisabledReason createdAt }
        recentPayments { id paymentKind amountETB status transactionRef submittedAt }
        operationalSnapshot {
          staffCount ordersToday openOrders
          pendingPurchaseRequests pendingStockOutRequests pendingItemRegistrations
        }
        cafeOrderMode cafeOrderModeHistory
      }
    }`,
    { tin: tinNumber },
  );
  return data.apexTenantDetail;
  });
}

export async function fetchPendingPayments(kind?: string) {
  const key = `apex:payments:${kind || "all"}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexPendingPayments: PaymentRow[] }>(
      `query($kind: String) {
        apexPendingPayments(kind: $kind) {
          id tinNumber paymentKind amountETB paymentChannel transactionRef
          status submittedAt hotelDisplayName cafeOrderMode
        }
      }`,
      { kind: kind || null },
    );
    return data.apexPendingPayments;
  });
}

export async function fetchFeedbackThreads(limit = 500) {
  const key = `apex:feedback:${limit}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexFeedbackThreads: FeedbackThreadRow[] }>(
      `query($limit: Int) {
        apexFeedbackThreads(limit: $limit) {
          id tinNumber hotelDisplayName status unreadFromTenant updatedAt
          lastMessage { body senderSide createdAt }
        }
      }`,
      { limit },
    );
    return data.apexFeedbackThreads;
  });
}

export async function fetchFeedbackDirectory(search?: string) {
  const key = `apex:feedback-dir:${(search || "").trim().toLowerCase()}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexFeedbackDirectory: FeedbackDirectoryRow[] }>(
      `query($search: String) {
        apexFeedbackDirectory(search: $search) {
          tinNumber hotelDisplayName logoUrl threadId chatStatus
          unreadFromTenant updatedAt
          lastMessage { body senderSide createdAt }
        }
      }`,
      { search: search?.trim() || null },
    );
    return data.apexFeedbackDirectory;
  });
}

export async function fetchFeedbackThread(threadId: number) {
  const data = await apexGraphql<{
    apexFeedbackThread: {
      id: number;
      tinNumber: string;
      hotelDisplayName: string;
      status: string;
      messages: {
        id: number;
        senderSide: string;
        tenantUserName: string | null;
        apexDisplayName: string | null;
        body: string;
        imageUrl: string | null;
        createdAt: string;
      }[];
    };
  }>(
    `query($id: Int!) {
      apexFeedbackThread(threadId: $id) {
        id tinNumber hotelDisplayName status
        messages {
          id senderSide tenantUserName apexDisplayName body imageUrl createdAt
        }
      }
    }`,
    { id: threadId },
  );
  return data.apexFeedbackThread;
}

export async function approveSetup(tinNumber: string) {
  await apexGraphql(`mutation($tin: String!) { approveTenantSetupPayment(tinNumber: $tin) }`, {
    tin: tinNumber,
  });
  afterPaymentMutation();
}

export async function rejectSetup(tinNumber: string, reason: string) {
  await apexGraphql(
    `mutation($tin: String!, $reason: String!) {
      rejectTenantSetupPayment(tinNumber: $tin, reason: $reason)
    }`,
    { tin: tinNumber, reason: reason.trim() },
  );
  afterPaymentMutation();
}

export async function approveQuarterly(tinNumber: string) {
  await apexGraphql(`mutation($tin: String!) { approveTenantQuarterPayment(tinNumber: $tin) }`, {
    tin: tinNumber,
  });
  afterPaymentMutation();
}

export async function approveYearly(tinNumber: string) {
  await apexGraphql(`mutation($tin: String!) { approveTenantYearlyPayment(tinNumber: $tin) }`, {
    tin: tinNumber,
  });
  afterPaymentMutation();
}

export async function rejectPayment(submissionId: number, reason: string) {
  const note = reason.trim();
  if (!note) throw new Error("Rejection reason is required");
  await apexGraphql(
    `mutation($id: Int!, $reason: String!) {
      rejectTenantPayment(submissionId: $id, reason: $reason)
    }`,
    { id: submissionId, reason: note },
  );
  afterPaymentMutation();
}

export async function releaseHold(tinNumber: string) {
  await apexGraphql(`mutation($tin: String!) { releaseTenantBillingHold(tinNumber: $tin) }`, {
    tin: tinNumber,
  });
  afterBillingMutation();
}

export async function suspendTenant(tinNumber: string, reason: string) {
  await apexGraphql(`mutation($tin: String!, $reason: String!) { suspendTenant(tinNumber: $tin, reason: $reason) }`, {
    tin: tinNumber,
    reason,
  });
  afterTenantAccountMutation();
}

export async function unsuspendTenant(tinNumber: string) {
  await apexGraphql(`mutation($tin: String!) { unsuspendTenant(tinNumber: $tin) }`, { tin: tinNumber });
  afterTenantAccountMutation();
}

export async function banTenant(tinNumber: string, reason: string) {
  await apexGraphql(`mutation($tin: String!, $reason: String!) { banTenant(tinNumber: $tin, reason: $reason) }`, {
    tin: tinNumber,
    reason,
  });
  afterTenantAccountMutation();
}

export async function unbanTenant(tinNumber: string) {
  await apexGraphql(`mutation($tin: String!) { unbanTenant(tinNumber: $tin) }`, { tin: tinNumber });
  afterTenantAccountMutation();
}

export async function deleteTenant(tinNumber: string, reason: string) {
  await apexGraphql(
    `mutation($tin: String!, $reason: String!) {
      deleteTenant(tinNumber: $tin, reason: $reason)
    }`,
    { tin: tinNumber, reason: reason.trim() },
  );
  afterTenantAccountMutation();
}

export async function restoreDeletedTenant(tinNumber: string, reason?: string) {
  await apexGraphql(
    `mutation($tin: String!, $reason: String) {
      restoreDeletedTenant(tinNumber: $tin, reason: $reason)
    }`,
    { tin: tinNumber, reason: reason?.trim() || null },
  );
  afterTenantAccountMutation();
}

export async function setUserLoginDisabled(userId: number, disabled: boolean, reason?: string) {
  await apexGraphql(
    `mutation($id: Int!, $disabled: Boolean!, $reason: String) {
      setUserLoginDisabled(userId: $id, disabled: $disabled, reason: $reason)
    }`,
    { id: userId, disabled, reason: reason || null },
  );
  afterUserMutation();
}

export async function sendApexFeedback(threadId: number, body: string) {
  await apexGraphql(
    `mutation($threadId: Int!, $body: String) {
      sendApexFeedbackMessage(threadId: $threadId, body: $body) { id }
    }`,
    { threadId, body },
  );
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:feedback-dir");
  invalidateApexCaches("apex:summary");
}

export async function startApexChatWithTenant(tinNumber: string, body: string) {
  const text = body.trim();
  if (!text) throw new Error("Opening message is required");
  const data = await apexGraphql<{
    startApexChatWithTenant: { id: number };
  }>(
    `mutation($tin: String!, $body: String!) {
      startApexChatWithTenant(tinNumber: $tin, body: $body) {
        id tinNumber hotelDisplayName status
      }
    }`,
    { tin: tinNumber, body: text },
  );
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:feedback-dir");
  invalidateApexCaches("apex:summary");
  return data.startApexChatWithTenant;
}

export type BroadcastChatResult = {
  sentCount: number;
  failedCount: number;
  threadIds: number[];
  failures: { tinNumber: string; message: string }[];
};

export async function broadcastApexChatToTenants(
  tinNumbers: string[],
  body: string,
): Promise<BroadcastChatResult> {
  const text = body.trim();
  if (!text) throw new Error("Broadcast message is required");
  const tins = [...new Set(tinNumbers.map((t) => t.trim()).filter(Boolean))];
  if (tins.length === 0) throw new Error("Select at least one property");

  const data = await apexGraphql<{
    broadcastApexChatToTenants: BroadcastChatResult;
  }>(
    `mutation($tins: [String!]!, $body: String!) {
      broadcastApexChatToTenants(tinNumbers: $tins, body: $body) {
        sentCount
        failedCount
        threadIds
        failures { tinNumber message }
      }
    }`,
    { tins, body: text },
  );
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:feedback-dir");
  invalidateApexCaches("apex:summary");
  return data.broadcastApexChatToTenants;
}

export async function fetchTenantUsers(
  search?: string,
  businessType?: string,
  options?: { loginDisabledOnly?: boolean; limit?: number },
) {
  const loginDisabledOnly = Boolean(options?.loginDisabledOnly);
  const limit = options?.limit ?? 500;
  const key = `apex:users:${(search || "").trim().toLowerCase()}:${businessType || "all"}:${loginDisabledOnly}:${limit}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexTenantUsers: TenantUserMonitoringRow[] }>(
      `query($search: String, $businessType: String, $loginDisabledOnly: Boolean, $limit: Int) {
        apexTenantUsers(
          search: $search
          businessType: $businessType
          loginDisabledOnly: $loginDisabledOnly
          limit: $limit
        ) {
          id userName role tinNumber hotelDisplayName businessType
          loginDisabled loginDisabledReason createdAt
        }
      }`,
      {
        search: search?.trim() || null,
        businessType: businessType || null,
        loginDisabledOnly: loginDisabledOnly || null,
        limit,
      },
    );
    return data.apexTenantUsers;
  });
}

export async function fetchAuditLogs(limit = 100) {
  const key = `apex:audit:${limit}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexAuditLogs: AuditLogRow[] }>(
      `query($limit: Int) {
        apexAuditLogs(limit: $limit) {
          id action targetTinNumber targetUserId reason apexMemberName createdAt
        }
      }`,
      { limit },
    );
    return data.apexAuditLogs;
  });
}

export async function fetchModuleChangeRequests(status?: string) {
  const key = `apex:modules:${status || "all"}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexModuleChangeRequests: ModuleChangeRequestRow[] }>(
      `query($status: String) {
        apexModuleChangeRequests(status: $status) {
          id tinNumber hotelDisplayName status requestedBySide requestNote
          requestedModules requestedCafeOrderMode createdAt
        }
      }`,
      { status: status || null },
    );
    return data.apexModuleChangeRequests.map((row) => ({
      ...row,
      requestedModules: normalizeModuleList(row.requestedModules),
    }));
  });
}

export async function fetchOrderModeChangeRequests(status?: string) {
  const key = `apex:order-mode:${status || "all"}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{
      apexOrderModeChangeRequests: OrderModeChangeRequestRow[];
    }>(
      `query($status: String) {
        apexOrderModeChangeRequests(status: $status) {
          id tinNumber hotelDisplayName status requestedBySide requestNote
          currentMode requestedMode createdAt
        }
      }`,
      { status: status || null },
    );
    return data.apexOrderModeChangeRequests;
  });
}

export async function fetchSignupPipeline(limit = 50) {
  const key = `apex:signups:${limit}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexSignupPipeline: SignupPipelineRow[] }>(
      `query($limit: Int) {
        apexSignupPipeline(limit: $limit) {
          tinNumber hotelDisplayName businessType ownerUserName setupFeeETB
          paymentTransactionRef paymentChannel registeredAt pendingSetupPaymentId
          cafeOrderMode
        }
      }`,
      { limit },
    );
    return data.apexSignupPipeline;
  });
}

/**
 * Signups for the current calendar month (pending, approved, and rejected).
 * Pending = has a pending setup payment submission (same queue as Setup payments).
 * Rejected/approved otherwise come from setup fee flag + payment history.
 */
export async function fetchMonthlySignups(): Promise<MonthlySignupRow[]> {
  const now = new Date();
  const key = `apex:signups:month:${now.getFullYear()}-${now.getMonth()}`;
  return dedupeApexRead(key, async () => {
    const [tenants, pipeline, pendingSetupPayments] = await Promise.all([
      fetchTenants(),
      fetchSignupPipeline(200),
      fetchPendingPayments("setup"),
    ]);

    const pipelineByTin = new Map(pipeline.map((row) => [row.tinNumber, row]));
    const pendingSetupByTin = new Map(
      pendingSetupPayments.map((row) => [row.tinNumber, row]),
    );
    const monthTenants = tenants.filter(
      (tenant) =>
        !tenant.isIllustrationTenant && isInCurrentCalendarMonth(tenant.createdAt),
    );

    const resolved: MonthlySignupRow[] = [];
    const needsHistory: TenantListItem[] = [];

    for (const tenant of monthTenants) {
      const pipe = pipelineByTin.get(tenant.tinNumber);
      const pendingPayment = pendingSetupByTin.get(tenant.tinNumber);
      const registeredAt =
        tenant.createdAt ?? pipe?.registeredAt ?? new Date().toISOString();

      if (tenant.setupFeeApproved) {
        resolved.push({
          tinNumber: tenant.tinNumber,
          hotelDisplayName: tenant.hotelDisplayName,
          businessType: tenant.businessType,
          ownerUserName: tenant.ownerUserName,
          setupFeeETB: tenant.setupFeeETB,
          paymentTransactionRef:
            pipe?.paymentTransactionRef ?? pendingPayment?.transactionRef ?? null,
          paymentChannel:
            pipe?.paymentChannel ?? pendingPayment?.paymentChannel ?? null,
          registeredAt,
          pendingSetupPaymentId: null,
          status: "approved",
          subscriptionStatus: tenant.subscriptionStatus,
          cafeOrderMode: tenant.cafeOrderMode ?? pipe?.cafeOrderMode ?? null,
        });
        continue;
      }

      // Align with Setup payments: only "pending" when a setup submission awaits review.
      const awaitingReview =
        pendingPayment != null ||
        (pipe != null && pipe.pendingSetupPaymentId != null);

      if (awaitingReview) {
        resolved.push({
          tinNumber: tenant.tinNumber,
          hotelDisplayName:
            pipe?.hotelDisplayName ||
            pendingPayment?.hotelDisplayName ||
            tenant.hotelDisplayName,
          businessType: tenant.businessType ?? pipe?.businessType ?? null,
          ownerUserName: pipe?.ownerUserName || tenant.ownerUserName,
          setupFeeETB:
            pipe?.setupFeeETB ||
            pendingPayment?.amountETB ||
            tenant.setupFeeETB,
          paymentTransactionRef:
            pipe?.paymentTransactionRef ?? pendingPayment?.transactionRef ?? null,
          paymentChannel:
            pipe?.paymentChannel ?? pendingPayment?.paymentChannel ?? null,
          registeredAt: pipe?.registeredAt || registeredAt,
          pendingSetupPaymentId:
            pipe?.pendingSetupPaymentId ?? pendingPayment?.id ?? null,
          status: "pending",
          subscriptionStatus: tenant.subscriptionStatus,
          cafeOrderMode:
            tenant.cafeOrderMode ??
            pipe?.cafeOrderMode ??
            pendingPayment?.cafeOrderMode ??
            null,
        });
        continue;
      }

      needsHistory.push(tenant);
    }

    await Promise.all(
      needsHistory.map(async (tenant) => {
        const registeredAt = tenant.createdAt ?? new Date().toISOString();
        let status: SignupReviewStatus = "pending";
        let paymentTransactionRef: string | null = null;

        try {
          const payments = await fetchTenantPaymentHistory(tenant.tinNumber, 40);
          const setupPayments = payments
            .filter((p) => String(p.paymentKind).toLowerCase() === "setup")
            .sort(
              (a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
            );
          const latest = setupPayments[0];
          if (latest) {
            paymentTransactionRef = latest.transactionRef;
          }

          const statuses = setupPayments.map((p) =>
            normalizeSetupPaymentStatus(p.status),
          );
          if (statuses.includes("pending")) {
            status = "pending";
          } else if (statuses.includes("rejected")) {
            status = "rejected";
            const rejected = setupPayments.find(
              (p) => normalizeSetupPaymentStatus(p.status) === "rejected",
            );
            if (rejected) paymentTransactionRef = rejected.transactionRef;
          } else if (statuses.includes("approved")) {
            status = "approved";
          } else {
            status = "pending";
          }
        } catch {
          status = "pending";
        }

        resolved.push({
          tinNumber: tenant.tinNumber,
          hotelDisplayName: tenant.hotelDisplayName,
          businessType: tenant.businessType,
          ownerUserName: tenant.ownerUserName,
          setupFeeETB: tenant.setupFeeETB,
          paymentTransactionRef,
          paymentChannel: null,
          registeredAt,
          pendingSetupPaymentId: null,
          status,
          subscriptionStatus: tenant.subscriptionStatus,
          cafeOrderMode: tenant.cafeOrderMode ?? null,
        });
      }),
    );

    resolved.sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    );
    return resolved;
  });
}

function normalizeSetupPaymentStatus(raw: string): SignupReviewStatus {
  const status = String(raw || "").toLowerCase().trim();
  if (
    status === "rejected" ||
    status === "declined" ||
    status === "denied" ||
    status.includes("reject")
  ) {
    return "rejected";
  }
  if (status === "approved" || status === "paid" || status.includes("approv")) {
    return "approved";
  }
  return "pending";
}

export async function fetchTenantPaymentHistory(tinNumber: string, limit = 50) {
  const key = `apex:tenant-payments:${tinNumber}:${limit}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexTenantPaymentHistory: TenantDetail["recentPayments"] }>(
      `query($tin: String!, $limit: Int) {
        apexTenantPaymentHistory(tinNumber: $tin, limit: $limit) {
          id paymentKind amountETB status transactionRef submittedAt
        }
      }`,
      { tin: tinNumber, limit },
    );
    return data.apexTenantPaymentHistory;
  });
}

export async function fetchFeedbackTenantContext(tinNumber: string) {
  return fetchTenantDetail(tinNumber);
}

export async function updateTenantBilling(tinNumber: string, input: TenantBillingInput) {
  await apexGraphql(
    `mutation($tin: String!, $setup: Int, $quarterly: Int, $notes: String, $illustration: Boolean, $hold: Boolean, $trial: String) {
      updateTenantBilling(
        tinNumber: $tin
        setupFeeETB: $setup
        quarterlyFeeETB: $quarterly
        billingNotes: $notes
        isIllustrationTenant: $illustration
        billingHold: $hold
        freeTrialEndsAt: $trial
      )
    }`,
    {
      tin: tinNumber,
      setup: input.setupFeeETB ?? null,
      quarterly: input.quarterlyFeeETB ?? null,
      notes: input.billingNotes ?? null,
      illustration: input.isIllustrationTenant ?? null,
      hold: input.billingHold ?? null,
      trial: input.freeTrialEndsAt ?? null,
    },
  );
  afterBillingMutation();
}

export async function updateTenantModules(
  tinNumber: string,
  modules: string[],
  recalcFees?: boolean,
) {
  await apexGraphql(
    `mutation($tin: String!, $modules: JSON!, $recalc: Boolean) {
      updateTenantModules(tinNumber: $tin, modules: $modules, recalcFees: $recalc)
    }`,
    { tin: tinNumber, modules, recalc: recalcFees ?? null },
  );
  afterModuleMutation();
}

export async function applySuggestedTenantFees(tinNumber: string) {
  await apexGraphql(
    `mutation($tin: String!) { applySuggestedTenantFees(tinNumber: $tin) }`,
    { tin: tinNumber },
  );
  afterBillingMutation();
}

export async function fetchPricingRules(businessType?: string) {
  const key = `apex:pricing:${businessType || "all"}`;
  return dedupeApexRead(key, async () => {
    const data = await apexGraphql<{ apexPricingRules: PricingRuleRow[] }>(
      `query($bt: String) {
        apexPricingRules(businessType: $bt) {
          id businessType modulesKey modules setupFeeETB quarterlyFeeETB
          description isActive sortOrder updatedAt
        }
      }`,
      { bt: businessType || null },
    );
    return data.apexPricingRules;
  });
}

export async function upsertPricingRule(input: PricingRuleInput) {
  const data = await apexGraphql<{ upsertPricingRule: PricingRuleRow }>(
    `mutation(
      $id: Int
      $bt: String!
      $modules: JSON!
      $setup: Int!
      $quarterly: Int!
      $desc: String
      $active: Boolean
      $sort: Int
    ) {
      upsertPricingRule(
        id: $id
        businessType: $bt
        modules: $modules
        setupFeeETB: $setup
        quarterlyFeeETB: $quarterly
        description: $desc
        isActive: $active
        sortOrder: $sort
      ) {
        id businessType modulesKey modules setupFeeETB quarterlyFeeETB
        description isActive sortOrder updatedAt
      }
    }`,
    {
      id: input.id ?? null,
      bt: input.businessType,
      modules: input.modules,
      setup: input.setupFeeETB,
      quarterly: input.quarterlyFeeETB,
      desc: input.description ?? null,
      active: input.isActive ?? null,
      sort: input.sortOrder ?? null,
    },
  );
  afterPricingMutation();
  return data.upsertPricingRule;
}

export async function setPricingRuleActive(id: number, isActive: boolean) {
  await apexGraphql(
    `mutation($id: Int!, $active: Boolean!) {
      setPricingRuleActive(id: $id, isActive: $active)
    }`,
    { id, active: isActive },
  );
  afterPricingMutation();
}

export async function deletePricingRule(id: number) {
  await apexGraphql(
    `mutation($id: Int!) {
      deletePricingRule(id: $id)
    }`,
    { id },
  );
  afterPricingMutation();
}

export async function syncTenantStaffModules(tinNumber: string) {
  await apexGraphql(
    `mutation($tin: String!) { syncTenantStaffModules(tinNumber: $tin) }`,
    { tin: tinNumber },
  );
  afterModuleMutation();
}

export async function approveModuleChangeRequest(requestId: number, reviewNote?: string) {
  await apexGraphql(
    `mutation($id: Int!, $note: String) {
      approveModuleChangeRequest(requestId: $id, reviewNote: $note)
    }`,
    { id: requestId, note: reviewNote || null },
  );
  afterModuleMutation();
}

export async function rejectModuleChangeRequest(requestId: number, reviewNote?: string) {
  await apexGraphql(
    `mutation($id: Int!, $note: String) {
      rejectModuleChangeRequest(requestId: $id, reviewNote: $note)
    }`,
    { id: requestId, note: reviewNote || null },
  );
  afterModuleMutation();
}

export async function approveOrderModeChangeRequest(requestId: number, reviewNote?: string) {
  await apexGraphql(
    `mutation($id: Int!, $note: String) {
      approveOrderModeChangeRequest(requestId: $id, reviewNote: $note)
    }`,
    { id: requestId, note: reviewNote || null },
  );
  afterModuleMutation();
}

export async function rejectOrderModeChangeRequest(requestId: number, reviewNote?: string) {
  await apexGraphql(
    `mutation($id: Int!, $note: String) {
      rejectOrderModeChangeRequest(requestId: $id, reviewNote: $note)
    }`,
    { id: requestId, note: reviewNote || null },
  );
  afterModuleMutation();
}

export async function updateTenantCafeOrderMode(tinNumber: string, cafeOrderMode: string) {
  await apexGraphql(
    `mutation($tin: String!, $mode: String!) {
      updateTenantCafeOrderMode(tinNumber: $tin, cafeOrderMode: $mode)
    }`,
    { tin: tinNumber, mode: cafeOrderMode },
  );
  afterModuleMutation();
}

function afterOnboardingMutation() {
  invalidateApexCaches();
}

export async function fetchSignupPricingPreview(
  businessType: string,
  modules: string[],
): Promise<SignupPricingPreview> {
  const data = await apexGraphql<{ apexSignupPricingPreview: SignupPricingPreview }>(
    `query($bt: String!, $modules: JSON!) {
      apexSignupPricingPreview(businessType: $bt, modules: $modules) {
        setupFeeETB quarterlyFeeETB source
      }
    }`,
    { bt: businessType, modules },
  );
  return data.apexSignupPricingPreview;
}

export async function fetchTenantsWithoutOwner(): Promise<TenantWithoutOwnerRow[]> {
  const data = await apexGraphql<{ apexTenantsWithoutOwner: TenantWithoutOwnerRow[] }>(`
    query {
      apexTenantsWithoutOwner {
        tinNumber hotelDisplayName businessType hasStaffUsers
      }
    }
  `);
  return data.apexTenantsWithoutOwner;
}

export async function fetchOwnerAccounts(search?: string): Promise<OwnerAccountRow[]> {
  const data = await apexGraphql<{ apexOwnerAccounts: OwnerAccountRow[] }>(
    `query($q: String) {
      apexOwnerAccounts(search: $q) {
        id userName displayName phone email isActive propertyCount createdAt
      }
    }`,
    { q: search || null },
  );
  return data.apexOwnerAccounts;
}

export async function apexCreateTenant(
  input: ApexCreateTenantInput,
): Promise<TenantOnboardingResult> {
  const data = await apexGraphql<{ apexCreateTenant: TenantOnboardingResult }>(
    `mutation(
      $hotelName: String!
      $userName: String!
      $password: String!
      $businessType: String!
      $modules: JSON!
      $logoUrl: String
      $tinNumber: String
      $paymentChannel: String
      $paymentTransactionRef: String
      $confirmPaymentReceived: Boolean
      $isIllustrationTenant: Boolean
      $billingNotes: String
      $cafeOrderMode: String
    ) {
      apexCreateTenant(
        hotelName: $hotelName
        userName: $userName
        password: $password
        businessType: $businessType
        modules: $modules
        logoUrl: $logoUrl
        tinNumber: $tinNumber
        paymentChannel: $paymentChannel
        paymentTransactionRef: $paymentTransactionRef
        confirmPaymentReceived: $confirmPaymentReceived
        isIllustrationTenant: $isIllustrationTenant
        billingNotes: $billingNotes
        cafeOrderMode: $cafeOrderMode
      ) {
        tinNumber hotelDisplayName ownerUserName ownerRole setupFeeETB setupFeeApproved userId
      }
    }`,
    {
      hotelName: input.hotelName,
      userName: input.userName,
      password: input.password,
      businessType: input.businessType,
      modules: input.modules,
      logoUrl: input.logoUrl ?? null,
      tinNumber: input.tinNumber?.trim() || null,
      paymentChannel: input.paymentChannel ?? null,
      paymentTransactionRef: input.paymentTransactionRef ?? null,
      confirmPaymentReceived: input.confirmPaymentReceived ?? false,
      isIllustrationTenant: input.isIllustrationTenant ?? false,
      billingNotes: input.billingNotes ?? null,
      cafeOrderMode: input.cafeOrderMode ?? "digital",
    },
  );
  afterOnboardingMutation();
  return data.apexCreateTenant;
}

export async function apexCreateTenantOwner(
  input: ApexCreateTenantOwnerInput,
): Promise<TenantOnboardingResult> {
  const data = await apexGraphql<{ apexCreateTenantOwner: TenantOnboardingResult }>(
    `mutation(
      $tinNumber: String!
      $userName: String!
      $password: String!
      $logoUrl: String
      $paymentChannel: String
      $paymentTransactionRef: String
      $confirmPaymentReceived: Boolean
    ) {
      apexCreateTenantOwner(
        tinNumber: $tinNumber
        userName: $userName
        password: $password
        logoUrl: $logoUrl
        paymentChannel: $paymentChannel
        paymentTransactionRef: $paymentTransactionRef
        confirmPaymentReceived: $confirmPaymentReceived
      ) {
        tinNumber hotelDisplayName ownerUserName ownerRole setupFeeETB setupFeeApproved userId
      }
    }`,
    {
      tinNumber: input.tinNumber,
      userName: input.userName,
      password: input.password,
      logoUrl: input.logoUrl ?? null,
      paymentChannel: input.paymentChannel ?? null,
      paymentTransactionRef: input.paymentTransactionRef ?? null,
      confirmPaymentReceived: input.confirmPaymentReceived ?? false,
    },
  );
  afterOnboardingMutation();
  return data.apexCreateTenantOwner;
}

export async function apexCreateOwnerAccount(
  input: ApexCreateOwnerAccountInput,
): Promise<OwnerAccountRow> {
  const data = await apexGraphql<{ apexCreateOwnerAccount: OwnerAccountRow }>(
    `mutation(
      $userName: String!
      $password: String!
      $displayName: String
      $phone: String
      $email: String
      $linkTinNumber: String
    ) {
      apexCreateOwnerAccount(
        userName: $userName
        password: $password
        displayName: $displayName
        phone: $phone
        email: $email
        linkTinNumber: $linkTinNumber
      ) {
        id userName displayName phone email isActive propertyCount createdAt
      }
    }`,
    {
      userName: input.userName,
      password: input.password,
      displayName: input.displayName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      linkTinNumber: input.linkTinNumber?.trim() || null,
    },
  );
  afterOnboardingMutation();
  return data.apexCreateOwnerAccount;
}

export async function apexLinkOwnerProperty(
  ownerAccountId: number,
  tinNumber: string,
  label?: string | null,
) {
  await apexGraphql(
    `mutation($id: Int!, $tin: String!, $label: String) {
      apexLinkOwnerProperty(ownerAccountId: $id, tinNumber: $tin, label: $label)
    }`,
    { id: ownerAccountId, tin: tinNumber, label: label ?? null },
  );
  afterOnboardingMutation();
}

export async function closeFeedbackThread(threadId: number, reason?: string) {
  await apexGraphql(
    `mutation($id: Int!, $reason: String) {
      closeFeedbackThread(threadId: $id, reason: $reason)
    }`,
    { id: threadId, reason: reason || null },
  );
  invalidateApexCaches("apex:feedback");
  invalidateApexCaches("apex:feedback-dir");
  invalidateApexCaches("apex:summary");
}
