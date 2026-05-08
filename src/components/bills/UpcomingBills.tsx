"use client";

import type { AppDispatch } from "@/config/reduxStore";
import { payRecurringBillThunk } from "@/store/transactionsSlice";
import type { RecurringBill } from "@/types/money";
import {
  getRecurringBillStatus,
  summarizeRecurringBills,
} from "@/lib/recurringBills";
import { formatCurrency } from "@/utils/formatters";

type UpcomingBillsProps = {
  bills: RecurringBill[];
  dispatch: AppDispatch;
  compact?: boolean;
  onMessage?: (message: string) => void;
};

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  upcoming: "Upcoming",
  dueToday: "Due today",
  overdue: "Overdue",
  paused: "Paused",
};

const statusClass = (status: string) => {
  if (status === "overdue") return "bg-expense-light text-expense-dark";
  if (status === "dueToday") return "bg-yellow-100 text-yellow-800";
  if (status === "paused") return "bg-gray-100 text-gray-600";
  return "bg-income-light text-income-dark";
};

export default function UpcomingBills({
  bills,
  dispatch,
  compact = false,
  onMessage,
}: UpcomingBillsProps) {
  const activeBills = bills
    .filter((bill) => bill.active)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const summary = summarizeRecurringBills(bills);
  const visibleBills = compact ? activeBills.slice(0, 4) : activeBills;

  const payBill = async (bill: RecurringBill) => {
    try {
      await dispatch(payRecurringBillThunk(bill.id)).unwrap();
      onMessage?.(`${bill.name} marked as paid.`);
    } catch (error) {
      onMessage?.(
        error instanceof Error ? error.message : "Failed to mark bill as paid.",
      );
    }
  };

  return (
    <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary-700">
            Upcoming Bills
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {summary.overdue} overdue, {summary.dueToday} due today,{" "}
            {summary.upcoming} upcoming
          </p>
        </div>
        {summary.overdueAmount > 0 && (
          <div className="text-sm font-semibold text-expense-dark">
            Overdue {formatCurrency(summary.overdueAmount)}
          </div>
        )}
      </div>

      {visibleBills.length === 0 ? (
        <p className="rounded-xl border border-primary-100 bg-primary-50/40 p-5 text-sm text-gray-500">
          No active bills are due.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleBills.map((bill) => {
            const status = getRecurringBillStatus(bill);
            return (
              <div
                key={bill.id}
                className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-primary-800">
                      {bill.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}
                    >
                      {statusLabel[status] || status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {formatCurrency(bill.amount)} - due {bill.nextDueDate}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!bill.active}
                  onClick={() => payBill(bill)}
                >
                  Mark Paid
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
