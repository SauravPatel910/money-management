"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import FeatureDisabled from "../components/common/FeatureDisabled";
import FeatureGate from "../components/common/FeatureGate";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import UpcomingBills from "../components/bills/UpcomingBills";
import Failed from "../components/UI/Failed";
import Loading from "../components/UI/Loading";
import PageLayout from "../components/UI/PageLayout";
import DatePicker from "../components/forms/DatePicker";
import Select from "../components/forms/Select";
import StatusMessage from "../components/UI/StatusMessage";
import { useAppData } from "../hooks/useAppData";
import {
  addRecurringBillThunk,
  deleteRecurringBillThunk,
  editRecurringBillThunk,
} from "../store/transactionsSlice";
import type {
  RecurringBill,
  RecurringBillFrequency,
  RecurringBillInput,
} from "../types/money";
import { formatCurrency } from "../utils/formatters";

type BillFormState = {
  name: string;
  amount: string;
  account: string;
  categoryId: string;
  subcategoryId: string;
  frequency: RecurringBillFrequency;
  nextDueDate: string;
  reminderDays: string;
  active: boolean;
};

const today = new Date().toISOString().slice(0, 10);

const initialForm: BillFormState = {
  name: "",
  amount: "",
  account: "cash",
  categoryId: "",
  subcategoryId: "",
  frequency: "monthly",
  nextDueDate: today,
  reminderDays: "3",
  active: true,
};

export default function Bills() {
  const {
    accounts,
    categories,
    recurringBills,
    dispatch,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
    recurringBillsStatus,
    recurringBillsError,
  } = useAppData();
  const [form, setForm] = useState<BillFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () =>
      categories
        .filter((category) => category.type === "expense" && !category.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  );
  const subcategoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === form.categoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, form.categoryId],
  );
  const billTotals = useMemo(() => {
    const active = recurringBills.filter((bill) => bill.active);
    return {
      activeCount: active.length,
      pausedCount: recurringBills.length - active.length,
      monthlyAmount: active.reduce((sum, bill) => {
        if (bill.frequency === "weekly") return sum + bill.amount * 4;
        if (bill.frequency === "yearly") return sum + bill.amount / 12;
        return sum + bill.amount;
      }, 0),
    };
  }, [recurringBills]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const startEdit = (bill: RecurringBill) => {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      amount: String(bill.amount),
      account: bill.account,
      categoryId: bill.categoryId,
      subcategoryId: bill.subcategoryId || "",
      frequency: bill.frequency,
      nextDueDate: bill.nextDueDate,
      reminderDays: String(bill.reminderDays),
      active: bill.active,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitBill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: RecurringBillInput = {
      name: form.name,
      amount: Number(form.amount),
      account: form.account,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      reminderDays: Number(form.reminderDays || 3),
      active: form.active,
    };

    try {
      if (editingId) {
        await dispatch(editRecurringBillThunk({ id: editingId, ...payload })).unwrap();
        setMessage("Bill updated.");
      } else {
        await dispatch(addRecurringBillThunk(payload)).unwrap();
        setMessage("Bill added.");
      }
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bill action failed.");
    }
  };

  const removeBill = async (id: string) => {
    try {
      await dispatch(deleteRecurringBillThunk(id)).unwrap();
      setMessage("Bill deleted.");
      if (editingId === id) resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete bill.");
    }
  };

  const toggleActive = async (bill: RecurringBill) => {
    try {
      await dispatch(
        editRecurringBillThunk({ id: bill.id, active: !bill.active }),
      ).unwrap();
      setMessage(bill.active ? "Bill paused." : "Bill resumed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update bill.");
    }
  };

  if (
    accountsStatus === "idle" ||
    categoriesStatus === "idle" ||
    recurringBillsStatus === "idle" ||
    accountsStatus === "loading" ||
    categoriesStatus === "loading" ||
    recurringBillsStatus === "loading"
  ) {
    return <Loading text="Loading bills..." />;
  }

  if (
    accountsStatus === "failed" ||
    categoriesStatus === "failed" ||
    recurringBillsStatus === "failed"
  ) {
    return (
      <Failed
        error={accountsError || categoriesError || recurringBillsError}
        text="Failed to load bills. Please try again later."
      />
    );
  }

  return (
    <FeatureGate
      feature="recurringBills"
      fallback={<FeatureDisabled title="Recurring Bills disabled" />}
    >
      <PageLayout
        title="Bills"
        headerLinks={getNavigationLinks("bills")}
        loadingText="Loading bills..."
      >
        <div className="space-y-8">
          <section className="grid gap-6 md:grid-cols-3">
            <BillMetric
              label="Active Bills"
              value={String(billTotals.activeCount)}
              icon="calendar"
              tone="blue"
            />
            <BillMetric
              label="Monthly Forecast"
              value={formatCurrency(billTotals.monthlyAmount)}
              icon="wallet"
              tone="teal"
            />
            <BillMetric
              label="Paused Bills"
              value={String(billTotals.pausedCount)}
              icon="pause"
              tone="gold"
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
            <section className="rounded-[25px] bg-white p-6">
              <h3 className="mb-6 border-b border-[#ebeef2] pb-4 text-[22px] font-semibold text-[#343c6a]">
                {editingId ? "Edit Bill" : "Add Bill"}
              </h3>
              {message && (
                <StatusMessage
                  className="mb-4"
                  tone={
                    message.includes("failed") || message.includes("Could not")
                      ? "error"
                      : "success"
                  }
                >
                  {message}
                </StatusMessage>
              )}
              <form onSubmit={submitBill} className="space-y-4">
                <BillInput
                  label="Name"
                  value={form.name}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, name: value }))
                  }
                />
                <BillInput
                  label="Amount"
                  type="number"
                  value={form.amount}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, amount: value }))
                  }
                />
                <BillSelect
                  label="Account"
                  value={form.account}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, account: value }))
                  }
                  options={accounts.map((account) => ({
                    value: account.id,
                    label: account.name,
                  }))}
                />
                <BillSelect
                  label="Category"
                  value={form.categoryId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: value,
                      subcategoryId: "",
                    }))
                  }
                  options={[
                    { value: "", label: "Select expense category" },
                    ...expenseCategories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
                <BillSelect
                  label="Subcategory"
                  value={form.subcategoryId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, subcategoryId: value }))
                  }
                  options={[
                    { value: "", label: "Whole category" },
                    ...subcategoryOptions.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
                <BillSelect
                  label="Frequency"
                  value={form.frequency}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      frequency: value as RecurringBillFrequency,
                    }))
                  }
                  options={[
                    { value: "weekly", label: "Weekly" },
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                  ]}
                />
                <BillInput
                  label="Next due date"
                  type="date"
                  value={form.nextDueDate}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, nextDueDate: value }))
                  }
                />
                <BillInput
                  label="Reminder days"
                  type="number"
                  value={form.reminderDays}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, reminderDays: value }))
                  }
                />
                <label className="flex items-center gap-3 text-sm font-medium text-[#343c6a]">
                  <input
                    type="checkbox"
                    checked={form.active}
                    className="h-4 w-4 accent-[#1814f3]"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    className="h-[50px] rounded-[15px] bg-[#1814f3] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff]"
                  >
                    {editingId ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    className="h-[50px] rounded-[15px] border border-[#dfeaf2] bg-white px-4 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
                    onClick={resetForm}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </section>

            <UpcomingBills
              bills={recurringBills}
              dispatch={dispatch}
              onMessage={setMessage}
            />
          </div>

          <section className="rounded-[25px] bg-white p-6">
            <h3 className="mb-4 text-[22px] font-semibold text-[#343c6a]">
              All Bills
            </h3>
            <div className="space-y-3">
              {recurringBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-col gap-3 rounded-[18px] border border-[#e6eff5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-[#343c6a]">{bill.name}</div>
                    <div className="mt-1 text-sm text-[#718ebf]">
                      {formatCurrency(bill.amount)} - {bill.frequency} - due{" "}
                      {bill.nextDueDate}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-[#123288] bg-white px-3 py-1.5 text-xs font-medium text-[#123288] transition-colors hover:border-[#1814f3] hover:text-[#1814f3]"
                      onClick={() => startEdit(bill)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#dfeaf2] bg-white px-3 py-1.5 text-xs font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
                      onClick={() => toggleActive(bill)}
                    >
                      {bill.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#ff4b4a] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#e03d3c]"
                      onClick={() => removeBill(bill.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {recurringBills.length === 0 && (
                <p className="rounded-[18px] border border-[#dfeaf2] bg-[#f5f7fa] p-5 text-sm text-[#718ebf]">
                  No recurring bills yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </PageLayout>
    </FeatureGate>
  );
}

const BillInput = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) => (
  type === "date" ? (
    <DatePicker
      label={label}
      name={label.toLowerCase().replace(/\s+/g, "-")}
      value={value}
      onValueChange={onChange}
      required
    />
  ) : (
    <label className="block text-sm font-medium text-[#343c6a]">
      {label}
      <span className="ml-1 text-[#ff4b4a]">*</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="mt-2 h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors placeholder:text-[#8ba3cb] focus:border-[#2d60ff]"
      />
    </label>
  )
);

const BillSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) => (
  <Select
    label={label}
    name={label.toLowerCase().replace(/\s+/g, "-")}
    value={value}
    onValueChange={onChange}
    options={options}
    required={label !== "Subcategory"}
  />
);

const BillMetric = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: "calendar" | "wallet" | "pause";
  tone: "blue" | "teal" | "gold";
}) => {
  const toneClass =
    tone === "teal"
      ? "bg-[#dcfaf8] text-[#16dbcc]"
      : tone === "gold"
        ? "bg-[#fff5d9] text-[#ffbb38]"
        : "bg-[#e7edff] text-[#396aff]";

  return (
    <div className="rounded-[25px] bg-white p-5">
      <div className="flex items-center gap-4">
        <span className={`grid h-[55px] w-[55px] place-items-center rounded-full ${toneClass}`}>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            {icon === "calendar" && (
              <path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Z" />
            )}
            {icon === "wallet" && (
              <path d="M4 6h13a3 3 0 0 1 3 3v1h-5a3 3 0 0 0 0 6h5v1a3 3 0 0 1-3 3H4V6Zm11 6a1 1 0 0 0 0 2h5v-2h-5Z" />
            )}
            {icon === "pause" && (
              <path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" />
            )}
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-[15px] text-[#718ebf]">{label}</p>
          <p className="truncate text-xl font-semibold text-[#343c6a]">{value}</p>
        </div>
      </div>
    </div>
  );
};
