import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "@tanstack/react-router";
import {
  toggleSortOrder as toggleSortOrderAction,
  deleteTransaction as deleteTransactionAction,
  selectTransactions,
  selectSortOrder,
} from "../store/transactionsSlice";
import TransactionHistory from "../components/TransactionHistory";

function TransactionHistoryPage() {
  const transactions = useSelector(selectTransactions);
  const sortOrder = useSelector(selectSortOrder);
  const dispatch = useDispatch();

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
      dispatch(deleteTransactionAction(id));
    },
    [dispatch],
  );

  // Memoized sorted transactions
  const sortedTransactions = () => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);

      // If dates are equal, sort by ID (newest added first if sorting by newest)
      if (dateA.getTime() === dateB.getTime()) {
        // ID is a timestamp when the transaction was added
        return sortOrder === "newest" ? b.id - a.id : a.id - b.id;
      }

      // Otherwise sort by date
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  };

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
