import { useMemo } from "react";
import {
  buildBudgetProgress,
  summarizeBudgetProgress,
} from "../../lib/budgetAnalytics";
import type { Budget, MoneyTransaction } from "../../types/money";
import { formatCurrency } from "../../utils/formatters";

type BudgetSummaryProps = {
  budgets: Budget[];
  transactions: MoneyTransaction[];
  month: string;
  compact?: boolean;
};

const statusStyles = {
  under: "bg-[#dcfaf8] text-[#16dbcc]",
  near: "bg-[#fff5d9] text-[#ffbb38]",
  over: "bg-[#ffe0eb] text-[#ff4b4a]",
};

export default function BudgetSummary({
  budgets,
  transactions,
  month,
  compact = false,
}: BudgetSummaryProps) {
  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === month),
    [budgets, month],
  );
  const progress = useMemo(
    () => buildBudgetProgress(visibleBudgets, transactions),
    [transactions, visibleBudgets],
  );
  const summary = useMemo(() => summarizeBudgetProgress(progress), [progress]);

  if (visibleBudgets.length === 0) {
    return (
      <div className="rounded-[25px] bg-white p-5">
        <h3 className="text-[22px] font-semibold text-[#343c6a]">Budget Alerts</h3>
        <p className="mt-2 text-sm text-[#718ebf]">
          No budgets are set for {month}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[25px] bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[22px] font-semibold text-[#343c6a]">Budget Alerts</h3>
        <div className="text-sm font-medium text-[#718ebf]">
          {formatCurrency(summary.totalSpent)} of{" "}
          {formatCurrency(summary.totalLimit)}
        </div>
      </div>
      <div className={compact ? "space-y-3" : "grid gap-3 md:grid-cols-2"}>
        {progress.slice(0, compact ? 4 : progress.length).map((budget) => (
          <div key={budget.id} className="rounded-[18px] border border-[#e6eff5] p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[#343c6a]">
                  {budget.category?.name || "Category"}
                </div>
                {budget.subcategory && (
                  <div className="text-xs text-[#718ebf]">
                    {budget.subcategory.name}
                  </div>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[budget.status]}`}
              >
                {budget.status}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f5f7fa]">
              <div
                className={
                  budget.status === "over"
                    ? "h-full bg-[#ff4b4a]"
                    : budget.status === "near"
                      ? "h-full bg-[#ffbb38]"
                      : "h-full bg-[#16dbcc]"
                }
                style={{ width: `${Math.min(budget.progressPercent, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#718ebf]">
              <span>{formatCurrency(budget.spentAmount)} spent</span>
              <span>{formatCurrency(budget.remainingAmount)} left</span>
            </div>
          </div>
        ))}
      </div>
      {compact && progress.length > 4 && (
        <div className="mt-3 text-sm font-medium text-[#343c6a]">
          {progress.length - 4} more budgets
        </div>
      )}
    </div>
  );
}
