import type {
  RecurringBill,
  RecurringBillFrequency,
  RecurringBillInput,
  RecurringBillStatus,
  TransactionInput,
} from "@/types/money";

export const RECURRING_BILL_FREQUENCIES: RecurringBillFrequency[] = [
  "weekly",
  "monthly",
  "yearly",
];

const toDateOnly = (value: string) => value.slice(0, 10);

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  const originalDate = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(originalDate, lastDay));
  return next;
};

export const advanceRecurringBillDueDate = (
  dueDate: string,
  frequency: RecurringBillFrequency,
) => {
  const date = new Date(`${toDateOnly(dueDate)}T00:00:00.000Z`);

  if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
    return toDateOnly(date.toISOString());
  }

  if (frequency === "monthly") {
    return toDateOnly(addMonths(date, 1).toISOString());
  }

  return toDateOnly(addMonths(date, 12).toISOString());
};

export const getRecurringBillStatus = (
  bill: Pick<RecurringBill, "active" | "nextDueDate" | "reminderDays">,
  today = toDateOnly(new Date().toISOString()),
): RecurringBillStatus => {
  if (!bill.active) {
    return "paused";
  }

  const dueDate = toDateOnly(bill.nextDueDate);
  if (dueDate < today) {
    return "overdue";
  }
  if (dueDate === today) {
    return "dueToday";
  }

  const reminderDate = new Date(`${dueDate}T00:00:00.000Z`);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - bill.reminderDays);
  return toDateOnly(reminderDate.toISOString()) <= today ? "upcoming" : "scheduled";
};

export const recurringBillToTransactionInput = (
  bill: Pick<
    RecurringBillInput,
    "name" | "amount" | "account" | "categoryId" | "subcategoryId"
  > & { nextDueDate: string },
  paidDate = toDateOnly(new Date().toISOString()),
): TransactionInput => ({
  type: "expense",
  amount: bill.amount,
  account: bill.account,
  categoryId: bill.categoryId,
  subcategoryId: bill.subcategoryId || "",
  note: `Bill paid: ${bill.name}`,
  transactionDate: toDateOnly(bill.nextDueDate),
  transactionTime: "00:00",
  entryDate: paidDate,
  entryTime: "00:00",
});

export const summarizeRecurringBills = (
  bills: RecurringBill[],
  today = toDateOnly(new Date().toISOString()),
) => {
  const statuses = bills.map((bill) => getRecurringBillStatus(bill, today));
  return {
    total: bills.length,
    dueToday: statuses.filter((status) => status === "dueToday").length,
    overdue: statuses.filter((status) => status === "overdue").length,
    upcoming: statuses.filter((status) => status === "upcoming").length,
    overdueAmount: bills
      .filter((bill, index) => statuses[index] === "overdue")
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
  };
};
