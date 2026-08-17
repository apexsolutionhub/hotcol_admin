export const CAFE_ORDER_MODES = ["digital", "analog"] as const;

export type CafeOrderMode = (typeof CAFE_ORDER_MODES)[number];

export type CafeOrderModeHistoryEntry = {
  mode: CafeOrderMode;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export const DEFAULT_CAFE_ORDER_MODE: CafeOrderMode = "digital";

export const CAFE_ORDER_MODE_LABELS: Record<CafeOrderMode, string> = {
  digital: "Digital ordering",
  analog: "Thermal printer (analog)",
};

export const CAFE_ORDER_MODE_SHORT_LABELS: Record<CafeOrderMode, string> = {
  digital: "Digital",
  analog: "Thermal printer",
};

export const CAFE_ORDER_MODE_DESCRIPTIONS: Record<CafeOrderMode, string> = {
  digital:
    "Kitchen and bar screens, cashier payment, and the current digital order flow.",
  analog:
    "The cashier computer prints tickets on a USB thermal printer through the POS agent. A successful print registers the order as paid. There is no kitchen/bar login.",
};

export function parseCafeOrderMode(raw: unknown): CafeOrderMode {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return value === "analog" ? "analog" : "digital";
}

export function unusedCafeOrderMode(current: unknown): CafeOrderMode {
  return parseCafeOrderMode(current) === "analog" ? "digital" : "analog";
}

export function cafeModuleSelected(modules: readonly string[]): boolean {
  return modules.includes("Cafe and Restaurant");
}
