import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import type {
  Account,
  AccountInput,
  MoneyTransaction,
  TransactionEditChangedField,
  TransactionEditHistory,
  TransactionEditSnapshot,
  TransactionInput,
  TransactionType,
} from "@/types/money";
import { recalculateBalances, toAmount } from "@/lib/moneyCalculations";

type PrismaClientOrTransaction = typeof prisma | Prisma.TransactionClient;
type DbTransaction = Awaited<ReturnType<PrismaClientOrTransaction["transaction"]["findUniqueOrThrow"]>>;

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
  transactionDate: toDate(transaction.transactionDate, transaction.transactionTime),
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

export async function ensureDefaultAccounts() {
  const accountCount = await prisma.account.count();

  if (accountCount === 0) {
    await prisma.account.createMany({
      data: DEFAULT_ACCOUNTS.map((account) => ({
        id: account.id,
        name: account.name,
        balance: account.balance,
        icon: account.icon,
      })),
      skipDuplicates: true,
    });
  }
}

const listAccountsFromDb = async (client: PrismaClientOrTransaction) => {
  const accounts = await client.account.findMany({
    orderBy: { createdAt: "asc" },
  });
  return accounts.map(accountFromDb);
};

export async function listAccounts() {
  await ensureDefaultAccounts();
  return listAccountsFromDb(prisma);
}

const listTransactionsFromDb = async (client: PrismaClientOrTransaction) => {
  const transactions = await client.transaction.findMany({
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });

  return transactions.map(transactionFromDb);
};

export async function listTransactions() {
  return listTransactionsFromDb(prisma);
}

export async function listTransactionEditHistory(transactionId: string) {
  const history = await prisma.transactionEditHistory.findMany({
    where: { transactionId },
    orderBy: { editedAt: "desc" },
  });

  return history.map(transactionEditHistoryFromDb);
}

async function rebuildBalances(client: PrismaClientOrTransaction) {
  const [accounts, transactions] = await Promise.all([
    listAccountsFromDb(client),
    listTransactionsFromDb(client),
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
      client.account.update({
        where: { id: account.id },
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

export async function createTransaction(transaction: TransactionInput) {
  validateTransactionInput(transaction);

  const refreshed = await prisma.$transaction(
    async (tx) => {
      const created = await tx.transaction.create({
        data: normalizeTransactionInput(transaction),
      });
      await rebuildBalances(tx);
      return tx.transaction.findUniqueOrThrow({
        where: { id: created.id },
      });
    },
    MONEY_TRANSACTION_OPTIONS,
  );

  return transactionFromDb(refreshed);
}

export async function updateTransaction(
  id: string,
  transaction: Partial<TransactionInput>,
) {
  const updated = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.transaction.findUniqueOrThrow({ where: { id } });
      const beforeSnapshot = dbTransactionToInput(existing);
      const nextTransaction: TransactionInput = {
        ...beforeSnapshot,
        ...transaction,
      };
      validateTransactionInput(nextTransaction);

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

      await rebuildBalances(tx);
      return updatedTransaction;
    },
    MONEY_TRANSACTION_OPTIONS,
  );

  return transactionFromDb(updated);
}

export async function deleteTransaction(id: string) {
  await prisma.$transaction(
    async (tx) => {
      await tx.transaction.delete({ where: { id } });
      await rebuildBalances(tx);
    },
    MONEY_TRANSACTION_OPTIONS,
  );
  return id;
}

export async function createAccount(account: AccountInput) {
  const id =
    account.id ||
    account.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") ||
    Date.now().toString();

  const created = await prisma.account.create({
    data: {
      id,
      name: account.name,
      owner: account.owner || null,
      icon: account.icon || "bank",
      balance: 0,
    },
  });

  return accountFromDb(created);
}

export async function updateAccount(id: string, updates: Partial<AccountInput>) {
  const updated = await prisma.account.update({
    where: { id },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.owner !== undefined && { owner: updates.owner || null }),
      ...(updates.icon !== undefined && { icon: updates.icon || "bank" }),
    },
  });

  return accountFromDb(updated);
}

export async function deleteAccount(id: string) {
  if (id === "cash") {
    throw new Error("The Cash account cannot be deleted.");
  }

  const transactionCount = await prisma.transaction.count({
    where: {
      OR: [{ account: id }, { from: id }, { to: id }],
    },
  });

  if (transactionCount > 0) {
    throw new Error("Cannot delete account that has transactions");
  }

  await prisma.account.delete({ where: { id } });
  return id;
}
