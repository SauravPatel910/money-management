import { memo } from "react";
import { useAppSelector } from "../../config/reduxStore";
import { selectCategories } from "../../store/transactionsSlice";
import type { MoneyTransaction } from "../../types/money";
import { formatCurrency } from "../../utils/formatters";

type FormatDate = (dateString: string, timeString?: string) => string;

type RecentActivityProps = {
  transactions: MoneyTransaction[];
  formatDate: FormatDate;
};

const getAmountMeta = (transaction: MoneyTransaction) => {
  if (transaction.type === "income") {
    return { prefix: "+", className: "text-[#41d4a8]" };
  }

  if (transaction.type === "expense") {
    return { prefix: "-", className: "text-[#ff4b4a]" };
  }

  if (transaction.type === "person") {
    return transaction.direction === "to"
      ? { prefix: "-", className: "text-[#ff4b4a]" }
      : { prefix: "+", className: "text-[#41d4a8]" };
  }

  return { prefix: "", className: "text-[#1814f3]" };
};

const getIconStyles = (transaction: MoneyTransaction) => {
  if (transaction.type === "income") {
    return "bg-[#dcfaf8] text-[#16dbcc]";
  }

  if (transaction.type === "expense") {
    return "bg-[#fff5d9] text-[#ffbb38]";
  }

  if (transaction.type === "person") {
    return transaction.direction === "to"
      ? "bg-[#ffe0eb] text-[#ff82ac]"
      : "bg-[#dcfaf8] text-[#16dbcc]";
  }

  return "bg-[#e7edff] text-[#396aff]";
};

const RecentActivity = ({ transactions, formatDate }: RecentActivityProps) => {
  const categories = useAppSelector(selectCategories);
  const recentTransactions = transactions.slice(-3).reverse();
  const getCategoryName = (categoryId?: string | null) =>
    categories.find((category) => category.id === categoryId)?.name || "";

  return (
    <section>
      <h2 className="mb-4 text-[22px] font-semibold text-[#343c6a]">
        Recent Transaction
      </h2>
      <div className="min-h-[235px] rounded-[25px] bg-white p-6">
        {recentTransactions.length === 0 ? (
          <div className="flex h-[187px] items-center justify-center text-sm font-medium text-[#718ebf]">
            No transactions yet.
          </div>
        ) : (
          <div className="space-y-5">
            {recentTransactions.map((transaction) => {
              const amountMeta = getAmountMeta(transaction);
              const categoryName = getCategoryName(transaction.categoryId);
              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-[55px_minmax(0,1fr)_auto] items-center gap-4"
                >
                  <div
                    className={`grid h-[55px] w-[55px] place-items-center rounded-full ${getIconStyles(transaction)}`}
                  >
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {transaction.type === "expense" ? (
                        <path d="M12 5v14m0-14 5 5m-5-5-5 5" />
                      ) : transaction.type === "income" ? (
                        <path d="M12 19V5m0 14 5-5m-5 5-5-5" />
                      ) : (
                        <path d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3 3m-3-3 3-3" />
                      )}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-[#232323]">
                      {transaction.note || categoryName || transaction.type}
                    </p>
                    <p className="mt-1 truncate text-[15px] text-[#718ebf]">
                      {formatDate(
                        transaction.transactionDate,
                        transaction.transactionTime,
                      )}
                    </p>
                  </div>
                  <p
                    className={`text-right text-base font-medium ${amountMeta.className}`}
                  >
                    {amountMeta.prefix}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default memo(RecentActivity);
