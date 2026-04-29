import type { MoneyTransaction, TransactionType } from "@/types/money";
import { sortTransactionsChronologically, toAmount } from "./moneyCalculations.ts";

export type CategoryBreakdownItem = {
  categoryId: string;
  categoryName: string;
  income: number;
  expense: number;
};

export type MonthlyCashflowItem = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type BalanceTrendItem = {
  date: string;
  balance: number;
};

export type TypeMixItem = {
  type: TransactionType;
  count: number;
  amount: number;
};

const getTransactionImpact = (transaction: MoneyTransaction) => {
  const amount = toAmount(transaction.amount);

  if (transaction.type === "income") {
    return { income: amount, expense: 0 };
  }

  if (transaction.type === "expense") {
    return { income: 0, expense: amount };
  }

  if (transaction.type === "person") {
    return transaction.direction === "from"
      ? { income: amount, expense: 0 }
      : { income: 0, expense: amount };
  }

  return { income: 0, expense: 0 };
};

export const buildCategoryBreakdown = (
  transactions: MoneyTransaction[],
): CategoryBreakdownItem[] => {
  const breakdown = new Map<string, CategoryBreakdownItem>();

  transactions.forEach((transaction) => {
    if (transaction.type !== "income" && transaction.type !== "expense") {
      return;
    }

    const categoryId = transaction.categoryId || "uncategorized";
    const existing = breakdown.get(categoryId) || {
      categoryId,
      categoryName: transaction.category?.name || "Uncategorized",
      income: 0,
      expense: 0,
    };
    const amount = toAmount(transaction.amount);

    if (transaction.type === "income") {
      existing.income += amount;
    } else {
      existing.expense += amount;
    }

    breakdown.set(categoryId, existing);
  });

  return [...breakdown.values()].sort(
    (a, b) => b.income + b.expense - (a.income + a.expense),
  );
};

export const buildMonthlyCashflow = (
  transactions: MoneyTransaction[],
): MonthlyCashflowItem[] => {
  const months = new Map<string, MonthlyCashflowItem>();

  transactions.forEach((transaction) => {
    const month = transaction.transactionDate.slice(0, 7);
    const existing = months.get(month) || {
      month,
      income: 0,
      expense: 0,
      net: 0,
    };
    const impact = getTransactionImpact(transaction);

    existing.income += impact.income;
    existing.expense += impact.expense;
    existing.net = existing.income - existing.expense;
    months.set(month, existing);
  });

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
};

export const buildBalanceTrend = (
  transactions: MoneyTransaction[],
): BalanceTrendItem[] =>
  sortTransactionsChronologically(transactions).map((transaction) => ({
    date: transaction.transactionDate,
    balance: toAmount(transaction.totalBalance),
  }));

export const buildTransactionTypeMix = (
  transactions: MoneyTransaction[],
): TypeMixItem[] => {
  const order: TransactionType[] = ["income", "expense", "transfer", "person"];
  const mix = new Map<TransactionType, TypeMixItem>(
    order.map((type) => [type, { type, count: 0, amount: 0 }]),
  );

  transactions.forEach((transaction) => {
    const current = mix.get(transaction.type);
    if (!current) {
      return;
    }

    current.count += 1;
    current.amount += toAmount(transaction.amount);
  });

  return order.map((type) => mix.get(type) as TypeMixItem);
};
