import assert from "node:assert/strict";
import test from "node:test";
import { recalculateBalances } from "./moneyCalculations.ts";
import {
  buildImportPreviewRows,
  buildReportSummary,
  buildBalanceTrend,
  buildCategoryBreakdown,
  buildTransactionDuplicateKey,
  filterTransactionsForReport,
  buildMonthlyCashflow,
  buildTransactionTypeMix,
  rowsToCsv,
} from "./moneyAnalytics.ts";
import {
  buildBudgetProgress,
  getBudgetStatus,
  summarizeBudgetProgress,
} from "./budgetAnalytics.ts";
import type {
  Account,
  Budget,
  MoneyTransaction,
  TransactionCategory,
  TransactionInput,
} from "@/types/money";

const accounts: Account[] = [
  { id: "cash", name: "Cash", balance: 0, icon: "cash" },
  { id: "bank", name: "Bank", balance: 0, icon: "bank" },
];
const categories: TransactionCategory[] = [
  {
    id: "salary",
    type: "income",
    name: "Salary",
    parentId: null,
    isSystem: false,
    sortOrder: 0,
  },
  {
    id: "food",
    type: "expense",
    name: "Food",
    parentId: null,
    isSystem: false,
    sortOrder: 0,
  },
  {
    id: "dinner",
    type: "expense",
    name: "Dinner",
    parentId: "food",
    isSystem: false,
    sortOrder: 0,
  },
];
const budgets: Budget[] = [
  {
    id: "food-budget",
    month: "2026-04",
    categoryId: "food",
    subcategoryId: null,
    limitAmount: 1000,
    alertThreshold: 80,
    category: {
      id: "food",
      type: "expense",
      name: "Food",
      parentId: null,
      isSystem: false,
    },
  },
  {
    id: "dinner-budget",
    month: "2026-04",
    categoryId: "food",
    subcategoryId: "dinner",
    limitAmount: 100,
    alertThreshold: 80,
    category: {
      id: "food",
      type: "expense",
      name: "Food",
      parentId: null,
      isSystem: false,
    },
    subcategory: {
      id: "dinner",
      type: "expense",
      name: "Dinner",
      parentId: "food",
      isSystem: false,
    },
  },
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

test("report filters narrow by date type account and category", () => {
  const rows = [
    transaction({
      type: "income",
      amount: 500,
      account: "cash",
      categoryId: "salary",
      transactionDate: "2026-04-01",
    }),
    transaction({
      type: "expense",
      amount: 125,
      account: "bank",
      categoryId: "food",
      transactionDate: "2026-04-15",
    }),
  ];

  assert.deepEqual(
    filterTransactionsForReport(rows, {
      dateFrom: "2026-04-10",
      type: "expense",
      accountId: "bank",
      categoryId: "food",
    }).map(({ amount }) => amount),
    [125],
  );
});

test("report summary includes income expense net count and current balance", () => {
  const summary = buildReportSummary(
    [
      transaction({ type: "income", amount: 500, account: "cash" }),
      transaction({ type: "expense", amount: 125, account: "cash" }),
      transaction({
        type: "person",
        amount: 50,
        account: "cash",
        direction: "from",
        person: "Asha",
      }),
    ],
    [
      { id: "cash", name: "Cash", balance: 300, icon: "cash" },
      { id: "bank", name: "Bank", balance: 200, icon: "bank" },
    ],
  );

  assert.deepEqual(summary, {
    totalIncome: 550,
    totalExpense: 125,
    netCashflow: 425,
    totalBalance: 500,
    transactionCount: 3,
  });
});

test("csv export escapes commas quotes and line breaks", () => {
  assert.equal(
    rowsToCsv(["note"], [{ note: 'Lunch, "team"\npaid' }]),
    'note\r\n"Lunch, ""team""\npaid"',
  );
});

test("import preview maps names and skips duplicate-looking rows by default", () => {
  const existing = transaction({
    type: "expense",
    amount: 125,
    account: "cash",
    categoryId: "food",
    subcategoryId: "dinner",
    note: "Dinner",
    transactionDate: "2026-04-26",
    transactionTime: "20:00",
  });
  const rows = buildImportPreviewRows({
    rows: [
      {
        type: "expense",
        amount: "125",
        transactionDate: "2026-04-26",
        transactionTime: "20:00",
        account: "Cash",
        category: "Food",
        subcategory: "Dinner",
        note: "Dinner",
      },
      {
        type: "income",
        amount: "500",
        transactionDate: "2026-04-27",
        transactionTime: "09:00",
        account: "Bank",
        category: "Salary",
        note: "Salary",
      },
    ],
    accounts,
    categories,
    existingTransactions: [existing],
  });

  assert.equal(rows[0].status, "duplicate");
  assert.equal(rows[0].include, false);
  assert.equal(rows[1].status, "valid");
  assert.equal(rows[1].include, true);
  assert.equal(rows[1].transaction?.account, "bank");
  assert.equal(rows[1].transaction?.categoryId, "salary");
});

test("duplicate keys normalize note and amount values", () => {
  const first = buildTransactionDuplicateKey(
    transaction({
      type: "expense",
      amount: 125,
      account: "cash",
      categoryId: "food",
      note: " Dinner ",
    }),
  );
  const second = buildTransactionDuplicateKey({
    type: "expense",
    amount: 125.0,
    account: "cash",
    from: null,
    to: null,
    direction: null,
    person: null,
    categoryId: "food",
    subcategoryId: null,
    note: "dinner",
    transactionDate: "2026-04-26",
    transactionTime: "10:00",
  });

  assert.equal(first, second);
});

test("budget progress filters expense transactions by budget month", () => {
  const progress = buildBudgetProgress(
    [budgets[0]],
    [
      transaction({
        type: "expense",
        amount: 200,
        account: "cash",
        categoryId: "food",
        transactionDate: "2026-04-10",
      }),
      transaction({
        type: "expense",
        amount: 300,
        account: "cash",
        categoryId: "food",
        transactionDate: "2026-05-10",
      }),
      transaction({
        type: "income",
        amount: 500,
        account: "cash",
        categoryId: "salary",
        transactionDate: "2026-04-10",
      }),
    ],
  );

  assert.equal(progress[0].spentAmount, 200);
  assert.equal(progress[0].remainingAmount, 800);
  assert.equal(progress[0].progressPercent, 20);
  assert.equal(progress[0].status, "under");
});

test("budget progress can target a subcategory", () => {
  const progress = buildBudgetProgress(
    [budgets[1]],
    [
      transaction({
        type: "expense",
        amount: 75,
        account: "cash",
        categoryId: "food",
        subcategoryId: "dinner",
      }),
      transaction({
        type: "expense",
        amount: 50,
        account: "cash",
        categoryId: "food",
      }),
    ],
  );

  assert.equal(progress[0].spentAmount, 75);
  assert.equal(progress[0].status, "under");
});

test("budget status marks near threshold and over budget", () => {
  assert.equal(getBudgetStatus(799, 1000, 80), "under");
  assert.equal(getBudgetStatus(800, 1000, 80), "near");
  assert.equal(getBudgetStatus(1001, 1000, 80), "over");
});

test("budget summary totals limits and alert counts", () => {
  const summary = summarizeBudgetProgress(
    buildBudgetProgress(budgets, [
      transaction({
        type: "expense",
        amount: 850,
        account: "cash",
        categoryId: "food",
      }),
      transaction({
        type: "expense",
        amount: 125,
        account: "cash",
        categoryId: "food",
        subcategoryId: "dinner",
      }),
    ]),
  );

  assert.deepEqual(summary, {
    totalLimit: 1100,
    totalSpent: 1100,
    overBudgetCount: 1,
    nearBudgetCount: 1,
  });
});
