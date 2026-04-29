import { Fragment, memo, useMemo, useState } from "react";
import { useAppSelector } from "../../config/reduxStore";
import {
  selectAccounts,
  selectCategories,
} from "../../store/transactionsSlice";
import type {
  Account,
  MoneyTransaction,
  TransactionEditChangedField,
  TransactionEditHistory as TransactionEditHistoryRecord,
} from "../../types/money";
import { formatCurrency } from "../../utils/formatters";

type SortOrder = "newest" | "oldest";
type FormatDate = (dateString: string, timeString?: string) => string;
type GetAccountName = (accountId: string) => string;
type GetCategoryName = (categoryId: string) => string;
type AccountSummary = Pick<Account, "id" | "name">;

type TransactionHistoryProps = {
  transactions: MoneyTransaction[];
  sortOrder: SortOrder;
  toggleSortOrder: () => void;
  formatDate: FormatDate;
  editTransaction?: (transaction: MoneyTransaction) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionHistory: (id: string) => void;
  expandedHistoryTransactionId: string | null;
  selectedEditHistory: TransactionEditHistoryRecord[];
  selectedEditHistoryStatus: "idle" | "loading" | "succeeded" | "failed";
  selectedEditHistoryError: string | null;
  sortedTransactions: MoneyTransaction[];
};

const TransactionHistory = ({
  transactions,
  sortOrder,
  toggleSortOrder,
  formatDate,
  editTransaction,
  deleteTransaction,
  toggleTransactionHistory,
  expandedHistoryTransactionId,
  selectedEditHistory,
  selectedEditHistoryStatus,
  selectedEditHistoryError,
  sortedTransactions,
}: TransactionHistoryProps) => {
  const accounts = useAppSelector(selectAccounts);
  const categories = useAppSelector(selectCategories);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const accountSummaries = useMemo<AccountSummary[]>(
    () => accounts.map(({ id, name }) => ({ id, name })),
    [accounts],
  );
  const getAccountName = useMemo<GetAccountName>(
    () => (accountId) => accountNameById.get(accountId) || accountId,
    [accountNameById],
  );
  const getCategoryName = useMemo<GetCategoryName>(
    () => (categoryId) => categoryNameById.get(categoryId) || categoryId,
    [categoryNameById],
  );
  const filteredTransactions = useMemo(
    () =>
      sortedTransactions.filter((transaction) => {
        if (dateFrom && transaction.transactionDate < dateFrom) {
          return false;
        }

        if (dateTo && transaction.transactionDate > dateTo) {
          return false;
        }

        return true;
      }),
    [dateFrom, dateTo, sortedTransactions],
  );

  return (
    <div className="rounded-2xl border-t-4 border-primary-500 bg-white/90 p-6 shadow-card backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary-700">
          Transaction History
        </h3>
        <button
          className="flex transform items-center rounded-lg bg-linear-to-r from-primary-400 to-primary-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors hover:-translate-y-0.5 hover:from-primary-500 hover:to-primary-600 hover:shadow-lg"
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

      {transactions.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-primary-100 bg-primary-50/40 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium text-primary-700">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 w-full rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
            />
          </label>
          <label className="text-sm font-medium text-primary-700">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 w-full rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
            />
          </label>
          <button
            type="button"
            className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </button>
        </div>
      )}

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
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-primary-100 bg-white/70 py-12">
          <p className="mb-2 text-center text-gray-500">
            No transactions match the selected dates.
          </p>
          <button
            type="button"
            className="text-sm font-medium text-primary-600"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 shadow-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-linear-to-r from-primary-300/70 to-primary-100/70">
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
                  Details
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
              {filteredTransactions.map((transaction) => (
                <Fragment key={transaction.id}>
                  <TransactionRow
                    transaction={transaction}
                    formatDate={formatDate}
                    editTransaction={editTransaction}
                    deleteTransaction={deleteTransaction}
                    toggleTransactionHistory={toggleTransactionHistory}
                    isHistoryOpen={
                      expandedHistoryTransactionId === transaction.id
                    }
                    getAccountName={getAccountName}
                    getCategoryName={getCategoryName}
                    accounts={accountSummaries}
                  />
                  {expandedHistoryTransactionId === transaction.id && (
                    <TransactionEditHistoryRow
                      history={selectedEditHistory}
                      status={selectedEditHistoryStatus}
                      error={selectedEditHistoryError}
                      formatDate={formatDate}
                      getAccountName={getAccountName}
                      getCategoryName={getCategoryName}
                    />
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Function to get the background color based on transaction type
const getRowBackgroundColor = (transaction: MoneyTransaction) => {
  if (transaction.type === "income") {
    return "bg-linear-to-r from-income-light/20 to-transparent";
  } else if (transaction.type === "expense") {
    return "bg-linear-to-r from-expense-light/20 to-transparent";
  } else if (transaction.type === "transfer") {
    return "bg-linear-to-r from-primary-100/30 to-transparent";
  } else if (transaction.type === "person") {
    return transaction.direction === "to"
      ? "bg-linear-to-r from-expense-light/20 to-transparent"
      : "bg-linear-to-r from-income-light/20 to-transparent";
  }
  return "";
};

// Function to get the type badge styles
const getTypeBadgeStyles = (transaction: MoneyTransaction) => {
  if (transaction.type === "income") {
    return "bg-linear-to-r from-income to-income-dark text-white";
  } else if (transaction.type === "expense") {
    return "bg-linear-to-r from-expense to-expense-dark text-white";
  } else if (transaction.type === "transfer") {
    return "bg-linear-to-r from-primary-500 to-primary-600 text-white";
  } else if (transaction.type === "person") {
    return transaction.direction === "to"
      ? "bg-linear-to-r from-expense to-expense-dark text-white"
      : "bg-linear-to-r from-income to-income-dark text-white";
  }
  return "";
};

// Function to get transaction details
const getTransactionDetails = (
  transaction: MoneyTransaction,
  getAccountName: GetAccountName,
) => {
  if (transaction.type === "income" || transaction.type === "expense") {
    return getAccountName(transaction.account || "cash");
  } else if (transaction.type === "transfer") {
    return `${getAccountName(transaction.from || "cash")} → ${getAccountName(transaction.to || "bank")}`;
  } else if (transaction.type === "person") {
    return transaction.direction === "to"
      ? `to ${transaction.person} from ${getAccountName(transaction.account || "cash")}`
      : `from ${transaction.person} to ${getAccountName(transaction.account || "cash")}`;
  }
  return "";
};

// Function to get amount display styles
const getAmountStyles = (transaction: MoneyTransaction) => {
  if (transaction.type === "income") {
    return "text-income-dark";
  } else if (transaction.type === "expense") {
    return "text-expense-dark";
  } else if (transaction.type === "transfer") {
    return "text-primary-700";
  } else if (transaction.type === "person") {
    return transaction.direction === "to"
      ? "text-expense-dark"
      : "text-income-dark";
  }
  return "";
};

// Function to get amount prefix (+ or -)
const getAmountPrefix = (transaction: MoneyTransaction) => {
  if (transaction.type === "income") {
    return "+";
  } else if (transaction.type === "expense") {
    return "-";
  } else if (transaction.type === "transfer") {
    return "↔";
  } else if (transaction.type === "person") {
    return transaction.direction === "to" ? "-" : "+";
  }
  return "";
};

const getChangedAccountIds = (transaction: MoneyTransaction) => {
  const changedAccounts: string[] = [];

  if (transaction.account) {
    changedAccounts.push(transaction.account);
  }

  if (transaction.type === "transfer") {
    if (transaction.from && !changedAccounts.includes(transaction.from)) {
      changedAccounts.push(transaction.from);
    }
    if (transaction.to && !changedAccounts.includes(transaction.to)) {
      changedAccounts.push(transaction.to);
    }
  }

  return changedAccounts;
};

const getTotalBalanceAtTransaction = (transaction: MoneyTransaction) =>
  transaction.totalBalance ||
  Object.values(transaction.accountBalances || {}).reduce(
    (sum, balance) => sum + balance,
    0,
  );

const HISTORY_FIELD_LABELS: Record<string, string> = {
  type: "Type",
  amount: "Amount",
  account: "Account",
  from: "From",
  to: "To",
  direction: "Direction",
  person: "Person",
  note: "Note",
  categoryId: "Category",
  subcategoryId: "Subcategory",
  transactionDate: "Transaction date",
  transactionTime: "Transaction time",
  entryDate: "Entry date",
  entryTime: "Entry time",
};

const formatHistoryValue = (
  field: string,
  value: TransactionEditChangedField["before"],
  formatDate: FormatDate,
  getAccountName: GetAccountName,
  getCategoryName: GetCategoryName,
) => {
  if (value === null || value === "") {
    return "-";
  }

  if (field === "amount") {
    return formatCurrency(Number(value));
  }

  if (field === "account" || field === "from" || field === "to") {
    return getAccountName(String(value));
  }

  if (field === "categoryId" || field === "subcategoryId") {
    return getCategoryName(String(value));
  }

  if (field === "transactionDate") {
    return formatDate(String(value));
  }

  if (field === "entryDate") {
    return formatDate(String(value));
  }

  return String(value);
};

const formatEditedAt = (editedAt: string) =>
  new Date(editedAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const TransactionEditHistoryRow = ({
  history,
  status,
  error,
  formatDate,
  getAccountName,
  getCategoryName,
}: {
  history: TransactionEditHistoryRecord[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  formatDate: FormatDate;
  getAccountName: GetAccountName;
  getCategoryName: GetCategoryName;
}) => (
  <tr className="bg-primary-50/50">
    <td colSpan={9} className="px-4 py-4">
      <div className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-primary-700">
            Edit history
          </h4>
          <span className="text-xs font-medium text-gray-500">
            {history.length} {history.length === 1 ? "edit" : "edits"}
          </span>
        </div>

        {status === "loading" ? (
          <p className="text-sm text-gray-500">Loading history...</p>
        ) : status === "failed" ? (
          <p className="text-sm text-expense-dark">
            {error || "Failed to load edit history."}
          </p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500">No edits yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((historyItem) => (
              <div
                key={historyItem.id}
                className="rounded-lg border border-primary-100 bg-primary-50/30 p-3"
              >
                <div className="mb-2 text-xs font-semibold text-primary-700">
                  Edited at {formatEditedAt(historyItem.editedAt)}
                </div>
                {historyItem.changedFields.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Only automatic metadata changed.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {historyItem.changedFields.map((change) => (
                      <div
                        key={`${historyItem.id}-${change.field}`}
                        className="grid gap-1 rounded-md bg-white px-3 py-2 text-xs sm:grid-cols-[140px_1fr_1fr] sm:items-center"
                      >
                        <span className="font-semibold text-gray-700">
                          {HISTORY_FIELD_LABELS[change.field] || change.field}
                        </span>
                        <span className="text-gray-500">
                          Before:{" "}
                          <span className="font-medium text-gray-700">
                            {formatHistoryValue(
                              change.field,
                              change.before,
                              formatDate,
                              getAccountName,
                              getCategoryName,
                            )}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          After:{" "}
                          <span className="font-medium text-primary-700">
                            {formatHistoryValue(
                              change.field,
                              change.after,
                              formatDate,
                              getAccountName,
                              getCategoryName,
                            )}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </td>
  </tr>
);

// Memoized individual transaction row component
const TransactionRow = memo(
  ({
    transaction,
    formatDate,
    editTransaction,
    deleteTransaction,
    toggleTransactionHistory,
    isHistoryOpen,
    getAccountName,
    getCategoryName,
    accounts,
  }: {
    transaction: MoneyTransaction;
    formatDate: FormatDate;
    editTransaction?: (transaction: MoneyTransaction) => void;
    deleteTransaction: (id: string) => void;
    toggleTransactionHistory: (id: string) => void;
    isHistoryOpen: boolean;
    getAccountName: GetAccountName;
    getCategoryName: GetCategoryName;
    accounts: AccountSummary[];
  }) => {
    const changedAccountIds = getChangedAccountIds(transaction);
    const totalBalanceAtTransaction = getTotalBalanceAtTransaction(transaction);

    return (
      <tr
        className={`transition-colors duration-150 hover:bg-gray-50 ${getRowBackgroundColor(
          transaction,
        )}`}
      >
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          {formatDate(transaction.transactionDate, transaction.transactionTime)}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          {formatDate(transaction.entryDate, transaction.entryTime)}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap capitalize">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium shadow-sm ${getTypeBadgeStyles(
              transaction,
            )}`}
          >
            {transaction.type === "person"
              ? transaction.direction === "to"
                ? "paid"
                : "received"
              : transaction.type}
          </span>
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap capitalize">
          {getTransactionDetails(transaction, getAccountName)}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          <div className="font-medium text-primary-700">
            {transaction.categoryId
              ? getCategoryName(transaction.categoryId)
              : transaction.category?.name || "-"}
          </div>
          {transaction.subcategoryId && (
            <div className="text-xs text-gray-500">
              {getCategoryName(transaction.subcategoryId)}
            </div>
          )}
        </td>
        <td
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${getAmountStyles(
            transaction,
          )}`}
        >
          {getAmountPrefix(transaction)}
          {formatCurrency(transaction.amount)}
        </td>
        <td className="max-w-xs truncate px-4 py-3 text-sm">
          {transaction.note || "-"}
        </td>
        <td className="group relative px-4 py-3 text-sm">
          {/* Compact balance display with hover effect */}
          <div className="relative">
            {/* Default view - only show changed accounts + total */}
            <div className="flex flex-col space-y-1">
              {/* Only show accounts that were affected by this transaction */}
              {changedAccountIds.map((accountId) => (
                <div
                  key={accountId}
                  className="flex items-center justify-between whitespace-nowrap"
                >
                  <span className="max-w-20 truncate text-xs font-medium text-gray-600">
                    {getAccountName(accountId)}:
                  </span>
                  <span className="ml-1 text-xs font-medium text-primary-700">
                    {formatCurrency(
                      transaction.accountBalances?.[accountId] || 0,
                    )}
                  </span>
                </div>
              ))}

              {/* Total balance - always visible */}
              <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-1 whitespace-nowrap">
                <span className="text-xs font-semibold text-gray-700">
                  Total:
                </span>
                <span className="text-xs font-bold text-primary-700">
                  {formatCurrency(totalBalanceAtTransaction)}
                </span>
              </div>
            </div>

            {/* Hover tooltip with all account balances */}
            <div className="invisible absolute top-0 right-0 z-50 min-w-50 origin-top-right transform rounded-md border border-primary-100 bg-white p-3 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="mb-2 flex items-center justify-between border-b border-primary-100 pb-1">
                <span className="text-xs font-bold text-primary-600">
                  Account
                </span>
                <span className="text-xs font-bold text-primary-600">
                  Balance
                </span>
              </div>

              <div className="max-h-45 space-y-2 overflow-y-auto pr-1">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between whitespace-nowrap"
                  >
                    <span className="text-xs font-medium text-gray-600">
                      {account.name}:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        // Highlight accounts that were changed in this transaction
                        transaction.account === account.id ||
                        transaction.from === account.id ||
                        transaction.to === account.id
                          ? "font-semibold text-primary-700"
                          : "text-gray-600"
                      }`}
                    >
                      {formatCurrency(
                        transaction.accountBalances?.[account.id] || 0,
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-primary-100 pt-2">
                <span className="text-xs font-bold text-primary-700">
                  Total:
                </span>
                <span className="text-xs font-bold text-primary-700">
                  {formatCurrency(totalBalanceAtTransaction)}
                </span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          <button
            className="mr-2 transform rounded-lg border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-primary-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-md"
            onClick={() => toggleTransactionHistory(transaction.id)}
          >
            {isHistoryOpen ? "Hide" : "History"}
          </button>
          {editTransaction && (
            <button
              className="mr-2 transform rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
              onClick={() => editTransaction(transaction)}
            >
              <svg
                className="mr-1 inline h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  clipRule="evenodd"
                />
              </svg>
              Edit
            </button>
          )}
          <button
            className="transform rounded-lg bg-linear-to-r from-expense to-expense-dark px-3 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md"
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
