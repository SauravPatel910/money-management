import { memo } from "react";

const TransactionHistory = ({
  transactions,
  sortOrder,
  toggleSortOrder,
  formatDate,
  deleteTransaction,
  sortTransactions,
}) => {
  // Get sorted transactions
  const sortedTransactions = sortTransactions(transactions);

  return (
    <div className="rounded-2xl border-t-4 border-primary-500 bg-white/90 p-6 shadow-card backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary-700">
          Transaction History
        </h3>
        <button
          className="flex transform items-center rounded-lg bg-gradient-to-r from-primary-400 to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:-translate-y-0.5 hover:from-primary-500 hover:to-primary-600 hover:shadow-lg"
          onClick={toggleSortOrder}
        >
          <svg
            className="mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
          </svg>
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
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
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mb-2 text-center text-gray-500">
            No transactions found.
          </p>
          <p className="text-sm font-medium text-primary-600">
            Add some to get started!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 shadow-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-primary-300/70 to-primary-100/70">
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Transaction Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Entry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Note
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-primary-800 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {sortedTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  formatDate={formatDate}
                  deleteTransaction={deleteTransaction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Memoized individual transaction row component
const TransactionRow = memo(
  ({ transaction, formatDate, deleteTransaction }) => {
    return (
      <tr
        className={`transition-colors duration-150 hover:bg-gray-50 ${
          transaction.type === "income"
            ? "bg-gradient-to-r from-income-light/20 to-transparent"
            : "bg-gradient-to-r from-expense-light/20 to-transparent"
        }`}
      >
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          {formatDate(transaction.transactionDate)}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          {formatDate(transaction.entryDate)}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap capitalize">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium shadow-sm ${
              transaction.type === "income"
                ? "bg-gradient-to-r from-income to-income-dark text-white"
                : "bg-gradient-to-r from-expense to-expense-dark text-white"
            }`}
          >
            {transaction.type}
          </span>
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap capitalize">
          {transaction.category}
        </td>
        <td
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            transaction.type === "income"
              ? "text-income-dark"
              : "text-expense-dark"
          }`}
        >
          {transaction.type === "income" ? "+" : "-"}₹
          {transaction.amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </td>
        <td className="max-w-xs truncate px-4 py-3 text-sm">
          {transaction.note || "-"}
        </td>
        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-primary-700">
          ₹
          {transaction.closingBalance.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          <button
            className="transform rounded-lg bg-gradient-to-r from-expense to-expense-dark px-3 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
            onClick={() => deleteTransaction(transaction.id)}
          >
            <svg
              className="mr-1 inline h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Delete
          </button>
        </td>
      </tr>
    );
  },
);

// Export memoized component
export default memo(TransactionHistory);
