import type { Budget, MoneyTransaction } from "@/types/money";
import { toAmount } from "./moneyCalculations.ts";

export type BudgetAlertStatus = "under" | "near" | "over";

export type BudgetProgress = Budget & {
  spentAmount: number;
  remainingAmount: number;
  progressPercent: number;
  status: BudgetAlertStatus;
};

export const getCurrentBudgetMonth = (now = new Date()) => {
  const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, "0")}`;
};

const isBudgetTransaction = (
  transaction: MoneyTransaction,
  budget: Budget,
) => {
  if (transaction.type !== "expense") {
    return false;
  }

  if (transaction.transactionDate.slice(0, 7) !== budget.month) {
    return false;
  }

  if (transaction.categoryId !== budget.categoryId) {
    return false;
  }

  if (budget.subcategoryId && transaction.subcategoryId !== budget.subcategoryId) {
    return false;
  }

  return true;
};

export const getBudgetStatus = (
  spentAmount: number,
  limitAmount: number,
  alertThreshold: number,
): BudgetAlertStatus => {
  if (spentAmount > limitAmount) {
    return "over";
  }

  const thresholdAmount = limitAmount * (alertThreshold / 100);
  return spentAmount >= thresholdAmount ? "near" : "under";
};

export const buildBudgetProgress = (
  budgets: Budget[],
  transactions: MoneyTransaction[],
): BudgetProgress[] =>
  budgets.map((budget) => {
    const spentAmount = transactions
      .filter((transaction) => isBudgetTransaction(transaction, budget))
      .reduce((sum, transaction) => sum + toAmount(transaction.amount), 0);
    const limitAmount = toAmount(budget.limitAmount);
    const progressPercent =
      limitAmount > 0 ? Math.min((spentAmount / limitAmount) * 100, 999) : 0;

    return {
      ...budget,
      spentAmount,
      remainingAmount: limitAmount - spentAmount,
      progressPercent,
      status: getBudgetStatus(
        spentAmount,
        limitAmount,
        budget.alertThreshold,
      ),
    };
  });

export const summarizeBudgetProgress = (progress: BudgetProgress[]) => ({
  totalLimit: progress.reduce((sum, budget) => sum + toAmount(budget.limitAmount), 0),
  totalSpent: progress.reduce((sum, budget) => sum + budget.spentAmount, 0),
  overBudgetCount: progress.filter((budget) => budget.status === "over").length,
  nearBudgetCount: progress.filter((budget) => budget.status === "near").length,
});
