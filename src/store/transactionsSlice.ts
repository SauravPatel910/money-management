// @ts-nocheck
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchTransactions,
  fetchAccounts,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addAccount,
  updateAccount,
  deleteAccount,
  calculateSummary,
} from "../services/moneyService";

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
  async (transaction) => {
    await addTransaction(transaction);
    const [processedTransactions, updatedAccounts] = await Promise.all([
      fetchTransactions(),
      fetchAccounts(),
    ]);
    return { processedTransactions, updatedAccounts };
  },
);

export const updateTransactionThunk = createAsyncThunk(
  "transactions/updateTransaction",
  async ({ id, ...transaction }) => {
    await updateTransaction(id, transaction);
    const [processedTransactions, updatedAccounts] = await Promise.all([
      fetchTransactions(),
      fetchAccounts(),
    ]);
    return { processedTransactions, updatedAccounts };
  },
);

export const deleteTransactionThunk = createAsyncThunk(
  "transactions/deleteTransaction",
  async (id) => {
    await deleteTransaction(id);
    const [processedTransactions, updatedAccounts] = await Promise.all([
      fetchTransactions(),
      fetchAccounts(),
    ]);
    return { id, updatedAccounts, processedTransactions };
  },
);

export const addAccountThunk = createAsyncThunk(
  "transactions/addAccount",
  async (account) => {
    return await addAccount(account);
  },
);

export const editAccountThunk = createAsyncThunk(
  "transactions/editAccount",
  async ({ id, ...updates }) => {
    return await updateAccount(id, updates);
  },
);

export const deleteAccountThunk = createAsyncThunk(
  "transactions/deleteAccount",
  async (id, { getState }) => {
    const { transactions } = getState().transactions;

    // Don't allow deleting if account has transactions or if it's the cash account
    const hasTransactions = transactions.some(
      (t) => t.account === id || t.from === id || t.to === id,
    );

    if (!hasTransactions && id !== "cash") {
      await deleteAccount(id);
      return id;
    } else {
      throw new Error(
        "Cannot delete account that has transactions or is the cash account",
      );
    }
  },
);

const initialState = {
  transactions: [],
  accounts: [],
  sortOrder: "newest",
  summary: { totalIncome: 0, totalExpense: 0 },
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const getTransactionTimestamp = (transaction) =>
  new Date(
    `${transaction.transactionDate}T${transaction.transactionTime || "00:00"}:00`,
  ).getTime();

export const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === "newest" ? "oldest" : "newest";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Transactions
      .addCase(fetchTransactionsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTransactionsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.transactions = action.payload;
        // Ensure transactions are sorted by date (oldest first)
        state.transactions.sort(
          (a, b) => getTransactionTimestamp(a) - getTransactionTimestamp(b),
        );
        state.summary = calculateSummary(action.payload);
      })
      .addCase(fetchTransactionsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // Fetch Accounts
      .addCase(fetchAccountsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.accounts = action.payload;
      })
      .addCase(fetchAccountsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // Add Transaction
      .addCase(addTransactionThunk.fulfilled, (state, action) => {
        state.transactions = action.payload.processedTransactions;
        // Sort transactions by transaction date with newest transactions last
        state.transactions.sort(
          (a, b) => getTransactionTimestamp(a) - getTransactionTimestamp(b),
        );
        state.summary = calculateSummary(state.transactions);
        state.accounts = action.payload.updatedAccounts;
      })

      // Update Transaction
      .addCase(updateTransactionThunk.fulfilled, (state, action) => {
        state.transactions = action.payload.processedTransactions;
        state.transactions.sort(
          (a, b) => getTransactionTimestamp(a) - getTransactionTimestamp(b),
        );
        state.summary = calculateSummary(state.transactions);
        state.accounts = action.payload.updatedAccounts;
      })

      // Delete Transaction
      .addCase(deleteTransactionThunk.fulfilled, (state, action) => {
        state.transactions = action.payload.processedTransactions;
        state.summary = calculateSummary(state.transactions);
        state.accounts = action.payload.updatedAccounts;
      })

      // Add Account
      .addCase(addAccountThunk.fulfilled, (state, action) => {
        state.accounts.push(action.payload);
      })

      // Edit Account
      .addCase(editAccountThunk.fulfilled, (state, action) => {
        const index = state.accounts.findIndex(
          (account) => account.id === action.payload.id,
        );
        if (index !== -1) {
          state.accounts[index] = {
            ...state.accounts[index],
            ...action.payload,
          };
        }
      })

      // Delete Account
      .addCase(deleteAccountThunk.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(
          (account) => account.id !== action.payload,
        );
      });
  },
});

export const { toggleSortOrder } = transactionsSlice.actions;

export const selectTransactions = (state) => state.transactions.transactions;
export const selectAccounts = (state) => state.transactions.accounts;
export const selectAccountById = (id) => (state) =>
  state.transactions.accounts.find((account) => account.id === id);
export const selectCashBalance = (state) =>
  state.transactions.accounts.find((account) => account.id === "cash")
    ?.balance || 0;
export const selectBankBalance = (state) =>
  state.transactions.accounts.find((account) => account.id === "bank")
    ?.balance || 0;
export const selectTotalBalance = (state) =>
  state.transactions.accounts.reduce(
    (sum, account) => sum + (Number(account.balance) || 0),
    0,
  );
export const selectSummary = (state) => state.transactions.summary;
export const selectSortOrder = (state) => state.transactions.sortOrder;
export const selectTransactionsStatus = (state) => state.transactions.status;
export const selectTransactionsError = (state) => state.transactions.error;

export default transactionsSlice.reducer;
