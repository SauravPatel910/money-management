import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import type {
  Account,
  AccountInput,
  Budget,
  BudgetInput,
  MoneyTransaction,
  RecurringBill,
  RecurringBillFrequency,
  RecurringBillInput,
  RecurringBillPayment,
  TransactionCategory,
  TransactionCategoryInput,
  TransactionCategorySummary,
  TransactionEditChangedField,
  TransactionEditHistory,
  TransactionEditSnapshot,
  TransactionInput,
  TransactionType,
} from "@/types/money";
import { recalculateBalances, toAmount } from "@/lib/moneyCalculations";
import {
  RECURRING_BILL_FREQUENCIES,
  advanceRecurringBillDueDate,
  recurringBillToTransactionInput,
} from "@/lib/recurringBills";

type PrismaClientOrTransaction = typeof prisma | Prisma.TransactionClient;
type DbTransaction = Awaited<
  ReturnType<PrismaClientOrTransaction["transaction"]["findUniqueOrThrow"]>
>;

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "cash", name: "Cash", balance: 0, icon: "cash" },
  { id: "bank", name: "Primary Bank", balance: 0, icon: "bank" },
];
const SUPPORTED_TRANSACTION_TYPES: TransactionType[] = [
  "income",
  "expense",
  "transfer",
  "person",
];
const DEFAULT_BILL_REMINDER_DAYS = 3;
const FALLBACK_CATEGORY_NAME = "Uncategorized";
const MONEY_TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 30000,
};
const AUDITED_TRANSACTION_FIELDS: Array<keyof TransactionInput> = [
  "type",
  "amount",
  "account",
  "from",
  "to",
  "direction",
  "person",
  "note",
  "categoryId",
  "subcategoryId",
  "transactionDate",
  "transactionTime",
  "entryDate",
  "entryTime",
];

const toDate = (value?: string | null, time?: string | null) => {
  const dateValue = value || new Date().toISOString().slice(0, 10);
  const timeValue = (time || "00:00").slice(0, 5);
  return new Date(`${dateValue}T${timeValue}:00.000Z`);
};

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);
const toTimeInputValue = (value: Date) => value.toISOString().slice(11, 16);

const accountFromDb = (account: {
  id: string;
  name: string;
  owner: string | null;
  balance: Prisma.Decimal;
  icon: string;
}): Account => ({
  id: account.id,
  name: account.name,
  owner: account.owner,
  balance: account.balance.toNumber(),
  icon: account.icon,
});

const categoryFromDb = (category: {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
  isSystem: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}): TransactionCategory => ({
  id: category.id,
  type: category.type as TransactionType,
  name: category.name,
  parentId: category.parentId,
  isSystem: category.isSystem,
  sortOrder: category.sortOrder,
  createdAt: category.createdAt?.toISOString(),
  updatedAt: category.updatedAt?.toISOString(),
});

const categorySummaryFromDb = (
  category?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null,
): TransactionCategorySummary | null =>
  category
    ? {
        id: category.id,
        type: category.type as TransactionType,
        name: category.name,
        parentId: category.parentId,
        isSystem: category.isSystem,
      }
    : null;

const transactionFromDb = (transaction: {
  id: string;
  type: string;
  amount: Prisma.Decimal;
  account: string | null;
  from: string | null;
  to: string | null;
  direction: string | null;
  person: string | null;
  note: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  category?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null;
  subcategory?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null;
  transactionDate: Date;
  entryDate: Date;
  accountBalances: Prisma.JsonValue | null;
  totalBalance: Prisma.Decimal;
}): MoneyTransaction => ({
  id: transaction.id,
  type: transaction.type as MoneyTransaction["type"],
  amount: transaction.amount.toNumber(),
  account: transaction.account,
  from: transaction.from,
  to: transaction.to,
  direction: transaction.direction as MoneyTransaction["direction"],
  person: transaction.person,
  note: transaction.note,
  categoryId: transaction.categoryId,
  subcategoryId: transaction.subcategoryId,
  category: categorySummaryFromDb(transaction.category),
  subcategory: categorySummaryFromDb(transaction.subcategory),
  transactionDate: toDateInputValue(transaction.transactionDate),
  transactionTime: toTimeInputValue(transaction.transactionDate),
  entryDate: toDateInputValue(transaction.entryDate),
  entryTime: toTimeInputValue(transaction.entryDate),
  accountBalances: (transaction.accountBalances ?? {}) as Record<string, number>,
  totalBalance: transaction.totalBalance.toNumber(),
});

const normalizeTransactionInput = (transaction: TransactionInput) => ({
  type: transaction.type,
  amount: new Prisma.Decimal(toAmount(transaction.amount)),
  account: transaction.account || null,
  from: transaction.from || null,
  to: transaction.to || null,
  direction: transaction.direction || null,
  person: transaction.person || null,
  note: transaction.note || null,
  categoryId: transaction.categoryId || null,
  subcategoryId: transaction.subcategoryId || null,
  transactionDate: toDate(
    transaction.transactionDate,
    transaction.transactionTime,
  ),
  entryDate: toDate(transaction.entryDate, transaction.entryTime),
});

const dbTransactionToInput = (transaction: DbTransaction): TransactionInput => ({
  type: transaction.type as TransactionType,
  amount: transaction.amount.toNumber(),
  account: transaction.account,
  from: transaction.from,
  to: transaction.to,
  direction: transaction.direction as MoneyTransaction["direction"],
  person: transaction.person,
  note: transaction.note,
  categoryId: transaction.categoryId,
  subcategoryId: transaction.subcategoryId,
  transactionDate: toDateInputValue(transaction.transactionDate),
  transactionTime: toTimeInputValue(transaction.transactionDate),
  entryDate: toDateInputValue(transaction.entryDate),
  entryTime: toTimeInputValue(transaction.entryDate),
});

const transactionEditHistoryFromDb = (history: {
  id: string;
  transactionId: string;
  editedAt: Date;
  beforeSnapshot: Prisma.JsonValue;
  afterSnapshot: Prisma.JsonValue;
  changedFields: Prisma.JsonValue;
}): TransactionEditHistory => ({
  id: history.id,
  transactionId: history.transactionId,
  editedAt: history.editedAt.toISOString(),
  before: history.beforeSnapshot as TransactionEditSnapshot,
  after: history.afterSnapshot as TransactionEditSnapshot,
  changedFields: history.changedFields as TransactionEditChangedField[],
});

const budgetFromDb = (budget: {
  id: string;
  month: string;
  categoryId: string;
  subcategoryId: string | null;
  limitAmount: Prisma.Decimal;
  alertThreshold: number;
  category?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null;
  subcategory?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
}): Budget => ({
  id: budget.id,
  month: budget.month,
  categoryId: budget.categoryId,
  subcategoryId: budget.subcategoryId,
  limitAmount: budget.limitAmount.toNumber(),
  alertThreshold: budget.alertThreshold,
  category: categorySummaryFromDb(budget.category),
  subcategory: categorySummaryFromDb(budget.subcategory),
  createdAt: budget.createdAt?.toISOString(),
  updatedAt: budget.updatedAt?.toISOString(),
});

const recurringBillPaymentFromDb = (payment: {
  id: string;
  billId: string;
  transactionId: string;
  occurrenceDate: Date;
  paidAt: Date;
}): RecurringBillPayment => ({
  id: payment.id,
  billId: payment.billId,
  transactionId: payment.transactionId,
  occurrenceDate: toDateInputValue(payment.occurrenceDate),
  paidAt: payment.paidAt.toISOString(),
});

const recurringBillFromDb = (bill: {
  id: string;
  name: string;
  amount: Prisma.Decimal;
  account: string;
  categoryId: string;
  subcategoryId: string | null;
  frequency: string;
  nextDueDate: Date;
  reminderDays: number;
  active: boolean;
  category?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null;
  subcategory?: {
    id: string;
    type: string;
    name: string;
    parentId: string | null;
    isSystem: boolean;
  } | null;
  payments?: Array<{
    id: string;
    billId: string;
    transactionId: string;
    occurrenceDate: Date;
    paidAt: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}): RecurringBill => ({
  id: bill.id,
  name: bill.name,
  amount: bill.amount.toNumber(),
  account: bill.account,
  categoryId: bill.categoryId,
  subcategoryId: bill.subcategoryId,
  frequency: bill.frequency as RecurringBillFrequency,
  nextDueDate: toDateInputValue(bill.nextDueDate),
  reminderDays: bill.reminderDays,
  active: bill.active,
  category: categorySummaryFromDb(bill.category),
  subcategory: categorySummaryFromDb(bill.subcategory),
  payments: bill.payments?.map(recurringBillPaymentFromDb),
  createdAt: bill.createdAt?.toISOString(),
  updatedAt: bill.updatedAt?.toISOString(),
});

const toSnapshotValue = (value: TransactionInput[keyof TransactionInput]) =>
  value ?? null;

const getChangedFields = (
  before: TransactionEditSnapshot,
  after: TransactionEditSnapshot,
): TransactionEditChangedField[] =>
  AUDITED_TRANSACTION_FIELDS.flatMap((field) => {
    const beforeValue = toSnapshotValue(before[field]);
    const afterValue = toSnapshotValue(after[field]);

    if (Object.is(beforeValue, afterValue)) {
      return [];
    }

    return [
      {
        field,
        before: beforeValue,
        after: afterValue,
      },
    ];
  });

const trimField = (value?: string | null) => value?.trim() || "";

const validateBudgetInput = (budget: Partial<BudgetInput>) => {
  if (budget.limitAmount !== undefined && toAmount(budget.limitAmount) <= 0) {
    throw new Error("Budget limit must be greater than 0");
  }

  if (
    budget.alertThreshold !== undefined &&
    (!Number.isInteger(budget.alertThreshold) ||
      budget.alertThreshold < 1 ||
      budget.alertThreshold > 100)
  ) {
    throw new Error("Budget alert threshold must be between 1 and 100");
  }
};

const validateRecurringBillInput = (bill: Partial<RecurringBillInput>) => {
  if (bill.name !== undefined && !trimField(bill.name)) {
    throw new Error("Recurring bill name is required");
  }
  if (bill.amount !== undefined && toAmount(bill.amount) <= 0) {
    throw new Error("Recurring bill amount must be greater than 0");
  }
  if (
    bill.frequency !== undefined &&
    !RECURRING_BILL_FREQUENCIES.includes(bill.frequency)
  ) {
    throw new Error("Recurring bill frequency is not supported");
  }
  if (
    bill.reminderDays !== undefined &&
    (!Number.isInteger(bill.reminderDays) ||
      bill.reminderDays < 0 ||
      bill.reminderDays > 365)
  ) {
    throw new Error("Recurring bill reminder days must be between 0 and 365");
  }
};

async function validateBudgetCategoryOwnership(
  client: PrismaClientOrTransaction,
  userId: string,
  budget: Partial<BudgetInput>,
) {
  const categoryId = trimField(budget.categoryId);
  const subcategoryId = trimField(budget.subcategoryId);

  if (!categoryId) {
    throw new Error("Budget category is required");
  }

  const category = await client.transactionCategory.findFirst({
    where: {
      id: categoryId,
      userId,
      type: "expense",
      parentId: null,
    },
  });

  if (!category) {
    throw new Error("Budget category must be an expense category");
  }

  if (!subcategoryId) {
    return;
  }

  const subcategory = await client.transactionCategory.findFirst({
    where: {
      id: subcategoryId,
      userId,
      type: "expense",
      parentId: category.id,
    },
  });

  if (!subcategory) {
    throw new Error("Budget subcategory is not valid");
  }
}

async function validateRecurringBillOwnership(
  client: PrismaClientOrTransaction,
  userId: string,
  bill: Partial<RecurringBillInput>,
) {
  const account = trimField(bill.account);
  const categoryId = trimField(bill.categoryId);
  const subcategoryId = trimField(bill.subcategoryId);

  if (!account) {
    throw new Error("Recurring bill account is required");
  }
  const accountExists = await client.moneyAccount.findUnique({
    where: { userId_id: { userId, id: account } },
    select: { id: true },
  });
  if (!accountExists) {
    throw new Error("Recurring bill account is required");
  }

  if (!categoryId) {
    throw new Error("Recurring bill category is required");
  }
  const category = await client.transactionCategory.findFirst({
    where: {
      id: categoryId,
      userId,
      type: "expense",
      parentId: null,
    },
  });
  if (!category) {
    throw new Error("Recurring bill category must be an expense category");
  }

  if (!subcategoryId) {
    return;
  }
  const subcategory = await client.transactionCategory.findFirst({
    where: {
      id: subcategoryId,
      userId,
      type: "expense",
      parentId: category.id,
    },
  });
  if (!subcategory) {
    throw new Error("Recurring bill subcategory is not valid");
  }
}

async function ensureBudgetIsUnique(
  client: PrismaClientOrTransaction,
  userId: string,
  budget: BudgetInput,
  ignoreId?: string,
) {
  const existing = await client.budget.findFirst({
    where: {
      userId,
      month: budget.month,
      categoryId: budget.categoryId,
      subcategoryId: budget.subcategoryId || null,
      ...(ignoreId && { id: { not: ignoreId } }),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("A budget already exists for this month and category");
  }
}

async function ensureFallbackCategories(
  client: PrismaClientOrTransaction,
  userId: string,
) {
  await Promise.all(
    SUPPORTED_TRANSACTION_TYPES.map(async (type, index) => {
      const existing = await client.transactionCategory.findFirst({
        where: {
          userId,
          type,
          name: FALLBACK_CATEGORY_NAME,
          parentId: null,
        },
      });

      if (existing) {
        await client.transactionCategory.update({
          where: { id: existing.id },
          data: { isSystem: true },
        });
        return;
      }

      await client.transactionCategory.create({
        data: {
          userId,
          type,
          name: FALLBACK_CATEGORY_NAME,
          isSystem: true,
          sortOrder: index,
        },
      });
    }),
  );
}

async function getFallbackCategory(
  client: PrismaClientOrTransaction,
  userId: string,
  type: TransactionType,
) {
  await ensureFallbackCategories(client, userId);
  return client.transactionCategory.findFirstOrThrow({
    where: {
      userId,
      type,
      name: FALLBACK_CATEGORY_NAME,
      parentId: null,
      isSystem: true,
    },
  });
}

async function backfillMissingTransactionCategories(
  client: PrismaClientOrTransaction,
  userId: string,
) {
  await ensureFallbackCategories(client, userId);
  await Promise.all(
    SUPPORTED_TRANSACTION_TYPES.map(async (type) => {
      const fallback = await getFallbackCategory(client, userId, type);
      await client.transaction.updateMany({
        where: { userId, type, categoryId: null },
        data: { categoryId: fallback.id },
      });
    }),
  );
}

async function validateTransactionCategoryOwnership(
  client: PrismaClientOrTransaction,
  userId: string,
  transaction: TransactionInput,
) {
  const categoryId = trimField(transaction.categoryId);
  const subcategoryId = trimField(transaction.subcategoryId);

  if (!categoryId) {
    throw new Error("Category is required");
  }

  const category = await client.transactionCategory.findFirst({
    where: {
      id: categoryId,
      userId,
      type: transaction.type,
      parentId: null,
    },
  });

  if (!category) {
    throw new Error("Category is not valid for this transaction");
  }

  if (!subcategoryId) {
    return;
  }

  const subcategory = await client.transactionCategory.findFirst({
    where: {
      id: subcategoryId,
      userId,
      type: transaction.type,
      parentId: category.id,
    },
  });

  if (!subcategory) {
    throw new Error("Subcategory is not valid for this transaction");
  }
}

const validateTransactionInput = (transaction: TransactionInput) => {
  const amount = toAmount(transaction.amount);

  if (amount <= 0) {
    throw new Error("Transaction amount must be greater than 0");
  }

  if (!SUPPORTED_TRANSACTION_TYPES.includes(transaction.type)) {
    throw new Error("Unsupported transaction type");
  }

  if (transaction.type === "income" || transaction.type === "expense") {
    if (!trimField(transaction.account)) {
      throw new Error("Account is required for income and expense transactions");
    }
  }

  if (transaction.type === "transfer") {
    const from = trimField(transaction.from);
    const to = trimField(transaction.to);

    if (!from || !to) {
      throw new Error("From and to accounts are required for transfers");
    }

    if (from === to) {
      throw new Error("Transfer from and to accounts must be different");
    }
  }

  if (transaction.type === "person") {
    if (!trimField(transaction.account)) {
      throw new Error("Account is required for person transactions");
    }

    if (!trimField(transaction.person)) {
      throw new Error("Person name is required for person transactions");
    }

    if (transaction.direction !== "to" && transaction.direction !== "from") {
      throw new Error("Person transaction direction must be to or from");
    }
  }
};

export async function ensureDefaultAccounts(userId: string) {
  const accountCount = await prisma.moneyAccount.count({
    where: { userId },
  });

  if (accountCount === 0) {
    await prisma.moneyAccount.createMany({
      data: DEFAULT_ACCOUNTS.map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        icon: account.icon,
        userId,
      })),
      skipDuplicates: true,
    });
  }
}

export async function listCategories(userId: string) {
  await ensureFallbackCategories(prisma, userId);
  const categories = await prisma.transactionCategory.findMany({
    where: { userId },
    orderBy: [
      { type: "asc" },
      { parentId: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
  return categories.map(categoryFromDb);
}

export async function createCategory(
  userId: string,
  category: TransactionCategoryInput,
) {
  if (!trimField(category.name)) {
    throw new Error("Category name is required");
  }

  if (!SUPPORTED_TRANSACTION_TYPES.includes(category.type)) {
    throw new Error("Unsupported transaction type");
  }

  if (category.parentId) {
    const parent = await prisma.transactionCategory.findFirst({
      where: {
        id: category.parentId,
        userId,
        type: category.type,
        parentId: null,
      },
    });
    if (!parent) {
      throw new Error("Parent category is not valid");
    }
  }

  const created = await prisma.transactionCategory.create({
    data: {
      userId,
      type: category.type,
      name: category.name.trim(),
      parentId: category.parentId || null,
      sortOrder: category.sortOrder ?? 0,
    },
  });

  return categoryFromDb(created);
}

export async function updateCategory(
  userId: string,
  id: string,
  updates: Partial<TransactionCategoryInput>,
) {
  const existing = await prisma.transactionCategory.findFirstOrThrow({
    where: { id, userId },
  });
  const nextType = updates.type ?? (existing.type as TransactionType);
  const nextParentId =
    updates.parentId !== undefined
      ? updates.parentId || null
      : existing.parentId;

  if (nextParentId) {
    const parent = await prisma.transactionCategory.findFirst({
      where: {
        id: nextParentId,
        userId,
        type: nextType,
        parentId: null,
      },
    });
    if (!parent || parent.id === id) {
      throw new Error("Parent category is not valid");
    }
  }

  const updated = await prisma.transactionCategory.update({
    where: { id },
    data: {
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.parentId !== undefined && {
        parentId: updates.parentId || null,
      }),
      ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
    },
  });

  return categoryFromDb(updated);
}

export async function deleteCategory(userId: string, id: string) {
  const category = await prisma.transactionCategory.findFirstOrThrow({
    where: { id, userId },
  });

  if (category.isSystem) {
    throw new Error("System categories cannot be deleted");
  }

  const [childCount, transactionCount, recurringBillCount] = await Promise.all([
    prisma.transactionCategory.count({ where: { parentId: id, userId } }),
    prisma.transaction.count({
      where: {
        userId,
        OR: [{ categoryId: id }, { subcategoryId: id }],
      },
    }),
    prisma.recurringBill.count({
      where: {
        userId,
        OR: [{ categoryId: id }, { subcategoryId: id }],
      },
    }),
  ]);

  if (childCount > 0) {
    throw new Error("Cannot delete a category that has subcategories");
  }

  if (transactionCount > 0) {
    throw new Error("Cannot delete a category that has transactions");
  }

  if (recurringBillCount > 0) {
    throw new Error("Cannot delete a category that has recurring bills");
  }

  await prisma.transactionCategory.delete({ where: { id } });
  return id;
}

const listAccountsFromDb = async (
  client: PrismaClientOrTransaction,
  userId: string,
) => {
  const accounts = await client.moneyAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return accounts.map(accountFromDb);
};

export async function listAccounts(userId: string) {
  await ensureDefaultAccounts(userId);
  await ensureFallbackCategories(prisma, userId);
  return listAccountsFromDb(prisma, userId);
}

const listTransactionsFromDb = async (
  client: PrismaClientOrTransaction,
  userId: string,
) => {
  const transactions = await client.transaction.findMany({
    where: { userId },
    include: { category: true, subcategory: true },
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });

  return transactions.map(transactionFromDb);
};

export async function listTransactions(userId: string) {
  await backfillMissingTransactionCategories(prisma, userId);
  return listTransactionsFromDb(prisma, userId);
}

export async function listTransactionEditHistory(
  userId: string,
  transactionId: string,
) {
  const history = await prisma.transactionEditHistory.findMany({
    where: {
      transactionId,
      transaction: { userId },
    },
    orderBy: { editedAt: "desc" },
  });

  return history.map(transactionEditHistoryFromDb);
}

export async function listBudgets(userId: string) {
  await ensureFallbackCategories(prisma, userId);
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true, subcategory: true },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
  });

  return budgets.map(budgetFromDb);
}

export async function createBudget(userId: string, budget: BudgetInput) {
  validateBudgetInput(budget);
  await ensureFallbackCategories(prisma, userId);
  await validateBudgetCategoryOwnership(prisma, userId, budget);
  await ensureBudgetIsUnique(prisma, userId, {
    ...budget,
    subcategoryId: budget.subcategoryId || null,
    alertThreshold: budget.alertThreshold ?? 80,
  });

  const created = await prisma.budget.create({
    data: {
      userId,
      month: budget.month,
      categoryId: budget.categoryId,
      subcategoryId: budget.subcategoryId || null,
      limitAmount: new Prisma.Decimal(toAmount(budget.limitAmount)),
      alertThreshold: budget.alertThreshold ?? 80,
    },
    include: { category: true, subcategory: true },
  });

  return budgetFromDb(created);
}

export async function updateBudget(
  userId: string,
  id: string,
  updates: Partial<BudgetInput>,
) {
  const existing = await prisma.budget.findFirstOrThrow({
    where: { id, userId },
  });
  const nextBudget: BudgetInput = {
    month: updates.month ?? existing.month,
    categoryId: updates.categoryId ?? existing.categoryId,
    subcategoryId:
      updates.subcategoryId !== undefined
        ? updates.subcategoryId
        : existing.subcategoryId,
    limitAmount:
      updates.limitAmount !== undefined
        ? updates.limitAmount
        : existing.limitAmount.toNumber(),
    alertThreshold: updates.alertThreshold ?? existing.alertThreshold,
  };

  validateBudgetInput(nextBudget);
  await validateBudgetCategoryOwnership(prisma, userId, nextBudget);
  await ensureBudgetIsUnique(prisma, userId, nextBudget, id);

  const updated = await prisma.budget.update({
    where: { id },
    data: {
      ...(updates.month !== undefined && { month: updates.month }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
      ...(updates.subcategoryId !== undefined && {
        subcategoryId: updates.subcategoryId || null,
      }),
      ...(updates.limitAmount !== undefined && {
        limitAmount: new Prisma.Decimal(toAmount(updates.limitAmount)),
      }),
      ...(updates.alertThreshold !== undefined && {
        alertThreshold: updates.alertThreshold,
      }),
    },
    include: { category: true, subcategory: true },
  });

  return budgetFromDb(updated);
}

export async function deleteBudget(userId: string, id: string) {
  await prisma.budget.findFirstOrThrow({
    where: { id, userId },
    select: { id: true },
  });
  await prisma.budget.delete({ where: { id } });
  return id;
}

export async function listRecurringBills(userId: string) {
  await ensureDefaultAccounts(userId);
  await ensureFallbackCategories(prisma, userId);
  const bills = await prisma.recurringBill.findMany({
    where: { userId },
    include: {
      category: true,
      subcategory: true,
      payments: { orderBy: { paidAt: "desc" }, take: 5 },
    },
    orderBy: [{ active: "desc" }, { nextDueDate: "asc" }, { name: "asc" }],
  });

  return bills.map(recurringBillFromDb);
}

export async function getMoneyDataSnapshot(userId: string) {
  const [transactions, accounts, categories, budgets, recurringBills] =
    await Promise.all([
      listTransactions(userId),
      listAccounts(userId),
      listCategories(userId),
      listBudgets(userId),
      listRecurringBills(userId),
    ]);

  return {
    transactions,
    accounts,
    categories,
    budgets,
    recurringBills,
  };
}

export async function createRecurringBill(
  userId: string,
  bill: RecurringBillInput,
) {
  validateRecurringBillInput(bill);
  await ensureDefaultAccounts(userId);
  await ensureFallbackCategories(prisma, userId);
  await validateRecurringBillOwnership(prisma, userId, bill);

  const created = await prisma.recurringBill.create({
    data: {
      userId,
      name: bill.name.trim(),
      amount: new Prisma.Decimal(toAmount(bill.amount)),
      account: bill.account,
      categoryId: bill.categoryId,
      subcategoryId: bill.subcategoryId || null,
      frequency: bill.frequency,
      nextDueDate: toDate(bill.nextDueDate),
      reminderDays: bill.reminderDays ?? DEFAULT_BILL_REMINDER_DAYS,
      active: bill.active ?? true,
    },
    include: { category: true, subcategory: true, payments: true },
  });

  return recurringBillFromDb(created);
}

export async function updateRecurringBill(
  userId: string,
  id: string,
  updates: Partial<RecurringBillInput>,
) {
  const existing = await prisma.recurringBill.findFirstOrThrow({
    where: { id, userId },
  });
  const nextBill: RecurringBillInput = {
    name: updates.name ?? existing.name,
    amount:
      updates.amount !== undefined ? updates.amount : existing.amount.toNumber(),
    account: updates.account ?? existing.account,
    categoryId: updates.categoryId ?? existing.categoryId,
    subcategoryId:
      updates.subcategoryId !== undefined
        ? updates.subcategoryId
        : existing.subcategoryId,
    frequency:
      updates.frequency ?? (existing.frequency as RecurringBillFrequency),
    nextDueDate:
      updates.nextDueDate ?? toDateInputValue(existing.nextDueDate),
    reminderDays: updates.reminderDays ?? existing.reminderDays,
    active: updates.active ?? existing.active,
  };

  validateRecurringBillInput(nextBill);
  await validateRecurringBillOwnership(prisma, userId, nextBill);

  const updated = await prisma.recurringBill.update({
    where: { id },
    data: {
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.amount !== undefined && {
        amount: new Prisma.Decimal(toAmount(updates.amount)),
      }),
      ...(updates.account !== undefined && { account: updates.account }),
      ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
      ...(updates.subcategoryId !== undefined && {
        subcategoryId: updates.subcategoryId || null,
      }),
      ...(updates.frequency !== undefined && { frequency: updates.frequency }),
      ...(updates.nextDueDate !== undefined && {
        nextDueDate: toDate(updates.nextDueDate),
      }),
      ...(updates.reminderDays !== undefined && {
        reminderDays: updates.reminderDays,
      }),
      ...(updates.active !== undefined && { active: updates.active }),
    },
    include: {
      category: true,
      subcategory: true,
      payments: { orderBy: { paidAt: "desc" }, take: 5 },
    },
  });

  return recurringBillFromDb(updated);
}

export async function deleteRecurringBill(userId: string, id: string) {
  await prisma.recurringBill.findFirstOrThrow({
    where: { id, userId },
    select: { id: true },
  });
  await prisma.recurringBill.delete({ where: { id } });
  return id;
}

export async function payRecurringBill(userId: string, id: string) {
  await ensureDefaultAccounts(userId);

  const refreshed = await prisma.$transaction(
    async (tx) => {
      const bill = await tx.recurringBill.findFirstOrThrow({
        where: { id, userId },
        include: { category: true, subcategory: true },
      });

      if (!bill.active) {
        throw new Error("Recurring bill is paused");
      }

      const occurrenceDate = toDateInputValue(bill.nextDueDate);
      const existingPayment = await tx.recurringBillPayment.findUnique({
        where: {
          billId_occurrenceDate: {
            billId: bill.id,
            occurrenceDate: bill.nextDueDate,
          },
        },
      });
      if (existingPayment) {
        throw new Error("Recurring bill has already been paid for this due date");
      }

      const transactionInput = recurringBillToTransactionInput(
        recurringBillFromDb(bill),
      );
      validateTransactionInput(transactionInput);
      await validateTransactionCategoryOwnership(tx, userId, transactionInput);

      const transaction = await tx.transaction.create({
        data: {
          ...normalizeTransactionInput(transactionInput),
          userId,
        },
      });

      await tx.recurringBillPayment.create({
        data: {
          billId: bill.id,
          transactionId: transaction.id,
          occurrenceDate: bill.nextDueDate,
        },
      });

      await tx.recurringBill.update({
        where: { id: bill.id },
        data: {
          nextDueDate: toDate(
            advanceRecurringBillDueDate(occurrenceDate, bill.frequency as RecurringBillFrequency),
          ),
        },
      });

      return rebuildBalances(tx, userId);
    },
    MONEY_TRANSACTION_OPTIONS,
  );

  const [updatedCategories, recurringBills] = await Promise.all([
    listCategories(userId),
    listRecurringBills(userId),
  ]);

  return {
    processedTransactions: refreshed.processedTransactions,
    updatedAccounts: refreshed.updatedAccounts,
    updatedCategories,
    recurringBills,
  };
}

async function rebuildBalances(client: PrismaClientOrTransaction, userId: string) {
  const [accounts, transactions] = await Promise.all([
    listAccountsFromDb(client, userId),
    listTransactionsFromDb(client, userId),
  ]);
  const { accountBalances, processedTransactions } = recalculateBalances(
    transactions,
    accounts,
  );

  await Promise.all([
    ...processedTransactions.map((transaction) =>
      client.transaction.update({
        where: { id: transaction.id },
        data: {
          accountBalances: transaction.accountBalances ?? {},
          totalBalance: new Prisma.Decimal(transaction.totalBalance || 0),
        },
      }),
    ),
    ...accounts.map((account) =>
      client.moneyAccount.update({
        where: { userId_id: { userId, id: account.id } },
        data: {
          balance: new Prisma.Decimal(accountBalances[account.id] || 0),
        },
      }),
    ),
  ]);

  return {
    processedTransactions,
    updatedAccounts: accounts.map((account) => ({
      ...account,
      balance: accountBalances[account.id] || 0,
    })),
  };
}

export async function createTransaction(
  userId: string,
  transaction: TransactionInput,
) {
  validateTransactionInput(transaction);
  await ensureDefaultAccounts(userId);

  const refreshed = await prisma.$transaction(
    async (tx) => {
      await ensureFallbackCategories(tx, userId);
      await validateTransactionCategoryOwnership(tx, userId, transaction);
      const created = await tx.transaction.create({
        data: {
          ...normalizeTransactionInput(transaction),
          userId,
        },
      });
      await rebuildBalances(tx, userId);
      return tx.transaction.findUniqueOrThrow({
        where: { id: created.id },
        include: { category: true, subcategory: true },
      });
    },
    MONEY_TRANSACTION_OPTIONS,
  );

  return transactionFromDb(refreshed);
}

export async function importTransactions(
  userId: string,
  transactions: TransactionInput[],
) {
  if (transactions.length === 0) {
    throw new Error("At least one transaction is required");
  }

  await ensureDefaultAccounts(userId);

  const refreshed = await prisma.$transaction(
    async (tx) => {
      await ensureFallbackCategories(tx, userId);

      for (const transaction of transactions) {
        validateTransactionInput(transaction);
        await validateTransactionCategoryOwnership(tx, userId, transaction);
        await tx.transaction.create({
          data: {
            ...normalizeTransactionInput(transaction),
            userId,
          },
        });
      }

      return rebuildBalances(tx, userId);
    },
    MONEY_TRANSACTION_OPTIONS,
  );

  const updatedCategories = await listCategories(userId);

  return {
    processedTransactions: refreshed.processedTransactions,
    updatedAccounts: refreshed.updatedAccounts,
    updatedCategories,
  };
}

export async function updateTransaction(
  userId: string,
  id: string,
  transaction: Partial<TransactionInput>,
) {
  const updated = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.transaction.findFirstOrThrow({
        where: { id, userId },
      });
      const beforeSnapshot = dbTransactionToInput(existing);
      const nextTransaction: TransactionInput = {
        ...beforeSnapshot,
        ...transaction,
      };
      validateTransactionInput(nextTransaction);
      await validateTransactionCategoryOwnership(tx, userId, nextTransaction);

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...(transaction.type && { type: transaction.type }),
          ...(transaction.amount !== undefined && {
            amount: new Prisma.Decimal(toAmount(transaction.amount)),
          }),
          ...(transaction.account !== undefined && {
            account: transaction.account || null,
          }),
          ...(transaction.from !== undefined && {
            from: transaction.from || null,
          }),
          ...(transaction.to !== undefined && { to: transaction.to || null }),
          ...(transaction.direction !== undefined && {
            direction: transaction.direction || null,
          }),
          ...(transaction.person !== undefined && {
            person: transaction.person || null,
          }),
          ...(transaction.note !== undefined && { note: transaction.note || null }),
          ...(transaction.categoryId !== undefined && {
            categoryId: transaction.categoryId || null,
          }),
          ...(transaction.subcategoryId !== undefined && {
            subcategoryId: transaction.subcategoryId || null,
          }),
          ...((transaction.transactionDate !== undefined ||
            transaction.transactionTime !== undefined) && {
            transactionDate: toDate(
              nextTransaction.transactionDate,
              nextTransaction.transactionTime,
            ),
          }),
          ...((transaction.entryDate !== undefined ||
            transaction.entryTime !== undefined) && {
            entryDate: toDate(nextTransaction.entryDate, nextTransaction.entryTime),
          }),
        },
      });

      const afterSnapshot = dbTransactionToInput(updatedTransaction);
      await tx.transactionEditHistory.create({
        data: {
          transactionId: id,
          beforeSnapshot: beforeSnapshot as Prisma.InputJsonValue,
          afterSnapshot: afterSnapshot as Prisma.InputJsonValue,
          changedFields: getChangedFields(
            beforeSnapshot,
            afterSnapshot,
          ) as Prisma.InputJsonValue,
        },
      });

      await rebuildBalances(tx, userId);
      return tx.transaction.findUniqueOrThrow({
        where: { id: updatedTransaction.id },
        include: { category: true, subcategory: true },
      });
    },
    MONEY_TRANSACTION_OPTIONS,
  );

  return transactionFromDb(updated);
}

export async function deleteTransaction(userId: string, id: string) {
  await prisma.$transaction(
    async (tx) => {
      await tx.transaction.findFirstOrThrow({
        where: { id, userId },
        select: { id: true },
      });
      await tx.transaction.delete({ where: { id } });
      await rebuildBalances(tx, userId);
    },
    MONEY_TRANSACTION_OPTIONS,
  );
  return id;
}

export async function createAccount(userId: string, account: AccountInput) {
  await ensureDefaultAccounts(userId);
  const id =
    account.id ||
    account.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") ||
    Date.now().toString();

  const created = await prisma.moneyAccount.create({
    data: {
      id,
      name: account.name,
      owner: account.owner || null,
      icon: account.icon || "bank",
      balance: 0,
      userId,
    },
  });

  return accountFromDb(created);
}

export async function updateAccount(
  userId: string,
  id: string,
  updates: Partial<AccountInput>,
) {
  const updated = await prisma.moneyAccount.update({
    where: { userId_id: { userId, id } },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.owner !== undefined && { owner: updates.owner || null }),
      ...(updates.icon !== undefined && { icon: updates.icon || "bank" }),
    },
  });

  return accountFromDb(updated);
}

export async function deleteAccount(userId: string, id: string) {
  if (id === "cash") {
    throw new Error("The Cash account cannot be deleted.");
  }

  const [transactionCount, recurringBillCount] = await Promise.all([
    prisma.transaction.count({
      where: {
        userId,
        OR: [{ account: id }, { from: id }, { to: id }],
      },
    }),
    prisma.recurringBill.count({ where: { userId, account: id } }),
  ]);

  if (transactionCount > 0 || recurringBillCount > 0) {
    throw new Error("Cannot delete account that has transactions or recurring bills");
  }

  await prisma.moneyAccount.delete({ where: { userId_id: { userId, id } } });
  return id;
}
