import type { Account, MoneyTransaction, Summary } from "@/types/money";

export const toAmount = (value: unknown) => Number(value) || 0;

export const getTransactionTimestamp = (
  transaction: Pick<MoneyTransaction, "transactionDate" | "transactionTime">,
) =>
  new Date(
    `${transaction.transactionDate}T${transaction.transactionTime || "00:00"}:00.000Z`,
  ).getTime();

export const sortTransactionsChronologically = <
  T extends Pick<MoneyTransaction, "transactionDate" | "transactionTime">,
>(
  transactions: T[],
) =>
  [...transactions].sort(
    (a, b) => getTransactionTimestamp(a) - getTransactionTimestamp(b),
  );

export const calculateSummary = (
  transactions: MoneyTransaction[] = [],
): Summary => {
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

  const processedTransactions = sortTransactionsChronologically(
    transactions,
  ).map((transaction) => {
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
      accountBalances[toAccountId] =
        (accountBalances[toAccountId] || 0) + amount;
    } else if (transaction.type === "person") {
      const accountId = transaction.account || "cash";
      if (transaction.direction === "to") {
        accountBalances[accountId] =
          (accountBalances[accountId] || 0) - amount;
      } else if (transaction.direction === "from") {
        accountBalances[accountId] =
          (accountBalances[accountId] || 0) + amount;
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
