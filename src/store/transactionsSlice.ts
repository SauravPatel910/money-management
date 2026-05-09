import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../config/reduxStore";
import type {
  Account,
  AccountInput,
  Budget,
  BudgetInput,
  MoneyDataSnapshot,
  MoneyTransaction,
  RecurringBill,
  RecurringBillInput,
  Summary,
  TransactionCategory,
  TransactionCategoryInput,
  TransactionEditHistory,
  TransactionInput,
} from "../types/money";
import {
  fetchTransactions,
  fetchAccounts,
  fetchBudgets,
  fetchRecurringBills,
  addTransaction,
  fetchCategories,
  fetchTransactionEditHistory,
  updateTransaction,
  importTransactions,
  deleteTransaction,
  addAccount,
  updateAccount,
  deleteAccount,
  addCategory,
  updateCategory,
  deleteCategory,
  addBudget,
  updateBudget,
  deleteBudget,
  addRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
  fetchMoneyData,
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
  categories: TransactionCategory[];
  budgets: Budget[];
  recurringBills: RecurringBill[];
  sortOrder: SortOrder;
  summary: Summary;
  transactionsStatus: RequestStatus;
  transactionsError: string | null;
  accountsStatus: RequestStatus;
  accountsError: string | null;
  categoriesStatus: RequestStatus;
  categoriesError: string | null;
  budgetsStatus: RequestStatus;
  budgetsError: string | null;
  recurringBillsStatus: RequestStatus;
  recurringBillsError: string | null;
  editHistoryByTransactionId: Record<string, TransactionEditHistory[]>;
  editHistoryStatusByTransactionId: Record<string, RequestStatus>;
  editHistoryErrorByTransactionId: Record<string, string | null>;
};

type UpdateTransactionPayload = { id: string } & Partial<TransactionInput>;
type UpdateCategoryPayload = { id: string } & Partial<TransactionCategoryInput>;
type UpdateBudgetPayload = { id: string } & Partial<BudgetInput>;
type UpdateRecurringBillPayload = { id: string } & Partial<RecurringBillInput>;

const fetchFreshMoneyData = async (): Promise<MoneyDataSnapshot> => fetchMoneyData();

// Create async thunks for server-backed operations
export const fetchMoneyDataThunk = createAsyncThunk(
  "transactions/fetchMoneyData",
  async () => {
    return await fetchMoneyData();
  },
);

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

export const fetchCategoriesThunk = createAsyncThunk(
  "transactions/fetchCategories",
  async () => {
    return await fetchCategories();
  },
);

export const fetchBudgetsThunk = createAsyncThunk(
  "transactions/fetchBudgets",
  async () => {
    return await fetchBudgets();
  },
);

export const fetchRecurringBillsThunk = createAsyncThunk(
  "transactions/fetchRecurringBills",
  async () => {
    return await fetchRecurringBills();
  },
);

export const updateTransactionThunk = createAsyncThunk(
  "transactions/updateTransaction",
  async ({ id, ...transaction }: UpdateTransactionPayload) => {
    await updateTransaction(id, transaction);
    return fetchFreshMoneyData();
  },
);

export const importTransactionsThunk = createAsyncThunk(
  "transactions/importTransactions",
  async (transactions: TransactionInput[]) => {
    await importTransactions(transactions);
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

export const addCategoryThunk = createAsyncThunk(
  "transactions/addCategory",
  async (category: TransactionCategoryInput) => {
    await addCategory(category);
    return fetchFreshMoneyData();
  },
);

export const editCategoryThunk = createAsyncThunk(
  "transactions/editCategory",
  async ({ id, ...updates }: UpdateCategoryPayload) => {
    await updateCategory(id, updates);
    return fetchFreshMoneyData();
  },
);

export const deleteCategoryThunk = createAsyncThunk(
  "transactions/deleteCategory",
  async (id: string) => {
    await deleteCategory(id);
    return fetchFreshMoneyData();
  },
);

export const addBudgetThunk = createAsyncThunk(
  "transactions/addBudget",
  async (budget: BudgetInput) => {
    return await addBudget(budget);
  },
);

export const editBudgetThunk = createAsyncThunk(
  "transactions/editBudget",
  async ({ id, ...updates }: UpdateBudgetPayload) => {
    return await updateBudget(id, updates);
  },
);

export const deleteBudgetThunk = createAsyncThunk(
  "transactions/deleteBudget",
  async (id: string) => {
    await deleteBudget(id);
    return id;
  },
);

export const addRecurringBillThunk = createAsyncThunk(
  "transactions/addRecurringBill",
  async (bill: RecurringBillInput) => {
    return await addRecurringBill(bill);
  },
);

export const editRecurringBillThunk = createAsyncThunk(
  "transactions/editRecurringBill",
  async ({ id, ...updates }: UpdateRecurringBillPayload) => {
    return await updateRecurringBill(id, updates);
  },
);

export const deleteRecurringBillThunk = createAsyncThunk(
  "transactions/deleteRecurringBill",
  async (id: string) => {
    await deleteRecurringBill(id);
    return id;
  },
);

export const payRecurringBillThunk = createAsyncThunk(
  "transactions/payRecurringBill",
  async (id: string) => {
    await payRecurringBill(id);
    return fetchFreshMoneyData();
  },
);

const initialState: TransactionsState = {
  transactions: [],
  accounts: [],
  categories: [],
  budgets: [],
  recurringBills: [],
  sortOrder: "newest",
  summary: { totalIncome: 0, totalExpense: 0 },
  transactionsStatus: "idle",
  transactionsError: null,
  accountsStatus: "idle",
  accountsError: null,
  categoriesStatus: "idle",
  categoriesError: null,
  budgetsStatus: "idle",
  budgetsError: null,
  recurringBillsStatus: "idle",
  recurringBillsError: null,
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
  payload: MoneyDataSnapshot,
) => {
  updateTransactions(state, payload.transactions);
  state.accounts = payload.accounts;
  state.categories = payload.categories;
  state.budgets = payload.budgets;
  state.recurringBills = payload.recurringBills;
  state.transactionsStatus = "succeeded";
  state.transactionsError = null;
  state.accountsStatus = "succeeded";
  state.accountsError = null;
  state.categoriesStatus = "succeeded";
  state.categoriesError = null;
  state.budgetsStatus = "succeeded";
  state.budgetsError = null;
  state.recurringBillsStatus = "succeeded";
  state.recurringBillsError = null;
};

const setMoneyDataStatus = (
  state: TransactionsState,
  status: RequestStatus,
  error: string | null,
) => {
  state.transactionsStatus = status;
  state.transactionsError = error;
  state.accountsStatus = status;
  state.accountsError = error;
  state.categoriesStatus = status;
  state.categoriesError = error;
  state.budgetsStatus = status;
  state.budgetsError = error;
  state.recurringBillsStatus = status;
  state.recurringBillsError = error;
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
      // Fetch Money Data Snapshot
      .addCase(fetchMoneyDataThunk.pending, (state) => {
        setMoneyDataStatus(state, "loading", null);
      })
      .addCase(fetchMoneyDataThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(fetchMoneyDataThunk.rejected, (state, action) => {
        setMoneyDataStatus(state, "failed", action.error.message ?? null);
      })

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

      // Fetch Categories
      .addCase(fetchCategoriesThunk.pending, (state) => {
        state.categoriesStatus = "loading";
        state.categoriesError = null;
      })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.categoriesStatus = "succeeded";
        state.categoriesError = null;
        state.categories = action.payload;
      })
      .addCase(fetchCategoriesThunk.rejected, (state, action) => {
        state.categoriesStatus = "failed";
        state.categoriesError = action.error.message ?? null;
      })

      // Fetch Budgets
      .addCase(fetchBudgetsThunk.pending, (state) => {
        state.budgetsStatus = "loading";
        state.budgetsError = null;
      })
      .addCase(fetchBudgetsThunk.fulfilled, (state, action) => {
        state.budgetsStatus = "succeeded";
        state.budgetsError = null;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgetsThunk.rejected, (state, action) => {
        state.budgetsStatus = "failed";
        state.budgetsError = action.error.message ?? null;
      })

      // Fetch Recurring Bills
      .addCase(fetchRecurringBillsThunk.pending, (state) => {
        state.recurringBillsStatus = "loading";
        state.recurringBillsError = null;
      })
      .addCase(fetchRecurringBillsThunk.fulfilled, (state, action) => {
        state.recurringBillsStatus = "succeeded";
        state.recurringBillsError = null;
        state.recurringBills = action.payload;
      })
      .addCase(fetchRecurringBillsThunk.rejected, (state, action) => {
        state.recurringBillsStatus = "failed";
        state.recurringBillsError = action.error.message ?? null;
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

      // Import Transactions
      .addCase(importTransactionsThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(importTransactionsThunk.rejected, (state, action) => {
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
      })

      // Categories
      .addCase(addCategoryThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(addCategoryThunk.rejected, (state, action) => {
        state.categoriesError = action.error.message ?? null;
      })
      .addCase(editCategoryThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(editCategoryThunk.rejected, (state, action) => {
        state.categoriesError = action.error.message ?? null;
      })
      .addCase(deleteCategoryThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(deleteCategoryThunk.rejected, (state, action) => {
        state.categoriesError = action.error.message ?? null;
      })

      // Budgets
      .addCase(addBudgetThunk.fulfilled, (state, action) => {
        state.budgets.push(action.payload);
        state.budgetsStatus = "succeeded";
        state.budgetsError = null;
      })
      .addCase(addBudgetThunk.rejected, (state, action) => {
        state.budgetsError = action.error.message ?? null;
      })
      .addCase(editBudgetThunk.fulfilled, (state, action) => {
        const index = state.budgets.findIndex(
          (budget) => budget.id === action.payload.id,
        );
        if (index >= 0) {
          state.budgets[index] = action.payload;
        }
        state.budgetsError = null;
      })
      .addCase(editBudgetThunk.rejected, (state, action) => {
        state.budgetsError = action.error.message ?? null;
      })
      .addCase(deleteBudgetThunk.fulfilled, (state, action) => {
        state.budgets = state.budgets.filter(
          (budget) => budget.id !== action.payload,
        );
        state.budgetsError = null;
      })
      .addCase(deleteBudgetThunk.rejected, (state, action) => {
        state.budgetsError = action.error.message ?? null;
      })

      // Recurring Bills
      .addCase(addRecurringBillThunk.fulfilled, (state, action) => {
        state.recurringBills.push(action.payload);
        state.recurringBillsStatus = "succeeded";
        state.recurringBillsError = null;
      })
      .addCase(addRecurringBillThunk.rejected, (state, action) => {
        state.recurringBillsError = action.error.message ?? null;
      })
      .addCase(editRecurringBillThunk.fulfilled, (state, action) => {
        const index = state.recurringBills.findIndex(
          (bill) => bill.id === action.payload.id,
        );
        if (index >= 0) {
          state.recurringBills[index] = action.payload;
        }
        state.recurringBillsError = null;
      })
      .addCase(editRecurringBillThunk.rejected, (state, action) => {
        state.recurringBillsError = action.error.message ?? null;
      })
      .addCase(deleteRecurringBillThunk.fulfilled, (state, action) => {
        state.recurringBills = state.recurringBills.filter(
          (bill) => bill.id !== action.payload,
        );
        state.recurringBillsError = null;
      })
      .addCase(deleteRecurringBillThunk.rejected, (state, action) => {
        state.recurringBillsError = action.error.message ?? null;
      })
      .addCase(payRecurringBillThunk.fulfilled, (state, action) => {
        applyFreshMoneyData(state, action.payload);
      })
      .addCase(payRecurringBillThunk.rejected, (state, action) => {
        state.recurringBillsError = action.error.message ?? null;
      });
  },
});

export const { clearMoneyData, toggleSortOrder } = transactionsSlice.actions;

export const selectTransactions = (state: RootState) =>
  state.transactions.transactions;
export const selectAccounts = (state: RootState) => state.transactions.accounts;
export const selectCategories = (state: RootState) =>
  state.transactions.categories;
export const selectBudgets = (state: RootState) => state.transactions.budgets;
export const selectRecurringBills = (state: RootState) =>
  state.transactions.recurringBills;
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
export const selectCategoriesStatus = (state: RootState) =>
  state.transactions.categoriesStatus;
export const selectCategoriesError = (state: RootState) =>
  state.transactions.categoriesError;
export const selectBudgetsStatus = (state: RootState) =>
  state.transactions.budgetsStatus;
export const selectBudgetsError = (state: RootState) =>
  state.transactions.budgetsError;
export const selectRecurringBillsStatus = (state: RootState) =>
  state.transactions.recurringBillsStatus;
export const selectRecurringBillsError = (state: RootState) =>
  state.transactions.recurringBillsError;
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
