import { memo } from "react";
import { useSelector } from "react-redux";
import {
  selectAccounts,
  selectTotalBalance,
  selectSummary,
} from "../store/transactionsSlice";

const BalanceCard = () => {
  const accounts = useSelector(selectAccounts);
  const totalBalance = useSelector(selectTotalBalance);
  const summary = useSelector(selectSummary);

  // Get cash account for backward compatibility
  const cashAccount = accounts.find((acc) => acc.id === "cash");
  const cashBalance = cashAccount?.balance || 0;

  // Show recent account balance cards - up to 3 in the main view
  const displayAccounts = accounts.slice(0, 3);

  return (
    <div className="mb-8 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg">
        <div className="mb-2 text-primary-200">Total Balance</div>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">₹</span>
          <span className="ml-1 text-5xl font-bold">
            {totalBalance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>

        {accounts.length > 3 && (
          <div className="mt-3 text-primary-100">
            <span className="text-sm font-medium">
              {accounts.length} active accounts
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="col-span-1 flex rounded-2xl bg-gradient-to-br from-income to-income-dark p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg">
          <div className="mr-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div>
            <div className="mb-2 text-income-light">Total Income</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">₹</span>
              <span className="ml-1 text-3xl font-bold">
                {summary.totalIncome.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-1 flex rounded-2xl bg-gradient-to-br from-expense to-expense-dark p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg">
          <div className="mr-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </div>
          <div>
            <div className="mb-2 text-expense-light">Total Expense</div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">₹</span>
              <span className="ml-1 text-3xl font-bold">
                {summary.totalExpense.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* For desktop, show the main cash account in the third column */}
        <div className="col-span-1 hidden rounded-2xl bg-gradient-to-br from-primary-400 to-primary-500 p-6 text-white shadow-card transition-all duration-300 hover:shadow-lg md:flex">
          <div className="mr-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div className="mb-2 text-primary-100">
              {cashAccount?.name || "Cash"}
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold">₹</span>
              <span className="ml-1 text-3xl font-bold">
                {cashBalance.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Display account cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {displayAccounts.map((account) => (
          <div
            key={account.id}
            className="rounded-xl bg-white/90 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="mb-2 flex items-center">
              <div className="mr-3 rounded-lg bg-primary-100 p-2">
                {account.icon === "cash" && (
                  <svg
                    className="h-5 w-5 text-primary-700"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {account.icon === "bank" && (
                  <svg
                    className="h-5 w-5 text-primary-700"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {account.icon === "credit" && (
                  <svg
                    className="h-5 w-5 text-primary-700"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path
                      fillRule="evenodd"
                      d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {account.icon === "savings" && (
                  <svg
                    className="h-5 w-5 text-primary-700"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {account.icon === "investment" && (
                  <svg
                    className="h-5 w-5 text-primary-700"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {account.icon === "wallet" && (
                  <svg
                    className="h-5 w-5 text-primary-700"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                )}
              </div>
              <h4 className="font-medium text-primary-800">{account.name}</h4>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-primary-700">₹</span>
                <span className="ml-1 text-2xl font-bold text-primary-700">
                  {account.balance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(BalanceCard);
