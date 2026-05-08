export const FEATURE_DEFINITIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "accounts", label: "Account Management" },
  { key: "categories", label: "Categories" },
  { key: "transactions", label: "Transaction History" },
  { key: "reports", label: "Reports" },
  { key: "budgets", label: "Budgets" },
  { key: "spreadsheetImport", label: "Spreadsheet Import" },
  { key: "bankStatementOcr", label: "Bank Statement OCR Import" },
  { key: "exports", label: "CSV/XLSX Exports" },
  { key: "recurringBills", label: "Recurring Bills" },
] as const;

export type FeatureKey = (typeof FEATURE_DEFINITIONS)[number]["key"];

export type FeatureFlag = {
  key: FeatureKey;
  label: string;
  enabled: boolean;
};

export type FeatureFlagsByKey = Record<FeatureKey, boolean>;

export const DEFAULT_FEATURE_FLAGS = FEATURE_DEFINITIONS.reduce(
  (flags, feature) => ({
    ...flags,
    [feature.key]: true,
  }),
  {} as FeatureFlagsByKey,
);

export const isFeatureKey = (value: string): value is FeatureKey =>
  FEATURE_DEFINITIONS.some((feature) => feature.key === value);

export const featureFlagsToRecord = (
  flags: FeatureFlag[],
): FeatureFlagsByKey => ({
  ...DEFAULT_FEATURE_FLAGS,
  ...Object.fromEntries(flags.map((flag) => [flag.key, flag.enabled])),
});
