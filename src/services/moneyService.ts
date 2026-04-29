import type {
  Account,
  AccountInput,
  MoneyTransaction,
  TransactionCategory,
  TransactionCategoryInput,
  TransactionEditHistory,
  TransactionInput,
} from "@/types/money";
export { calculateSummary, recalculateBalances } from "@/lib/moneyCalculations";

export type FreshMoneyData = {
  processedTransactions: MoneyTransaction[];
  updatedAccounts: Account[];
  updatedCategories: TransactionCategory[];
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login");
    }
    throw new Error(body?.message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const fetchTransactions = async () =>
  requestJson<MoneyTransaction[]>("/api/transactions");

export const fetchAccounts = async () => requestJson<Account[]>("/api/accounts");

export const fetchCategories = async () =>
  requestJson<TransactionCategory[]>("/api/categories");

export const addTransaction = async (transaction: TransactionInput) =>
  requestJson<MoneyTransaction>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });

export const importTransactions = async (transactions: TransactionInput[]) =>
  requestJson<FreshMoneyData>("/api/transactions/import", {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });

export const updateTransaction = async (
  id: string,
  transaction: Partial<TransactionInput>,
) =>
  requestJson<MoneyTransaction>(`/api/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(transaction),
  });

export const fetchTransactionEditHistory = async (id: string) =>
  requestJson<TransactionEditHistory[]>(`/api/transactions/${id}/history`);

export const deleteTransaction = async (id: string) => {
  await requestJson<{ id: string }>(`/api/transactions/${id}`, {
    method: "DELETE",
  });
  return id;
};

export const addCategory = async (category: TransactionCategoryInput) =>
  requestJson<TransactionCategory>("/api/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });

export const updateCategory = async (
  id: string,
  updates: Partial<TransactionCategoryInput>,
) =>
  requestJson<TransactionCategory>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const deleteCategory = async (id: string) => {
  await requestJson<{ id: string }>(`/api/categories/${id}`, {
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
