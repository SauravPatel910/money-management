import type { Account, AccountInput, MoneyTransaction, TransactionInput } from "@/types/money";

const toAmount = (value: unknown) => Number(value) || 0;

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

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
    (a, b) =>
      new Date(a.transactionDate).getTime() -
      new Date(b.transactionDate).getTime(),
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

export const fetchTransactions = async () =>
  requestJson<MoneyTransaction[]>("/api/transactions");

export const fetchAccounts = async () => requestJson<Account[]>("/api/accounts");

export const addTransaction = async (transaction: TransactionInput) =>
  requestJson<MoneyTransaction>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });

export const updateTransaction = async (
  id: string,
  transaction: Partial<TransactionInput>,
) =>
  requestJson<MoneyTransaction>(`/api/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(transaction),
  });

export const deleteTransaction = async (id: string) => {
  await requestJson<{ id: string }>(`/api/transactions/${id}`, {
    method: "DELETE",
  });
  return id;
};

export const addAccount = async (account: AccountInput) =>
  requestJson<Account>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(account),
  });

export const updateAccount = async (id: string, updates: Partial<AccountInput>) =>
  requestJson<Account>(`/api/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const deleteAccount = async (id: string) => {
  await requestJson<{ id: string }>(`/api/accounts/${id}`, {
    method: "DELETE",
  });
  return id;
};

export const updateAccountBalances = async () => fetchAccounts();
