import assert from "node:assert/strict";
import test from "node:test";
import { recalculateBalances } from "./moneyCalculations.ts";
import {
  buildBalanceTrend,
  buildCategoryBreakdown,
  buildMonthlyCashflow,
  buildTransactionTypeMix,
} from "./moneyAnalytics.ts";
import type { Account, MoneyTransaction, TransactionInput } from "@/types/money";

const accounts: Account[] = [
  { id: "cash", name: "Cash", balance: 0, icon: "cash" },
  { id: "bank", name: "Bank", balance: 0, icon: "bank" },
];

const transaction = (
  overrides: Partial<TransactionInput> & Pick<TransactionInput, "type" | "amount">,
): MoneyTransaction => ({
  id: crypto.randomUUID(),
  type: overrides.type,
  amount: overrides.amount,
  account: overrides.account ?? null,
  from: overrides.from ?? null,
  to: overrides.to ?? null,
  direction: overrides.direction ?? null,
  person: overrides.person ?? null,
  note: overrides.note ?? null,
  categoryId: overrides.categoryId ?? null,
  subcategoryId: overrides.subcategoryId ?? null,
  category: overrides.categoryId
    ? {
        id: overrides.categoryId,
        type: overrides.type,
        name: overrides.categoryId === "salary" ? "Salary" : "Food",
        parentId: null,
        isSystem: false,
      }
    : null,
  transactionDate: overrides.transactionDate ?? "2026-04-26",
  transactionTime: overrides.transactionTime ?? "10:00",
  entryDate: overrides.entryDate ?? "2026-04-26",
  entryTime: overrides.entryTime ?? "10:00",
});

test("income increases account and total balance", () => {
  const { processedTransactions, accountBalances } = recalculateBalances(
    [transaction({ type: "income", amount: 500, account: "cash" })],
    accounts,
  );

  assert.equal(accountBalances.cash, 500);
  assert.equal(processedTransactions.at(-1)?.totalBalance, 500);
});

test("expense decreases account and total balance", () => {
  const { processedTransactions, accountBalances } = recalculateBalances(
    [transaction({ type: "expense", amount: 125, account: "cash" })],
    accounts,
  );

  assert.equal(accountBalances.cash, -125);
  assert.equal(processedTransactions.at(-1)?.totalBalance, -125);
});

test("transfer moves balance between accounts without changing total", () => {
  const { processedTransactions, accountBalances } = recalculateBalances(
    [
      transaction({ type: "income", amount: 500, account: "cash" }),
      transaction({ type: "transfer", amount: 200, from: "cash", to: "bank" }),
    ],
    accounts,
  );

  assert.equal(accountBalances.cash, 300);
  assert.equal(accountBalances.bank, 200);
  assert.equal(processedTransactions.at(-1)?.totalBalance, 500);
});

test("person payment direction to decreases balance", () => {
  const { processedTransactions, accountBalances } = recalculateBalances(
    [
      transaction({
        type: "person",
        amount: 75,
        account: "cash",
        direction: "to",
        person: "Asha",
      }),
    ],
    accounts,
  );

  assert.equal(accountBalances.cash, -75);
  assert.equal(processedTransactions.at(-1)?.totalBalance, -75);
});

test("person payment direction from increases balance", () => {
  const { processedTransactions, accountBalances } = recalculateBalances(
    [
      transaction({
        type: "person",
        amount: 90,
        account: "cash",
        direction: "from",
        person: "Asha",
      }),
    ],
    accounts,
  );

  assert.equal(accountBalances.cash, 90);
  assert.equal(processedTransactions.at(-1)?.totalBalance, 90);
});

test("chronological ordering produces expected running balances", () => {
  const lateExpense = transaction({
    type: "expense",
    amount: 20,
    account: "cash",
    transactionDate: "2026-04-26",
    transactionTime: "12:00",
  });
  const earlyIncome = transaction({
    type: "income",
    amount: 100,
    account: "cash",
    transactionDate: "2026-04-26",
    transactionTime: "09:00",
  });

  const { processedTransactions } = recalculateBalances(
    [lateExpense, earlyIncome],
    accounts,
  );

  assert.deepEqual(
    processedTransactions.map(({ id, totalBalance }) => ({ id, totalBalance })),
    [
      { id: earlyIncome.id, totalBalance: 100 },
      { id: lateExpense.id, totalBalance: 80 },
    ],
  );
});

test("category breakdown totals income and expense categories", () => {
  const breakdown = buildCategoryBreakdown([
    transaction({ type: "income", amount: 500, account: "cash", categoryId: "salary" }),
    transaction({ type: "expense", amount: 125, account: "cash", categoryId: "food" }),
  ]);

  assert.deepEqual(
    breakdown.map(({ categoryName, income, expense }) => ({
      categoryName,
      income,
      expense,
    })),
    [
      { categoryName: "Salary", income: 500, expense: 0 },
      { categoryName: "Food", income: 0, expense: 125 },
    ],
  );
});

test("monthly cashflow includes person payments in income and expense", () => {
  const cashflow = buildMonthlyCashflow([
    transaction({ type: "income", amount: 500, account: "cash" }),
    transaction({ type: "expense", amount: 125, account: "cash" }),
    transaction({
      type: "person",
      amount: 50,
      account: "cash",
      direction: "from",
      person: "Asha",
    }),
  ]);

  assert.deepEqual(cashflow, [
    { month: "2026-04", income: 550, expense: 125, net: 425 },
  ]);
});

test("balance trend uses chronological transaction balances", () => {
  const { processedTransactions } = recalculateBalances(
    [
      transaction({
        type: "expense",
        amount: 20,
        account: "cash",
        transactionTime: "12:00",
      }),
      transaction({
        type: "income",
        amount: 100,
        account: "cash",
        transactionTime: "09:00",
      }),
    ],
    accounts,
  );

  assert.deepEqual(
    buildBalanceTrend(processedTransactions).map(({ balance }) => balance),
    [100, 80],
  );
});

test("transaction type mix tracks count and amount", () => {
  const mix = buildTransactionTypeMix([
    transaction({ type: "income", amount: 500, account: "cash" }),
    transaction({ type: "income", amount: 100, account: "bank" }),
    transaction({ type: "transfer", amount: 50, from: "cash", to: "bank" }),
  ]);

  assert.deepEqual(
    mix.map(({ type, count, amount }) => ({ type, count, amount })),
    [
      { type: "income", count: 2, amount: 600 },
      { type: "expense", count: 0, amount: 0 },
      { type: "transfer", count: 1, amount: 50 },
      { type: "person", count: 0, amount: 0 },
    ],
  );
});
