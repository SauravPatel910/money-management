import type { Account, AccountInput, MoneyTransaction, TransactionInput } from "@/types/money";
export { calculateSummary, recalculateBalances } from "@/lib/moneyCalculations";

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
