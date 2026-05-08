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
  under: "bg-income-light/40 text-income-dark",
  near: "bg-yellow-100 text-yellow-800",
  over: "bg-expense-light/50 text-expense-dark",
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
      <div className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-card">
        <h3 className="text-lg font-semibold text-primary-700">Budget Alerts</h3>
        <p className="mt-2 text-sm text-gray-500">
          No budgets are set for {month}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-card">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-primary-700">Budget Alerts</h3>
        <div className="text-sm font-medium text-gray-500">
          {formatCurrency(summary.totalSpent)} of{" "}
          {formatCurrency(summary.totalLimit)}
        </div>
      </div>
      <div className={compact ? "space-y-3" : "grid gap-3 md:grid-cols-2"}>
        {progress.slice(0, compact ? 4 : progress.length).map((budget) => (
          <div key={budget.id} className="rounded-xl border border-primary-100 p-3">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-primary-800">
                  {budget.category?.name || "Category"}
                </div>
                {budget.subcategory && (
                  <div className="text-xs text-gray-500">
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
            <div className="h-2 overflow-hidden rounded-full bg-primary-100">
              <div
                className={
                  budget.status === "over"
                    ? "h-full bg-expense"
                    : budget.status === "near"
                      ? "h-full bg-yellow-500"
                      : "h-full bg-income"
                }
                style={{ width: `${Math.min(budget.progressPercent, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-600">
              <span>{formatCurrency(budget.spentAmount)} spent</span>
              <span>{formatCurrency(budget.remainingAmount)} left</span>
            </div>
          </div>
        ))}
      </div>
      {compact && progress.length > 4 && (
        <div className="mt-3 text-sm font-medium text-primary-700">
          {progress.length - 4} more budgets
        </div>
      )}
    </div>
  );
}
