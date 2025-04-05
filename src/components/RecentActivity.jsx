import { memo } from "react";

const RecentActivity = ({ transactions, formatDate }) => {
  // Get the 3 most recent transactions
  const recentTransactions = transactions.slice(-3).reverse();

  return (
    <div className="h-full rounded-2xl border-r-4 border-primary-500 bg-white/90 p-6 shadow-card backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <h3 className="mb-6 border-b border-primary-100 pb-3 text-xl font-semibold text-primary-700">
        Recent Activity
      </h3>
      {transactions.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center">
          <svg
            className="animate-bounce-slow mb-4 h-16 w-16 text-primary-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mb-2 text-center text-gray-500">No transactions yet.</p>
          <p className="text-sm font-medium text-primary-600">
            Add your first transaction to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <ActivityItem
              key={transaction.id}
              transaction={transaction}
              formatDate={formatDate}
            />
          ))}
          <div className="pt-4 text-center">
            <span className="inline-block cursor-pointer border-b border-dashed border-primary-300 text-sm font-medium text-primary-600 transition-colors hover:scale-105 hover:border-primary-600 hover:text-primary-800 hover:shadow-sm">
              See all transactions below
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoized individual activity item component
const ActivityItem = memo(({ transaction, formatDate }) => {
  return (
    <div
      className={`flex transform items-center justify-between rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        transaction.type === "income"
          ? "border-l-4 border-income bg-gradient-to-r from-income-light/40 to-white"
          : "border-l-4 border-expense bg-gradient-to-r from-expense-light/40 to-white"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`mr-3 rounded-lg p-3 shadow-md ${
            transaction.type === "income"
              ? "bg-gradient-to-br from-income to-income-dark text-white"
              : "bg-gradient-to-br from-expense to-expense-dark text-white"
          }`}
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            {transaction.type === "income" ? (
              <path
                fillRule="evenodd"
                d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </div>
        <div>
          <div className="text-sm text-gray-500">
            {formatDate(transaction.transactionDate)}
          </div>
          <div className="font-medium capitalize">{transaction.category}</div>
          {transaction.note && (
            <div className="mt-0.5 max-w-[150px] truncate text-xs text-gray-500">
              {transaction.note}
            </div>
          )}
        </div>
      </div>
      <div
        className={`font-bold ${transaction.type === "income" ? "text-income-dark" : "text-expense-dark"}`}
      >
        {transaction.type === "income" ? "+" : "-"}₹
        {transaction.amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })}
      </div>
    </div>
  );
});

// Export memoized component
export default memo(RecentActivity);
