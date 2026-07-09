/** Signup constants aligned with hotcol-user — keep in sync for module keys and business types. */

export const BUSINESS_TYPES = [
  "Cafe and Restaurant",
  "Hotel",
  "Resort",
  "Pension",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SIGNUP_COMING_SOON_BUSINESS_TYPES = [
  "Resort",
  "Pension",
] as const satisfies readonly BusinessType[];

export const LODGING_BUSINESS_TYPES = ["Hotel", "Resort", "Pension"] as const;

export type LodgingBusinessType = (typeof LODGING_BUSINESS_TYPES)[number];

export function isLodgingBusinessType(
  type: BusinessType,
): type is LodgingBusinessType {
  return (LODGING_BUSINESS_TYPES as readonly string[]).includes(type);
}

export const MODULE_OPTIONS = [
  "Cafe and Restaurant",
  "Credentials(Common)",
  "Inventory",
  "Credit Management",
  "Financial Management",
  "HR Module",
  "Room Management",
  "Cleaning and Maintenance",
] as const;

export type ModuleOption = (typeof MODULE_OPTIONS)[number];

export const SIGNUP_REQUIRED_MODULE_COMMON = "Credentials(Common)" as const;

export const SIGNUP_REQUIRED_MODULES_CAFE = [
  SIGNUP_REQUIRED_MODULE_COMMON,
  "Cafe and Restaurant",
] as const satisfies readonly ModuleOption[];

export const SIGNUP_REQUIRED_MODULES_LODGING = [
  SIGNUP_REQUIRED_MODULE_COMMON,
] as const satisfies readonly ModuleOption[];
