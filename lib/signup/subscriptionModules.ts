import {
  MODULE_OPTIONS,
  SIGNUP_COMING_SOON_BUSINESS_TYPES,
  SIGNUP_REQUIRED_MODULE_COMMON,
  type BusinessType,
  type ModuleOption,
  isLodgingBusinessType,
} from "@/constants/signup";

export const BUSINESS_TYPE_SIGNUP_DESCRIPTIONS: Record<BusinessType, string> = {
  "Cafe and Restaurant":
    "Orders, kitchen, bar, tables, cashier, and daily café operations.",
  Hotel:
    "Lodging with optional room management, cleaning & maintenance, inventory, credit, and café.",
  Resort: "Resort operations — registration opening soon.",
  Pension: "Guest house and pension workflows — registration opening soon.",
};

export function isBusinessTypeComingSoon(type: BusinessType): boolean {
  return (SIGNUP_COMING_SOON_BUSINESS_TYPES as readonly string[]).includes(type);
}

export const SIGNUP_COMING_SOON_MODULES = [
] as const satisfies readonly ModuleOption[];

export const MODULE_DESCRIPTIONS: Record<ModuleOption, string> = {
  "Credentials(Common)":
    "Grant and update staff login credentials for your property.",
  "Cafe and Restaurant":
    "Orders, cashier, bar, chef, tables/waiters, and menu handling.",
  Inventory:
    "Store terminal, stock lists, suppliers, and item receipts. Without Financial Management, cost control and finance approval steps are omitted.",
  "Credit Management":
    "Corporate credit registration, agreements, tiers, and usage reporting.",
  "Financial Management":
    "Cost control and finance roles; purchase, registration, and stock movement approvals.",
  "HR Module":
    "Employees, leave, attendance/shifts, documents, payroll, and incidents.",
  "Room Management":
    "Rooms, reception check-in/out, guest stays, billing, laundry and in-room F&B.",
  "Cleaning and Maintenance":
    "Housekeeping and maintenance queues: dirty rooms, maintenance windows, and CM assignments.",
};

export type SignupPricing = {
  setupFeeETB: number;
  quarterlyFeeETB: number;
};

export function isModuleComingSoon(mod: ModuleOption): boolean {
  return (SIGNUP_COMING_SOON_MODULES as readonly string[]).includes(mod);
}

export function isModuleRequiredAtSignup(
  mod: ModuleOption,
  businessType: BusinessType,
): boolean {
  if (mod === SIGNUP_REQUIRED_MODULE_COMMON) return true;
  if (businessType === "Cafe and Restaurant" && mod === "Cafe and Restaurant") {
    return true;
  }
  return false;
}

export function isModuleDisabledAtSignup(
  mod: ModuleOption,
  businessType: BusinessType,
): boolean {
  if (isModuleComingSoon(mod)) return true;
  if (isModuleRequiredAtSignup(mod, businessType)) return true;
  if (mod === "Financial Management" && businessType === "Cafe and Restaurant") {
    return true;
  }
  if (
    businessType === "Cafe and Restaurant" &&
    (mod === "Room Management" || mod === "Cleaning and Maintenance")
  ) {
    return true;
  }
  return false;
}

export function getSignupDisabledReason(
  mod: ModuleOption,
  businessType: BusinessType,
): string | null {
  if (isModuleComingSoon(mod)) return "Coming soon";
  if (isModuleRequiredAtSignup(mod, businessType)) return "Included";
  return null;
}

export function getDefaultSignupModules(businessType: BusinessType): ModuleOption[] {
  if (businessType === "Cafe and Restaurant") {
    return ["Credentials(Common)", "Cafe and Restaurant"];
  }
  return ["Credentials(Common)"];
}

export function normalizeSignupModules(
  businessType: BusinessType,
  selected: readonly ModuleOption[],
): ModuleOption[] {
  const allowed = new Set<ModuleOption>();
  for (const mod of MODULE_OPTIONS) {
    if (
      isModuleDisabledAtSignup(mod, businessType) &&
      !isModuleRequiredAtSignup(mod, businessType)
    ) {
      continue;
    }
    if (selected.includes(mod)) allowed.add(mod);
  }
  for (const req of getDefaultSignupModules(businessType)) {
    allowed.add(req);
  }
  return MODULE_OPTIONS.filter((m) => allowed.has(m));
}

export function calculateSignupPricing(
  businessType: BusinessType,
  modules: readonly ModuleOption[],
): SignupPricing {
  const set = new Set(modules);
  const hasCafe = set.has("Cafe and Restaurant");
  const hasInv = set.has("Inventory");
  const hasFin = set.has("Financial Management");
  const hasCredit = set.has("Credit Management");
  const hasHr = set.has("HR Module");
  const hrSetup = hasHr ? 5_000 : 0;
  const hrQuarterly = hasHr ? 2_000 : 0;

  if (businessType === "Cafe and Restaurant") {
    let base: SignupPricing;
    if (hasCredit) base = { setupFeeETB: 35_000, quarterlyFeeETB: 10_000 };
    else if (hasInv) base = { setupFeeETB: 30_000, quarterlyFeeETB: 7_000 };
    else base = { setupFeeETB: 25_000, quarterlyFeeETB: 5_000 };
    return {
      setupFeeETB: base.setupFeeETB + hrSetup,
      quarterlyFeeETB: base.quarterlyFeeETB + hrQuarterly,
    };
  }

  if (isLodgingBusinessType(businessType)) {
    let base: SignupPricing;
    if (hasCafe) {
      if (hasInv && hasFin && hasCredit) {
        base = { setupFeeETB: 35_000, quarterlyFeeETB: 15_000 };
      } else if (hasInv && hasCredit) {
        base = { setupFeeETB: 35_000, quarterlyFeeETB: 10_000 };
      } else if (hasCredit && !hasInv) {
        base = { setupFeeETB: 35_000, quarterlyFeeETB: 10_000 };
      } else if (hasInv && hasFin) {
        base = { setupFeeETB: 30_000, quarterlyFeeETB: 10_000 };
      } else if (hasInv) {
        base = { setupFeeETB: 30_000, quarterlyFeeETB: 10_000 };
      } else {
        base = { setupFeeETB: 25_000, quarterlyFeeETB: 5_000 };
      }
    } else if (hasInv && hasFin && hasCredit) {
      base = { setupFeeETB: 35_000, quarterlyFeeETB: 15_000 };
    } else if (hasInv && hasCredit) {
      base = { setupFeeETB: 30_000, quarterlyFeeETB: 10_000 };
    } else if (hasCredit && !hasInv) {
      base = { setupFeeETB: 20_000, quarterlyFeeETB: 7_000 };
    } else if (hasInv && hasFin) {
      base = { setupFeeETB: 30_000, quarterlyFeeETB: 10_000 };
    } else if (hasInv) {
      base = { setupFeeETB: 25_000, quarterlyFeeETB: 10_000 };
    } else {
      base = { setupFeeETB: 0, quarterlyFeeETB: 0 };
    }
    return {
      setupFeeETB: base.setupFeeETB + hrSetup,
      quarterlyFeeETB: base.quarterlyFeeETB + hrQuarterly,
    };
  }

  return { setupFeeETB: hrSetup, quarterlyFeeETB: hrQuarterly };
}

export function formatETB(amount: number): string {
  return `${amount.toLocaleString("en-ET")} ETB`;
}

/** Primary tenant login role created at signup — Admin (café) or Manager (lodging). */
export function tenantPrimaryRole(businessType: BusinessType): "Admin" | "Manager" {
  return isLodgingBusinessType(businessType) ? "Manager" : "Admin";
}

/** @deprecated use tenantPrimaryRole */
export function ownerRoleForBusinessType(businessType: BusinessType): "Admin" | "Manager" {
  return tenantPrimaryRole(businessType);
}

export function tenantPrimaryAccountTitle(businessType: BusinessType): string {
  return tenantPrimaryRole(businessType) === "Manager" ? "Manager account" : "Admin account";
}

export function tenantPrimaryAccountDescription(businessType: BusinessType): string {
  const role = tenantPrimaryRole(businessType);
  if (role === "Manager") {
    return "Manager login for this hotel — grants access to the hotcol-user manager dashboard.";
  }
  return "Admin login for this café — grants access to the hotcol-user admin dashboard.";
}
