import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "@tanstack/react-router";
import {
  selectTransactionsStatus,
  selectTransactionsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
} from "../store/transactionsSlice";
import AccountManager from "../components/accounts/AccountManager";
import BalanceCard from "../components/accounts/BalanceCard";

function Accounts() {
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

  // Show loading state
  if (status === "loading") {
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
            Loading account information...
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
          <h2 className="mb-2 text-xl font-bold">Error Loading Account Data</h2>
          <p>
            {error || "There was an error loading your account information."}
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
          Account Management
        </h1>
        <div className="flex gap-2">
          <Link
            to="/"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Dashboard
          </Link>
          <Link
            to="/transactions"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Transaction History
          </Link>
        </div>
      </div>

      <BalanceCard />

      <div className="mt-8">
        <AccountManager />
      </div>
    </div>
  );
}

export default Accounts;
