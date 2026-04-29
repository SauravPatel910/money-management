import type {
  Account,
  MoneyTransaction,
  TransactionCategory,
  TransactionInput,
  TransactionType,
} from "@/types/money";
import { sortTransactionsChronologically, toAmount } from "./moneyCalculations.ts";

export type CategoryBreakdownItem = {
  categoryId: string;
  categoryName: string;
  income: number;
  expense: number;
};

export type MonthlyCashflowItem = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type BalanceTrendItem = {
  date: string;
  balance: number;
};

export type TypeMixItem = {
  type: TransactionType;
  count: number;
  amount: number;
};

export type ReportFilters = {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType | "all";
  accountId?: string;
  categoryId?: string;
  subcategoryId?: string;
};

export type ReportSummary = {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  totalBalance: number;
  transactionCount: number;
};

export type ImportRowStatus = "valid" | "duplicate" | "error";

export type TransactionImportPreviewRow = {
  rowNumber: number;
  source: Record<string, string | number>;
  transaction?: TransactionInput;
  status: ImportRowStatus;
  errors: string[];
  duplicateKey?: string;
  include: boolean;
};

export const TRANSACTION_IMPORT_HEADERS = [
  "type",
  "amount",
  "transactionDate",
  "transactionTime",
  "account",
  "from",
  "to",
  "direction",
  "person",
  "category",
  "subcategory",
  "note",
] as const;

const getTransactionImpact = (transaction: MoneyTransaction) => {
  const amount = toAmount(transaction.amount);

  if (transaction.type === "income") {
    return { income: amount, expense: 0 };
  }

  if (transaction.type === "expense") {
    return { income: 0, expense: amount };
  }

  if (transaction.type === "person") {
    return transaction.direction === "from"
      ? { income: amount, expense: 0 }
      : { income: 0, expense: amount };
  }

  return { income: 0, expense: 0 };
};

const normalizeLookupValue = (value?: string | null) =>
  (value || "").trim().toLowerCase();

const getTransactionAccountIds = (transaction: MoneyTransaction) => [
  transaction.account || "",
  transaction.from || "",
  transaction.to || "",
];

export const filterTransactionsForReport = (
  transactions: MoneyTransaction[],
  filters: ReportFilters,
) =>
  transactions.filter((transaction) => {
    if (filters.dateFrom && transaction.transactionDate < filters.dateFrom) {
      return false;
    }

    if (filters.dateTo && transaction.transactionDate > filters.dateTo) {
      return false;
    }

    if (filters.type && filters.type !== "all" && transaction.type !== filters.type) {
      return false;
    }

    if (
      filters.accountId &&
      !getTransactionAccountIds(transaction).includes(filters.accountId)
    ) {
      return false;
    }

    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }

    if (
      filters.subcategoryId &&
      transaction.subcategoryId !== filters.subcategoryId
    ) {
      return false;
    }

    return true;
  });

export const buildReportSummary = (
  transactions: MoneyTransaction[],
  accounts: Account[],
): ReportSummary => {
  const totals = transactions.reduce(
    (summary, transaction) => {
      const impact = getTransactionImpact(transaction);
      summary.totalIncome += impact.income;
      summary.totalExpense += impact.expense;
      return summary;
    },
    { totalIncome: 0, totalExpense: 0 },
  );

  return {
    ...totals,
    netCashflow: totals.totalIncome - totals.totalExpense,
    totalBalance: accounts.reduce(
      (sum, account) => sum + toAmount(account.balance),
      0,
    ),
    transactionCount: transactions.length,
  };
};

export const buildCategoryBreakdown = (
  transactions: MoneyTransaction[],
): CategoryBreakdownItem[] => {
  const breakdown = new Map<string, CategoryBreakdownItem>();

  transactions.forEach((transaction) => {
    if (transaction.type !== "income" && transaction.type !== "expense") {
      return;
    }

    const categoryId = transaction.categoryId || "uncategorized";
    const existing = breakdown.get(categoryId) || {
      categoryId,
      categoryName: transaction.category?.name || "Uncategorized",
      income: 0,
      expense: 0,
    };
    const amount = toAmount(transaction.amount);

    if (transaction.type === "income") {
      existing.income += amount;
    } else {
      existing.expense += amount;
    }

    breakdown.set(categoryId, existing);
  });

  return [...breakdown.values()].sort(
    (a, b) => b.income + b.expense - (a.income + a.expense),
  );
};

export const buildMonthlyCashflow = (
  transactions: MoneyTransaction[],
): MonthlyCashflowItem[] => {
  const months = new Map<string, MonthlyCashflowItem>();

  transactions.forEach((transaction) => {
    const month = transaction.transactionDate.slice(0, 7);
    const existing = months.get(month) || {
      month,
      income: 0,
      expense: 0,
      net: 0,
    };
    const impact = getTransactionImpact(transaction);

    existing.income += impact.income;
    existing.expense += impact.expense;
    existing.net = existing.income - existing.expense;
    months.set(month, existing);
  });

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
};

export const buildBalanceTrend = (
  transactions: MoneyTransaction[],
): BalanceTrendItem[] =>
  sortTransactionsChronologically(transactions).map((transaction) => ({
    date: transaction.transactionDate,
    balance: toAmount(transaction.totalBalance),
  }));

export const buildTransactionTypeMix = (
  transactions: MoneyTransaction[],
): TypeMixItem[] => {
  const order: TransactionType[] = ["income", "expense", "transfer", "person"];
  const mix = new Map<TransactionType, TypeMixItem>(
    order.map((type) => [type, { type, count: 0, amount: 0 }]),
  );

  transactions.forEach((transaction) => {
    const current = mix.get(transaction.type);
    if (!current) {
      return;
    }

    current.count += 1;
    current.amount += toAmount(transaction.amount);
  });

  return order.map((type) => mix.get(type) as TypeMixItem);
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const rowsToCsv = (
  headers: string[],
  rows: Array<Record<string, string | number | null | undefined>>,
) => [
  headers.map(escapeCsvValue).join(","),
  ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
].join("\r\n");

export const transactionsToCsv = (
  transactions: MoneyTransaction[],
  accounts: Account[],
) => {
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const headers = [
    "transactionDate",
    "transactionTime",
    "entryDate",
    "entryTime",
    "type",
    "amount",
    "account",
    "from",
    "to",
    "direction",
    "person",
    "category",
    "subcategory",
    "note",
    "totalBalance",
  ];

  return rowsToCsv(
    headers,
    transactions.map((transaction) => ({
      transactionDate: transaction.transactionDate,
      transactionTime: transaction.transactionTime || "",
      entryDate: transaction.entryDate,
      entryTime: transaction.entryTime || "",
      type: transaction.type,
      amount: transaction.amount,
      account: transaction.account ? accountNames.get(transaction.account) || transaction.account : "",
      from: transaction.from ? accountNames.get(transaction.from) || transaction.from : "",
      to: transaction.to ? accountNames.get(transaction.to) || transaction.to : "",
      direction: transaction.direction || "",
      person: transaction.person || "",
      category: transaction.category?.name || "",
      subcategory: transaction.subcategory?.name || "",
      note: transaction.note || "",
      totalBalance: transaction.totalBalance || 0,
    })),
  );
};

export const reportSummaryToCsv = (
  summary: ReportSummary,
  categoryBreakdown: CategoryBreakdownItem[],
  monthlyCashflow: MonthlyCashflowItem[],
) => {
  const rows = [
    { section: "summary", label: "Total income", income: summary.totalIncome, expense: "", net: "" },
    { section: "summary", label: "Total expense", income: "", expense: summary.totalExpense, net: "" },
    { section: "summary", label: "Net cashflow", income: "", expense: "", net: summary.netCashflow },
    { section: "summary", label: "Total balance", income: "", expense: "", net: summary.totalBalance },
    ...categoryBreakdown.map((item) => ({
      section: "category",
      label: item.categoryName,
      income: item.income,
      expense: item.expense,
      net: item.income - item.expense,
    })),
    ...monthlyCashflow.map((item) => ({
      section: "month",
      label: item.month,
      income: item.income,
      expense: item.expense,
      net: item.net,
    })),
  ];

  return rowsToCsv(["section", "label", "income", "expense", "net"], rows);
};

export const buildTransactionDuplicateKey = (
  transaction: Pick<
    MoneyTransaction | TransactionInput,
    | "type"
    | "amount"
    | "account"
    | "from"
    | "to"
    | "direction"
    | "person"
    | "categoryId"
    | "subcategoryId"
    | "note"
    | "transactionDate"
    | "transactionTime"
  >,
) =>
  [
    transaction.transactionDate || "",
    transaction.transactionTime || "",
    transaction.type || "",
    toAmount(transaction.amount).toFixed(2),
    transaction.account || "",
    transaction.from || "",
    transaction.to || "",
    transaction.direction || "",
    normalizeLookupValue(transaction.person),
    transaction.categoryId || "",
    transaction.subcategoryId || "",
    normalizeLookupValue(transaction.note),
  ].join("|");

export const buildImportTemplateCsv = () =>
  rowsToCsv([...TRANSACTION_IMPORT_HEADERS], [
    {
      type: "expense",
      amount: 250,
      transactionDate: "2026-04-29",
      transactionTime: "18:30",
      account: "Cash",
      from: "",
      to: "",
      direction: "",
      person: "",
      category: "Uncategorized",
      subcategory: "",
      note: "Sample expense",
    },
  ]);

const getImportCell = (
  row: Record<string, string | number>,
  header: string,
) => {
  const matchedKey = Object.keys(row).find(
    (key) => normalizeLookupValue(key) === normalizeLookupValue(header),
  );
  const value = matchedKey ? row[matchedKey] : "";
  return typeof value === "number" ? String(value) : String(value || "").trim();
};

const normalizeImportDate = (value: string) => {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
};

const normalizeImportTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "00:00";
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const findAccountId = (accounts: Account[], value: string) => {
  const normalized = normalizeLookupValue(value);
  return accounts.find(
    (account) =>
      normalizeLookupValue(account.id) === normalized ||
      normalizeLookupValue(account.name) === normalized,
  )?.id;
};

const findCategoryId = (
  categories: TransactionCategory[],
  value: string,
  type: TransactionType,
  parentId: string | null,
) => {
  const normalized = normalizeLookupValue(value);
  if (!normalized) {
    return "";
  }

  return categories.find(
    (category) =>
      category.type === type &&
      (category.parentId || null) === parentId &&
      (normalizeLookupValue(category.id) === normalized ||
        normalizeLookupValue(category.name) === normalized),
  )?.id;
};

export const buildImportPreviewRows = ({
  rows,
  accounts,
  categories,
  existingTransactions,
}: {
  rows: Array<Record<string, string | number>>;
  accounts: Account[];
  categories: TransactionCategory[];
  existingTransactions: MoneyTransaction[];
}): TransactionImportPreviewRow[] => {
  const existingKeys = new Set(
    existingTransactions.map((transaction) =>
      buildTransactionDuplicateKey(transaction),
    ),
  );
  const previewKeys = new Set<string>();

  return rows.map((row, index) => {
    const errors: string[] = [];
    const type = getImportCell(row, "type").toLowerCase() as TransactionType;
    const amount = toAmount(getImportCell(row, "amount"));
    const transactionDate = normalizeImportDate(getImportCell(row, "transactionDate"));
    const transactionTime = normalizeImportTime(getImportCell(row, "transactionTime"));
    const note = getImportCell(row, "note");
    const person = getImportCell(row, "person");
    const direction = getImportCell(row, "direction").toLowerCase();

    if (!["income", "expense", "transfer", "person"].includes(type)) {
      errors.push("Unsupported transaction type");
    }
    if (amount <= 0) errors.push("Amount must be greater than 0");
    if (!transactionDate) errors.push("Transaction date is invalid");
    if (!transactionTime) errors.push("Transaction time is invalid");

    const account = findAccountId(accounts, getImportCell(row, "account"));
    const from = findAccountId(accounts, getImportCell(row, "from"));
    const to = findAccountId(accounts, getImportCell(row, "to"));

    if ((type === "income" || type === "expense") && !account) {
      errors.push("Account is required and must match an existing account");
    }
    if (type === "transfer") {
      if (!from) errors.push("From account must match an existing account");
      if (!to) errors.push("To account must match an existing account");
      if (from && to && from === to) {
        errors.push("From and to accounts must be different");
      }
    }
    if (type === "person") {
      if (!account) errors.push("Account is required and must match an existing account");
      if (!person) errors.push("Person is required");
      if (direction !== "to" && direction !== "from") {
        errors.push("Direction must be to or from");
      }
    }

    const categoryId = findCategoryId(
      categories,
      getImportCell(row, "category"),
      type,
      null,
    );
    if (!categoryId) {
      errors.push("Category is required and must match an existing top-level category");
    }

    const subcategoryValue = getImportCell(row, "subcategory");
    const subcategoryId = subcategoryValue
      ? findCategoryId(categories, subcategoryValue, type, categoryId || null)
      : "";
    if (subcategoryValue && !subcategoryId) {
      errors.push("Subcategory must match an existing child category");
    }

    const transaction: TransactionInput = {
      type,
      amount,
      account: account || undefined,
      from: from || undefined,
      to: to || undefined,
      direction: direction === "to" || direction === "from" ? direction : undefined,
      person: person || undefined,
      note,
      categoryId,
      subcategoryId,
      transactionDate,
      transactionTime,
      entryDate: transactionDate,
      entryTime: transactionTime,
    };
    const duplicateKey = buildTransactionDuplicateKey(transaction);
    const isDuplicate =
      existingKeys.has(duplicateKey) || previewKeys.has(duplicateKey);
    previewKeys.add(duplicateKey);
    const status: ImportRowStatus =
      errors.length > 0 ? "error" : isDuplicate ? "duplicate" : "valid";

    return {
      rowNumber: index + 2,
      source: row,
      transaction: errors.length > 0 ? undefined : transaction,
      status,
      errors,
      duplicateKey,
      include: status === "valid",
    };
  });
};
