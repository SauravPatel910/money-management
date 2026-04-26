import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import type { Account, AccountInput, MoneyTransaction, TransactionInput } from "@/types/money";

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "cash", name: "Cash", balance: 0, icon: "cash" },
  { id: "bank", name: "Primary Bank", balance: 0, icon: "bank" },
];

const toAmount = (value: unknown) => Number(value) || 0;

const toDate = (value?: string | null, time?: string | null) => {
  const dateValue = value || new Date().toISOString().slice(0, 10);
  const timeValue = (time || "00:00").slice(0, 5);
  return new Date(`${dateValue}T${timeValue}:00.000Z`);
};

const toDateInputValue = (value: Date) => value.toISOString().slice(0, 10);
const toTimeInputValue = (value: Date) => value.toISOString().slice(11, 16);

const getTransactionTimestamp = (transaction: Pick<MoneyTransaction, "transactionDate" | "transactionTime">) =>
  new Date(
    `${transaction.transactionDate}T${transaction.transactionTime || "00:00"}:00.000Z`,
  ).getTime();

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

export const calculateSummary = (transactions: MoneyTransaction[] = []) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + toAmount(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + toAmount(t.amount), 0);

  return { totalIncome, totalExpense };
};

export const recalculateBalances = (
  transactions: MoneyTransaction[] = [],
  accounts: Account[] = [],
) => {
  const accountBalances = accounts.reduce<Record<string, number>>(
    (acc, account) => {
      acc[account.id] = 0;
      return acc;
    },
    {},
  );

  const sortedTransactions = [...transactions].sort(
    (a, b) => getTransactionTimestamp(a) - getTransactionTimestamp(b),
  );

  const processedTransactions = sortedTransactions.map((transaction) => {
    const amount = toAmount(transaction.amount);

    if (transaction.type === "income") {
      const accountId = transaction.account || "cash";
      accountBalances[accountId] = (accountBalances[accountId] || 0) + amount;
    } else if (transaction.type === "expense") {
      const accountId = transaction.account || "cash";
      accountBalances[accountId] = (accountBalances[accountId] || 0) - amount;
    } else if (transaction.type === "transfer") {
      const fromAccountId = transaction.from || "cash";
      const toAccountId = transaction.to || "bank";
      accountBalances[fromAccountId] =
        (accountBalances[fromAccountId] || 0) - amount;
      accountBalances[toAccountId] = (accountBalances[toAccountId] || 0) + amount;
    } else if (transaction.type === "person") {
      const accountId = transaction.account || "cash";
      if (transaction.direction === "to") {
        accountBalances[accountId] = (accountBalances[accountId] || 0) - amount;
      } else if (transaction.direction === "from") {
        accountBalances[accountId] = (accountBalances[accountId] || 0) + amount;
      }
    }

    const totalBalance = Object.values(accountBalances).reduce(
      (sum, balance) => sum + balance,
      0,
    );

    return {
      ...transaction,
      accountBalances: { ...accountBalances },
      totalBalance,
    };
  });

  return {
    processedTransactions,
    accountBalances,
  };
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

export async function listAccounts() {
  await ensureDefaultAccounts();
  const accounts = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });
  return accounts.map(accountFromDb);
}

export async function listTransactions() {
  const transactions = await prisma.transaction.findMany({
    orderBy: [{ transactionDate: "asc" }, { createdAt: "asc" }],
  });

  return transactions.map(transactionFromDb);
}

async function rebuildBalances() {
  const [accounts, transactions] = await Promise.all([
    listAccounts(),
    listTransactions(),
  ]);
  const { accountBalances, processedTransactions } = recalculateBalances(
    transactions,
    accounts,
  );

  await prisma.$transaction([
    ...processedTransactions.map((transaction) =>
      prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          accountBalances: transaction.accountBalances ?? {},
          totalBalance: new Prisma.Decimal(transaction.totalBalance || 0),
        },
      }),
    ),
    ...accounts.map((account) =>
      prisma.account.update({
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
  const created = await prisma.transaction.create({
    data: normalizeTransactionInput(transaction),
  });
  await rebuildBalances();
  const refreshed = await prisma.transaction.findUniqueOrThrow({
    where: { id: created.id },
  });
  return transactionFromDb(refreshed);
}

export async function updateTransaction(
  id: string,
  transaction: Partial<TransactionInput>,
) {
  const existing =
    (transaction.transactionTime && !transaction.transactionDate) ||
    (transaction.entryTime && !transaction.entryDate)
      ? await prisma.transaction.findUniqueOrThrow({ where: { id } })
      : null;

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(transaction.type && { type: transaction.type }),
      ...(transaction.amount !== undefined && {
        amount: new Prisma.Decimal(toAmount(transaction.amount)),
      }),
      ...(transaction.account !== undefined && {
        account: transaction.account || null,
      }),
      ...(transaction.from !== undefined && { from: transaction.from || null }),
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
          transaction.transactionDate ||
            (existing ? toDateInputValue(existing.transactionDate) : undefined),
          transaction.transactionTime ||
            (existing ? toTimeInputValue(existing.transactionDate) : undefined),
        ),
      }),
      ...((transaction.entryDate !== undefined ||
        transaction.entryTime !== undefined) && {
        entryDate: toDate(
          transaction.entryDate ||
            (existing ? toDateInputValue(existing.entryDate) : undefined),
          transaction.entryTime ||
            (existing ? toTimeInputValue(existing.entryDate) : undefined),
        ),
      }),
    },
  });
  await rebuildBalances();
  return transactionFromDb(updated);
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  await rebuildBalances();
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
