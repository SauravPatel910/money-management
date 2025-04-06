import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "@tanstack/react-router";
import {
  toggleSortOrder as toggleSortOrderAction,
  deleteTransactionThunk,
  selectTransactions,
  selectSortOrder,
  selectTransactionsStatus,
  selectTransactionsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
} from "../store/transactionsSlice";
import TransactionHistory from "../components/TransactionHistory";

function TransactionHistoryPage() {
  const transactions = useSelector(selectTransactions);
  const sortOrder = useSelector(selectSortOrder);
  const status = useSelector(selectTransactionsStatus);
  const error = useSelector(selectTransactionsError);
  const dispatch = useDispatch();

  // Fetch initial data
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTransactionsThunk());
      dispatch(fetchAccountsThunk());
    }
  }, [status, dispatch]);

  // Memoized formatter function for dates
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Memoized function for toggling sort order
  const handleToggleSortOrder = useCallback(() => {
    dispatch(toggleSortOrderAction());
  }, [dispatch]);

  // Memoized function for deleting transactions
  const handleDeleteTransaction = useCallback(
    (id) => {
      if (confirm("Are you sure you want to delete this transaction?")) {
        dispatch(deleteTransactionThunk(id));
      }
    },
    [dispatch],
  );

  // Memoized sorted transactions
  const sortedTransactions = useCallback(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);

      // If dates are equal, sort by ID (newest added first if sorting by newest)
      if (dateA.getTime() === dateB.getTime()) {
        // ID might be a string from Firebase, so convert to number or compare strings
        const idA = typeof a.id === "string" ? a.id : a.id;
        const idB = typeof b.id === "string" ? b.id : b.id;
        return sortOrder === "newest"
          ? idB > idA
            ? 1
            : -1
          : idA > idB
            ? 1
            : -1;
      }

      // Otherwise sort by date
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, sortOrder]);

  // Show loading state
  if (status === "loading" && transactions.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex h-64 items-center justify-center">
          <div className="text-primary-600">
            <svg className="mr-3 h-10 w-10 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div className="text-lg font-medium text-primary-700">
            Loading transaction history...
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (status === "failed") {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-lg bg-expense-light/50 p-4 text-expense-dark">
          <h2 className="mb-2 text-xl font-bold">Error Loading Transactions</h2>
          <p>
            {error || "There was an error loading your transaction history."}
          </p>
          <button
            onClick={() => {
              dispatch(fetchTransactionsThunk());
              dispatch(fetchAccountsThunk());
            }}
            className="mt-3 rounded-lg bg-primary-500 px-4 py-2 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">
          Transaction History
        </h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Dashboard
          </Link>
          <Link
            to="/accounts"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Manage Accounts
          </Link>
        </div>
      </div>

      <TransactionHistory
        transactions={transactions}
        sortOrder={sortOrder}
        toggleSortOrder={handleToggleSortOrder}
        formatDate={formatDate}
        deleteTransaction={handleDeleteTransaction}
        sortTransactions={sortedTransactions}
      />
    </div>
  );
}

export default TransactionHistoryPage;
