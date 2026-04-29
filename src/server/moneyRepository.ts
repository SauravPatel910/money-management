import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import type {
  Account,
  AccountInput,
  MoneyTransaction,
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

  const [childCount, transactionCount] = await Promise.all([
    prisma.transactionCategory.count({ where: { parentId: id, userId } }),
    prisma.transaction.count({
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

  const transactionCount = await prisma.transaction.count({
    where: {
      userId,
      OR: [{ account: id }, { from: id }, { to: id }],
    },
  });

  if (transactionCount > 0) {
    throw new Error("Cannot delete account that has transactions");
  }

  await prisma.moneyAccount.delete({ where: { userId_id: { userId, id } } });
  return id;
}
