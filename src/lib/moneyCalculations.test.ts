import assert from "node:assert/strict";
import test from "node:test";
import { recalculateBalances } from "./moneyCalculations.ts";
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
