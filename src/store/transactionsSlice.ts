import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../config/reduxStore";
import type {
  Account,
  AccountInput,
  MoneyTransaction,
  Summary,
  TransactionEditHistory,
  TransactionInput,
} from "../types/money";
import {
  fetchTransactions,
  fetchAccounts,
  addTransaction,
  fetchTransactionEditHistory,
  updateTransaction,
  deleteTransaction,
  addAccount,
  updateAccount,
  deleteAccount,
} from "../services/moneyService";
import {
  calculateSummary,
  getTransactionTimestamp,
} from "../lib/moneyCalculations";

type SortOrder = "newest" | "oldest";
type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

type TransactionsState = {
  transactions: MoneyTransaction[];
  accounts: Account[];
  sortOrder: SortOrder;
  summary: Summary;
  transactionsStatus: RequestStatus;
  transactionsError: string | null;
  accountsStatus: RequestStatus;
  accountsError: string | null;
  editHistoryByTransactionId: Record<string, TransactionEditHistory[]>;
  editHistoryStatusByTransactionId: Record<string, RequestStatus>;
  editHistoryErrorByTransactionId: Record<string, string | null>;
};

type UpdateTransactionPayload = { id: string } & Partial<TransactionInput>;
type FreshDataPayload = {
  processedTransactions: MoneyTransaction[];
  updatedAccounts: Account[];
};

const fetchFreshMoneyData = async (): Promise<FreshDataPayload> => {
  const [processedTransactions, updatedAccounts] = await Promise.all([
    fetchTransactions(),
    fetchAccounts(),
  ]);

  return { processedTransactions, updatedAccounts };
};

// Create async thunks for server-backed operations
export const fetchTransactionsThunk = createAsyncThunk(
  "transactions/fetchTransactions",
  async () => {
    return await fetchTransactions();
  },
);

export const fetchAccountsThunk = createAsyncThunk(
  "transactions/fetchAccounts",
  async () => {
    return await fetchAccounts();
  },
);

export const addTransactionThunk = createAsyncThunk(
  "transactions/addTransaction",
  async (transaction: TransactionInput) => {
    await addTransaction(transaction);
    return fetchFreshMoneyData();
  },
);

export const updateTransactionThunk = createAsyncThunk(
  "transactions/updateTransaction",
  async ({ id, ...transaction }: UpdateTransactionPayload) => {
    await updateTransaction(id, transaction);
    return fetchFreshMoneyData();
  },
);

export const fetchTransactionEditHistoryThunk = createAsyncThunk(
  "transactions/fetchTransactionEditHistory",
  async (transactionId: string) => ({
    transactionId,
    history: await fetchTransactionEditHistory(transactionId),
  }),
);

export const deleteTransactionThunk = createAsyncThunk(
  "transactions/deleteTransaction",
  async (id: string) => {
    await deleteTransaction(id);
    return fetchFreshMoneyData();
  },
);

export const addAccountThunk = createAsyncThunk(
  "transactions/addAccount",
  async (account: AccountInput) => {
    await addAccount(account);
    return fetchFreshMoneyData();
  },
);

export const editAccountThunk = createAsyncThunk(
  "transactions/editAccount",
  async ({ id, ...updates }: Required<Pick<AccountInput, "id">> & AccountInput) => {
    await updateAccount(id, updates);
    return fetchFreshMoneyData();
  },
);

export const deleteAccountThunk = createAsyncThunk(
  "transactions/deleteAccount",
  async (id: string, { getState }) => {
    const { transactions } = (getState() as RootState).transactions;

    // Don't allow deleting if account has transactions or if it's the cash account
    const hasTransactions = transactions.some(
      (t) => t.account === id || t.from === id || t.to === id,
    );

    if (!hasTransactions && id !== "cash") {
      await deleteAccount(id);
      return fetchFreshMoneyData();
    } else {
      throw new Error(
        "Cannot delete account that has transactions or is the cash account",
      );
    }
  },
);

const initialState: TransactionsState = {
  transactions: [],
  accounts: [],
  sortOrder: "newest",
  summary: { totalIncome: 0, totalExpense: 0 },
  transactionsStatus: "idle",
  transactionsError: null,
  accountsStatus: "idle",
  accountsError: null,
  editHistoryByTransactionId: {},
  editHistoryStatusByTransactionId: {},
  editHistoryErrorByTransactionId: {},
};

const updateTransactions = (
  state: TransactionsState,
  transactions: MoneyTransaction[],
) => {
  state.transactions = transactions;
  state.transactions.sort(
    (a, b) => getTransactionTimestamp(a) - getTransactionTimestamp(b),
  );
  state.summary = calculateSummary(state.transactions);
};

const applyFreshMoneyData = (
  state: TransactionsState,
  payload: FreshDataPayload,
) => {
  updateTransactions(state, payload.processedTransactions);
  state.accounts = payload.updatedAccounts;
  state.transactionsStatus = "succeeded";
  state.transactionsError = null;
  state.accountsStatus = "succeeded";
  state.accountsError = null;
};

export const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === "newest" ? "oldest" : "newest";
    },
    clearMoneyData: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactionsThunk.pending, (state) => {
        state.transactionsStatus = "loading";
        state.transactionsError = null;
      })
      .addCase(fetchTransactionsThunk.fulfilled, (state, action) => {
        state.transactionsStatus = "succeeded";
        state.transactionsError = null;
        updateTransactions(state, action.payload);
      })
      .addCase(fetchTransactionsThunk.rejected, (state, action) => {
        state.transactionsStatus = "failed";
        state.transactionsError = action.error.message ?? null;
      })

      // Fetch Accounts
      .addCase(fetchAccountsThunk.pending, (state) => {
        state.accountsStatus = "loading";
        state.accountsError = null;
      })
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        state.accountsStatus = "succeeded";
        state.accountsError = null;
        state.accounts = action.payload;
      })
      .addCase(fetchAccountsThunk.rejected, (state, action) => {
        state.accountsStatus = "failed";
        state.accountsError = action.error.message ?? null;
      })

      // Add Transaction
      .addCase(addTransactionThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(addTransactionThunk.rejected, (state, action) => {
        state.transactionsError = action.error.message ?? null;
      })

      // Update Transaction
      .addCase(updateTransactionThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
        const transactionId = action.meta.arg.id;
        delete state.editHistoryByTransactionId[transactionId];
        state.editHistoryStatusByTransactionId[transactionId] = "idle";
        state.editHistoryErrorByTransactionId[transactionId] = null;
      })
      .addCase(updateTransactionThunk.rejected, (state, action) => {
        state.transactionsError = action.error.message ?? null;
      })

      // Fetch Transaction Edit History
      .addCase(fetchTransactionEditHistoryThunk.pending, (state, action) => {
        const transactionId = action.meta.arg;
        state.editHistoryStatusByTransactionId[transactionId] = "loading";
        state.editHistoryErrorByTransactionId[transactionId] = null;
      })
      .addCase(fetchTransactionEditHistoryThunk.fulfilled, (state, action) => {
        const { transactionId, history } = action.payload;
        state.editHistoryByTransactionId[transactionId] = history;
        state.editHistoryStatusByTransactionId[transactionId] = "succeeded";
        state.editHistoryErrorByTransactionId[transactionId] = null;
      })
      .addCase(fetchTransactionEditHistoryThunk.rejected, (state, action) => {
        const transactionId = action.meta.arg;
        state.editHistoryStatusByTransactionId[transactionId] = "failed";
        state.editHistoryErrorByTransactionId[transactionId] =
          action.error.message ?? null;
      })

      // Delete Transaction
      .addCase(deleteTransactionThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(deleteTransactionThunk.rejected, (state, action) => {
        state.transactionsError = action.error.message ?? null;
      })

      // Add Account
      .addCase(addAccountThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(addAccountThunk.rejected, (state, action) => {
        state.accountsError = action.error.message ?? null;
      })

      // Edit Account
      .addCase(editAccountThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(editAccountThunk.rejected, (state, action) => {
        state.accountsError = action.error.message ?? null;
      })

      // Delete Account
      .addCase(deleteAccountThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(deleteAccountThunk.rejected, (state, action) => {
        state.accountsError = action.error.message ?? null;
      });
  },
});

export const { clearMoneyData, toggleSortOrder } = transactionsSlice.actions;

export const selectTransactions = (state: RootState) =>
  state.transactions.transactions;
export const selectAccounts = (state: RootState) => state.transactions.accounts;
export const selectAccountById = (id: string) => (state: RootState) =>
  state.transactions.accounts.find((account) => account.id === id);
export const selectCashBalance = (state: RootState) =>
  state.transactions.accounts.find((account) => account.id === "cash")
    ?.balance || 0;
export const selectBankBalance = (state: RootState) =>
  state.transactions.accounts.find((account) => account.id === "bank")
    ?.balance || 0;
export const selectTotalBalance = (state: RootState) =>
  state.transactions.accounts.reduce(
    (sum, account) => sum + (Number(account.balance) || 0),
    0,
  );
export const selectSummary = (state: RootState) => state.transactions.summary;
export const selectSortOrder = (state: RootState) =>
  state.transactions.sortOrder;
export const selectTransactionsStatus = (state: RootState) =>
  state.transactions.transactionsStatus;
export const selectTransactionsError = (state: RootState) =>
  state.transactions.transactionsError;
export const selectAccountsStatus = (state: RootState) =>
  state.transactions.accountsStatus;
export const selectAccountsError = (state: RootState) =>
  state.transactions.accountsError;
export const selectTransactionEditHistory =
  (transactionId: string) => (state: RootState) =>
    state.transactions.editHistoryByTransactionId[transactionId] ?? [];
export const selectTransactionEditHistoryStatus =
  (transactionId: string) => (state: RootState) =>
    state.transactions.editHistoryStatusByTransactionId[transactionId] ??
    "idle";
export const selectTransactionEditHistoryError =
  (transactionId: string) => (state: RootState) =>
    state.transactions.editHistoryErrorByTransactionId[transactionId] ?? null;

export default transactionsSlice.reducer;
