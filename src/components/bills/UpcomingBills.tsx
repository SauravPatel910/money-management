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
  if (status === "overdue") return "bg-[#ffe0eb] text-[#ff4b4a]";
  if (status === "dueToday") return "bg-[#fff5d9] text-[#ffbb38]";
  if (status === "paused") return "bg-[#f5f7fa] text-[#718ebf]";
  return "bg-[#dcfaf8] text-[#16dbcc]";
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
    <section className="rounded-[25px] bg-white p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[22px] font-semibold text-[#343c6a]">
            Upcoming Bills
          </h3>
          <p className="mt-1 text-[15px] text-[#718ebf]">
            {summary.overdue} overdue, {summary.dueToday} due today,{" "}
            {summary.upcoming} upcoming
          </p>
        </div>
        {summary.overdueAmount > 0 && (
          <div className="rounded-full bg-[#ffe0eb] px-3 py-1 text-sm font-semibold text-[#ff4b4a]">
            Overdue {formatCurrency(summary.overdueAmount)}
          </div>
        )}
      </div>

      {visibleBills.length === 0 ? (
        <p className="rounded-[18px] border border-[#dfeaf2] bg-[#f5f7fa] p-5 text-sm text-[#718ebf]">
          No active bills are due.
        </p>
      ) : (
        <div className="space-y-3">
          {visibleBills.map((bill) => {
            const status = getRecurringBillStatus(bill);
            return (
              <div
                key={bill.id}
                className="flex flex-col gap-3 rounded-[18px] border border-[#e6eff5] bg-white p-4 transition-colors hover:border-[#dfe7ff] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#343c6a]">
                      {bill.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}
                    >
                      {statusLabel[status] || status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-[#718ebf]">
                    {formatCurrency(bill.amount)} - due {bill.nextDueDate}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#1814f3] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff] disabled:cursor-not-allowed disabled:opacity-60"
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
