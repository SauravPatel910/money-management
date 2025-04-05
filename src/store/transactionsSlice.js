import { createSlice } from "@reduxjs/toolkit";

// Load transactions and balance from localStorage
const storedTransactions = JSON.parse(
  localStorage.getItem("transactions") || "[]",
);
const storedBalance = parseFloat(localStorage.getItem("balance") || "0");

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

// Helper function to recalculate balances for all transactions
const recalculateBalances = (transactions) => {
  let runningBalance = 0;
  return transactions.map((transaction) => {
    runningBalance =
      transaction.type === "income"
        ? runningBalance + transaction.amount
        : runningBalance - transaction.amount;
    return {
      ...transaction,
      closingBalance: runningBalance,
    };
  });
};

const initialState = {
  transactions: storedTransactions,
  balance: storedBalance,
  sortOrder: "newest",
  summary: calculateSummary(storedTransactions), // Calculate summary here
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
      state.transactions = recalculateBalances(state.transactions);
      state.balance =
        state.transactions[state.transactions.length - 1]?.closingBalance || 0;
      state.summary = calculateSummary(state.transactions);

      // Save to localStorage
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
      localStorage.setItem("balance", state.balance.toString());
    },

    deleteTransaction: (state, action) => {
      const id = action.payload;
      state.transactions = state.transactions.filter((t) => t.id !== id);
      state.transactions = recalculateBalances(state.transactions);
      state.balance =
        state.transactions[state.transactions.length - 1]?.closingBalance || 0;
      state.summary = calculateSummary(state.transactions);

      // Save to localStorage
      localStorage.setItem("transactions", JSON.stringify(state.transactions));
      localStorage.setItem("balance", state.balance.toString());
    },

    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === "newest" ? "oldest" : "newest";
    },
  },
});

export const { addTransaction, deleteTransaction, toggleSortOrder } =
  transactionsSlice.actions;

export const selectTransactions = (state) => state.transactions.transactions;
export const selectBalance = (state) => state.transactions.balance;
export const selectSummary = (state) => state.transactions.summary;
export const selectSortOrder = (state) => state.transactions.sortOrder;

export default transactionsSlice.reducer;
