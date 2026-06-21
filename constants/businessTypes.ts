/** Canonical business types stored on tenant owner rows — no extra types. */
export const APEX_BUSINESS_TYPES = [
  { key: "Cafe and Restaurant", label: "Café & Restaurant" },
  { key: "Hotel", label: "Hotel" },
  { key: "Resort", label: "Resort" },
  { key: "Pension", label: "Pension" },
] as const;

export type ApexBusinessTypeKey = (typeof APEX_BUSINESS_TYPES)[number]["key"];

export function businessTypeLabel(key: string | null | undefined) {
  if (!key) return "—";
  const normalized = normalizeBusinessTypeKey(key);
  return (
    APEX_BUSINESS_TYPES.find((b) => b.key === normalized)?.label ?? key
  );
}

/** Maps legacy DB values (Cafe, Restaurant) to the single café & restaurant type. */
export function normalizeBusinessTypeKey(raw: string | null | undefined): string {
  const s = String(raw || "").trim();
  if (!s) return "Other";
  const lower = s.toLowerCase();
  if (
    lower === "cafe" ||
    lower === "café" ||
    lower === "restaurant" ||
    lower === "cafe and restaurant" ||
    lower === "café & restaurant"
  ) {
    return "Cafe and Restaurant";
  }
  if (lower === "hotel") return "Hotel";
  if (lower === "resort") return "Resort";
  if (lower === "pension") return "Pension";
  return s;
}
