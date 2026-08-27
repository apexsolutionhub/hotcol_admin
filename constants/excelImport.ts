/**
 * Excel onboarding templates for Apex → tenant seed imports.
 * Column keys must stay aligned with hotcol-user batch create inputs.
 */

export const EXCEL_IMPORT_UNITS = [
  "Litre",
  "Kilogram",
  "Piece",
  "Packet",
  "Dozen",
  "Other",
] as const;

export const EXCEL_IMPORT_CATEGORIES = [
  "Food",
  "Beverage",
  "House Keeping",
  "Maintenance",
  "Office Supplies",
  "Others",
] as const;

export const EXCEL_IMPORT_MOVEMENT_TYPES = [
  "STOCK_OUT",
  "WASTAGE",
  "RETURN_SUPPLIER",
] as const;

export const EXCEL_IMPORT_DEPARTMENTS = [
  "STORE",
  "KITCHEN",
  "BAR",
  "HOUSE_KEEPING_ROOM",
  "HOUSE_KEEPING_PUBLIC",
  "SECURITY",
  "MAINTENANCE",
  "FINANCE",
  "HR",
  "GM",
  "FB_SERVICE",
  "STAFF",
] as const;

export type ExcelImportKind =
  | "item_registration"
  | "purchase_request"
  | "stockout_request";

export type ExcelImportColumn = {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
  /** When set, the cell must be one of these values (Excel "selector" fields). */
  options?: readonly string[];
};

export type ExcelImportDefinition = {
  kind: ExcelImportKind;
  title: string;
  description: string;
  /** Subscription module that unlocks this importer. */
  requiredModule: "Inventory";
  /**
   * When true, only lodging business types (Hotel / Resort / Pension).
   * Café & Restaurant never sees these formats.
   */
  lodgingOnly?: boolean;
  sheetName: string;
  fileBase: string;
  columns: ExcelImportColumn[];
  sampleRows: Record<string, string | number | boolean>[];
};

export const EXCEL_IMPORT_DEFINITIONS: ExcelImportDefinition[] = [
  {
    kind: "item_registration",
    title: "Item registration",
    description:
      "Seed on-hand stock from the property’s existing register.",
    requiredModule: "Inventory",
    sheetName: "Item_registration",
    fileBase: "hotcol-sample-item-registration",
    columns: [
      { key: "name", label: "Item name", required: true },
      {
        key: "category",
        label: "Category",
        required: true,
        options: EXCEL_IMPORT_CATEGORIES,
        hint: EXCEL_IMPORT_CATEGORIES.join(" | "),
      },
      { key: "amount", label: "Quantity", required: true },
      {
        key: "measuredBy",
        label: "Unit",
        required: true,
        options: EXCEL_IMPORT_UNITS,
        hint: EXCEL_IMPORT_UNITS.join(" | "),
      },
      { key: "unitPrice", label: "Unit price (ETB)", required: true },
      {
        key: "registrationDate",
        label: "Registration date",
        required: true,
        hint: "YYYY-MM-DD",
      },
      {
        key: "expireDate",
        label: "Expire date",
        required: true,
        hint: "YYYY-MM-DD",
      },
      { key: "supplierName", label: "Supplier name", required: true },
      { key: "supplierPhone", label: "Supplier phone", required: false },
      { key: "Address", label: "Supplier address", required: true },
      {
        key: "purchaseWithVat",
        label: "Purchase with VAT",
        required: false,
        options: ["TRUE", "FALSE"],
        hint: "TRUE or FALSE",
      },
      { key: "supplierTinNumber", label: "Supplier TIN", required: false },
      { key: "paidAmount", label: "Paid amount (ETB)", required: true },
      {
        key: "imageUrl",
        label: "Image URL",
        required: false,
        hint: "Optional. Leave blank for placeholder, or paste a public image link",
      },
      {
        key: "receivedByDepartment",
        label: "Received by department",
        required: false,
        options: ["STORE", "KITCHEN", "BAR"],
        hint: "STORE | KITCHEN | BAR (defaults to STORE)",
      },
    ],
    sampleRows: [
      {
        name: "Cooking oil",
        category: "Food",
        amount: 20,
        measuredBy: "Litre",
        unitPrice: 250,
        registrationDate: "2026-01-15",
        expireDate: "2027-01-15",
        supplierName: "Addis Wholesale",
        supplierPhone: "+251911000001",
        Address: "Merkato, Addis Ababa",
        purchaseWithVat: true,
        supplierTinNumber: "0000000000",
        paidAmount: 5000,
        imageUrl: "",
        receivedByDepartment: "STORE",
      },
      {
        name: "Bath towels",
        category: "House Keeping",
        amount: 40,
        measuredBy: "Piece",
        unitPrice: 180,
        registrationDate: "2026-02-01",
        expireDate: "2030-01-01",
        supplierName: "Linen Supply PLC",
        supplierPhone: "+251911000002",
        Address: "Bole, Addis Ababa",
        purchaseWithVat: false,
        supplierTinNumber: "",
        paidAmount: 7200,
        imageUrl: "",
        receivedByDepartment: "STORE",
      },
      {
        name: "Bottled water",
        category: "Beverage",
        amount: 120,
        measuredBy: "Piece",
        unitPrice: 25,
        registrationDate: "2026-02-10",
        expireDate: "2026-12-31",
        supplierName: "Beverage Hub",
        supplierPhone: "+251911000003",
        Address: "Kazanchis, Addis Ababa",
        purchaseWithVat: true,
        supplierTinNumber: "1111111111",
        paidAmount: 3000,
        imageUrl: "",
        receivedByDepartment: "BAR",
      },
      {
        name: "Printer paper A4",
        category: "Office Supplies",
        amount: 15,
        measuredBy: "Packet",
        unitPrice: 420,
        registrationDate: "2026-02-12",
        expireDate: "2028-01-01",
        supplierName: "Office Mart",
        supplierPhone: "+251911000004",
        Address: "Piassa, Addis Ababa",
        purchaseWithVat: false,
        supplierTinNumber: "",
        paidAmount: 6300,
        imageUrl: "",
        receivedByDepartment: "STORE",
      },
      {
        name: "Dish soap",
        category: "Maintenance",
        amount: 8,
        measuredBy: "Litre",
        unitPrice: 95,
        registrationDate: "2026-02-15",
        expireDate: "2027-06-01",
        supplierName: "CleanPro",
        supplierPhone: "+251911000005",
        Address: "CMC, Addis Ababa",
        purchaseWithVat: true,
        supplierTinNumber: "2222222222",
        paidAmount: 760,
        imageUrl: "",
        receivedByDepartment: "KITCHEN",
      },
    ],
  },
  {
    kind: "purchase_request",
    title: "Purchase request",
    description:
      "Seed purchase lines the property already tracked outside Hotcol.",
    requiredModule: "Inventory",
    lodgingOnly: true,
    sheetName: "Purchase_request",
    fileBase: "hotcol-sample-purchase-request",
    columns: [
      { key: "itemName", label: "Item name", required: true },
      { key: "quantity", label: "Quantity", required: true },
      {
        key: "measuredBy",
        label: "Unit",
        required: true,
        options: EXCEL_IMPORT_UNITS,
        hint: EXCEL_IMPORT_UNITS.join(" | "),
      },
      {
        key: "entranceDate",
        label: "Entrance date",
        required: true,
        hint: "YYYY-MM-DD",
      },
      { key: "notes", label: "Notes", required: false },
      {
        key: "estimatedUnitPrice",
        label: "Estimated unit price (ETB)",
        required: true,
      },
      { key: "supplierName", label: "Supplier name", required: true },
      { key: "supplierPhone", label: "Supplier phone", required: true },
      {
        key: "category",
        label: "Category",
        required: true,
        options: EXCEL_IMPORT_CATEGORIES,
        hint: EXCEL_IMPORT_CATEGORIES.join(" | "),
      },
      {
        key: "purchaseWithVat",
        label: "Purchase with VAT",
        required: true,
        options: ["TRUE", "FALSE"],
        hint: "TRUE or FALSE",
      },
      {
        key: "requestedByDepartment",
        label: "Requested by department",
        required: true,
        options: EXCEL_IMPORT_DEPARTMENTS,
        hint: EXCEL_IMPORT_DEPARTMENTS.join(" | "),
      },
    ],
    sampleRows: [
      {
        itemName: "Rice 25kg",
        quantity: 10,
        measuredBy: "Packet",
        entranceDate: "2026-03-01",
        notes: "Onboarding seed from prior Excel",
        estimatedUnitPrice: 2200,
        supplierName: "Grain Traders",
        supplierPhone: "+251911000010",
        category: "Food",
        purchaseWithVat: true,
        requestedByDepartment: "KITCHEN",
      },
      {
        itemName: "Mineral water",
        quantity: 100,
        measuredBy: "Piece",
        entranceDate: "2026-03-02",
        notes: "",
        estimatedUnitPrice: 25,
        supplierName: "Beverage Hub",
        supplierPhone: "+251911000011",
        category: "Beverage",
        purchaseWithVat: false,
        requestedByDepartment: "BAR",
      },
    ],
  },
  {
    kind: "stockout_request",
    title: "Stock-out request",
    description:
      "Seed stock movements. Matching registrations debit stock; unknown names to non-STORE go to Fresh Bazaar.",
    requiredModule: "Inventory",
    sheetName: "Stockout_request",
    fileBase: "hotcol-sample-stockout-request",
    columns: [
      {
        key: "itemRegistrationId",
        label: "Item registration ID",
        required: false,
        hint: "Optional when the item already exists in Hotcol",
      },
      {
        key: "itemName",
        label: "Item name",
        required: true,
        hint: "Must match a registration, or (non-STORE) saves as Fresh Bazaar",
      },
      {
        key: "movementType",
        label: "Movement type",
        required: true,
        options: EXCEL_IMPORT_MOVEMENT_TYPES,
        hint: EXCEL_IMPORT_MOVEMENT_TYPES.join(" | "),
      },
      { key: "amount", label: "Quantity", required: true },
      {
        key: "stakeHolderOrReason",
        label: "Stakeholder / reason",
        required: true,
      },
      {
        key: "movementDate",
        label: "Movement date",
        required: true,
        hint: "YYYY-MM-DD",
      },
      {
        key: "requestedByDepartment",
        label: "Requested by department",
        required: true,
        options: EXCEL_IMPORT_DEPARTMENTS,
        hint:
          EXCEL_IMPORT_DEPARTMENTS.join(" | ") +
          " · STORE requires an existing registration; other depts can create Fresh Bazaar",
      },
    ],
    sampleRows: [
      {
        itemRegistrationId: "",
        itemName: "Cooking oil",
        movementType: "STOCK_OUT",
        amount: 2,
        stakeHolderOrReason: "Kitchen service",
        movementDate: "2026-03-05",
        requestedByDepartment: "KITCHEN",
      },
      {
        itemRegistrationId: "",
        itemName: "Fresh tomatoes",
        movementType: "STOCK_OUT",
        amount: 5,
        stakeHolderOrReason: "Kitchen market buy",
        movementDate: "2026-03-06",
        requestedByDepartment: "KITCHEN",
      },
    ],
  },
];

export function getExcelImportDefinition(
  kind: ExcelImportKind,
): ExcelImportDefinition {
  const def = EXCEL_IMPORT_DEFINITIONS.find((d) => d.kind === kind);
  if (!def) throw new Error(`Unknown excel import kind: ${kind}`);
  return def;
}

export function tenantHasModule(
  modules: string[] | null | undefined,
  required: string,
): boolean {
  const list = (modules ?? []).map((m) => String(m).trim());
  // Require an explicit Inventory module so ops do not import into the wrong mix.
  if (list.length === 0) return false;
  return list.includes(required);
}

export function isLodgingBusinessTypeKey(
  businessType: string | null | undefined,
): boolean {
  const bt = String(businessType ?? "").trim();
  return bt === "Hotel" || bt === "Resort" || bt === "Pension";
}

/** Importers visible for this tenant's business type + subscribed modules. */
export function excelImportsForTenant(input: {
  businessType?: string | null | undefined;
  modules: string[] | null | undefined;
}): ExcelImportDefinition[] {
  const lodging = isLodgingBusinessTypeKey(input.businessType);
  return EXCEL_IMPORT_DEFINITIONS.filter((def) => {
    if (def.lodgingOnly && !lodging) return false;
    return tenantHasModule(input.modules, def.requiredModule);
  });
}
