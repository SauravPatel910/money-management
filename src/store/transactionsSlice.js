import { createSlice } from "@reduxjs/toolkit";

// Load transactions and accounts from localStorage
const storedTransactions = JSON.parse(
  localStorage.getItem("transactions") || "[]",
);
const storedAccounts = JSON.parse(
  localStorage.getItem("accounts") ||
    // Default accounts if none exist
    JSON.stringify([
      { id: "cash", name: "Cash", balance: 0, icon: "cash" },
      { id: "bank", name: "Primary Bank", balance: 0, icon: "bank" },
    ]),
);

// Calculate summary based on transactions
const calculateSummary = (transactions) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  return { totalIncome, totalExpense };
};

// Helper function to recalculate balances for all transactions and accounts
const recalculateBalances = (transactions, accounts) => {
  // Reset account balances to zero
  const accountBalances = accounts.reduce((acc, account) => {
    acc[account.id] = 0;
    return acc;
  }, {});

  // Process all transactions to recalculate account balances
  const processedTransactions = transactions.map((transaction) => {
    if (transaction.type === "income") {
      // Regular income
      const accountId = transaction.account || "cash";
      accountBalances[accountId] =
        (accountBalances[accountId] || 0) + transaction.amount;
    } else if (transaction.type === "expense") {
      // Regular expense
      const accountId = transaction.account || "cash";
      accountBalances[accountId] =
        (accountBalances[accountId] || 0) - transaction.amount;
    } else if (transaction.type === "transfer") {
      // Transfer between accounts
      const fromAccountId = transaction.from || "cash";
      const toAccountId = transaction.to || "bank";
      accountBalances[fromAccountId] =
        (accountBalances[fromAccountId] || 0) - transaction.amount;
      accountBalances[toAccountId] =
        (accountBalances[toAccountId] || 0) + transaction.amount;
    } else if (transaction.type === "person") {
      // Person-to-person transaction
      const accountId = transaction.account || "cash";
      if (transaction.direction === "to") {
        // Giving money to someone
        accountBalances[accountId] =
          (accountBalances[accountId] || 0) - transaction.amount;
      } else if (transaction.direction === "from") {
        // Receiving money from someone
        accountBalances[accountId] =
          (accountBalances[accountId] || 0) + transaction.amount;
      }
    }

    // Calculate total balance across all accounts
    const totalBalance = Object.values(accountBalances).reduce(
      (sum, balance) => sum + balance,
      0,
    );

    return {
      ...transaction,
      accountBalances: { ...accountBalances }, // Store a snapshot of all account balances at this point
      totalBalance: totalBalance,
    };
  });

  return {
    processedTransactions,
    accountBalances,
  };
};

const initialState = {
  transactions: storedTransactions,
  accounts: storedAccounts,
  sortOrder: "newest",
  summary: calculateSummary(storedTransactions),
};

export const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
      // Sort transactions by transaction date
      state.transactions.sort(
        (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
      );

      // Recalculate balances
      const { processedTransactions, accountBalances } = recalculateBalances(
        state.transactions,
        state.accounts,
      );

      state.transactions = processedTransactions;

      // Update account balances
      state.accounts = state.accounts.map((account) => ({
        ...account,
        balance: accountBalances[account.id] || 0,
      }));

      state.summary = calculateSummary(state.transactions);

      // Save to localStorage
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
      localStorage.setItem("accounts", JSON.stringify(state.accounts));
    },

    deleteTransaction: (state, action) => {
      const id = action.payload;
      state.transactions = state.transactions.filter((t) => t.id !== id);

      // Recalculate balances
      const { processedTransactions, accountBalances } = recalculateBalances(
        state.transactions,
        state.accounts,
      );

      state.transactions = processedTransactions;

      // Update account balances
      state.accounts = state.accounts.map((account) => ({
        ...account,
        balance: accountBalances[account.id] || 0,
      }));

      state.summary = calculateSummary(state.transactions);

      // Save to localStorage
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
      localStorage.setItem("accounts", JSON.stringify(state.accounts));
    },

    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === "newest" ? "oldest" : "newest";
    },

    addAccount: (state, action) => {
      const newAccount = {
        id: Date.now().toString(),
        balance: 0,
        ...action.payload,
      };

      state.accounts.push(newAccount);

      // Save to localStorage
      localStorage.setItem("accounts", JSON.stringify(state.accounts));
    },

    editAccount: (state, action) => {
      const { id, ...updates } = action.payload;
      const accountIndex = state.accounts.findIndex(
        (account) => account.id === id,
      );

      if (accountIndex !== -1) {
        // Don't allow changing the balance directly - it's calculated from transactions
        const { ...accountUpdates } = updates; // const { balance, ...accountUpdates } = updates;
        state.accounts[accountIndex] = {
          ...state.accounts[accountIndex],
          ...accountUpdates,
        };

        // Save to localStorage
        localStorage.setItem("accounts", JSON.stringify(state.accounts));
      }
    },

    deleteAccount: (state, action) => {
      const id = action.payload;

      // Don't allow deleting if account has transactions
      const hasTransactions = state.transactions.some(
        (t) => t.account === id || t.from === id || t.to === id,
      );

      if (!hasTransactions && id !== "cash") {
        // Don't allow deleting the cash account
        state.accounts = state.accounts.filter((account) => account.id !== id);

        // Save to localStorage
        localStorage.setItem("accounts", JSON.stringify(state.accounts));
      }
    },
  },
});

export const {
  addTransaction,
  deleteTransaction,
  toggleSortOrder,
  addAccount,
  editAccount,
  deleteAccount,
} = transactionsSlice.actions;

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

export default transactionsSlice.reducer;
