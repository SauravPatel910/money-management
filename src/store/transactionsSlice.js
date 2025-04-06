import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchTransactions,
  fetchAccounts,
  addTransactionToFirebase,
  deleteTransactionFromFirebase,
  addAccountToFirebase,
  updateAccountInFirebase,
  deleteAccountFromFirebase,
  calculateSummary,
  recalculateBalances,
  updateAccountBalances,
} from "../services/firebaseService";

// Create async thunks for Firebase operations
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
  async (transaction, { getState }) => {
    // First add the transaction to Firebase
    const newTransaction = await addTransactionToFirebase(transaction);

    // Then get the current state to recalculate balances
    const { transactions } = getState().transactions;
    const { accounts } = getState().transactions;

    // Add the new transaction to the existing transactions
    const updatedTransactions = [...transactions, newTransaction];

    // Recalculate balances
    const { accountBalances } = recalculateBalances(
      updatedTransactions,
      accounts,
    );

    // Update account balances in Firebase
    const updatedAccounts = await updateAccountBalances(
      accounts,
      accountBalances,
    );

    // Return both the new transaction and updated accounts
    return { newTransaction, updatedAccounts };
  },
);

export const deleteTransactionThunk = createAsyncThunk(
  "transactions/deleteTransaction",
  async (id, { getState }) => {
    // First delete the transaction from Firebase
    await deleteTransactionFromFirebase(id);

    // Then get the current state to recalculate balances
    const { transactions } = getState().transactions;
    const { accounts } = getState().transactions;

    // Remove the deleted transaction from the list
    const updatedTransactions = transactions.filter((t) => t.id !== id);

    // Sort transactions by date before recalculation
    updatedTransactions.sort(
      (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
    );

    // Recalculate balances for all transactions
    const { accountBalances, processedTransactions } = recalculateBalances(
      updatedTransactions,
      accounts,
    );

    // Update all transactions with new balance history if needed
    // This step is commented out for now as it would require updating all transactions in Firebase
    // const updatePromises = processedTransactions.map(t =>
    //   updateTransactionInFirebase(t.id, {
    //     accountBalances: t.accountBalances,
    //     totalBalance: t.totalBalance
    //   })
    // );
    // await Promise.all(updatePromises);

    // Update account balances in Firebase
    const updatedAccounts = await updateAccountBalances(
      accounts,
      accountBalances,
    );

    // Return both the transaction ID and updated accounts
    return { id, updatedAccounts, processedTransactions };
  },
);

export const addAccountThunk = createAsyncThunk(
  "transactions/addAccount",
  async (account) => {
    return await addAccountToFirebase(account);
  },
);

export const editAccountThunk = createAsyncThunk(
  "transactions/editAccount",
  async ({ id, ...updates }) => {
    return await updateAccountInFirebase(id, updates);
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
      await deleteAccountFromFirebase(id);
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
          (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
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
        state.transactions.push(action.payload.newTransaction);
        // Sort transactions by transaction date with newest transactions last
        state.transactions.sort(
          (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
        );
        state.summary = calculateSummary(state.transactions);
        state.accounts = action.payload.updatedAccounts;
      })

      // Delete Transaction
      .addCase(deleteTransactionThunk.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(
          (t) => t.id !== action.payload.id,
        );
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
    (sum, account) => sum + account.balance,
    0,
  );
export const selectSummary = (state) => state.transactions.summary;
export const selectSortOrder = (state) => state.transactions.sortOrder;
export const selectTransactionsStatus = (state) => state.transactions.status;
export const selectTransactionsError = (state) => state.transactions.error;

export default transactionsSlice.reducer;
