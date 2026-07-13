/** Modules Apex can assign; names must match hotcol-user tenant module keys. */
export const APEX_SUBSCRIPTION_MODULES = [
  "Cafe and Restaurant",
  "Inventory",
  "Financial Management",
  "Credit Management",
  "HR Module",
  "Room Management",
  "Cleaning and Maintenance",
] as const;

export type ApexSubscriptionModule = (typeof APEX_SUBSCRIPTION_MODULES)[number];
