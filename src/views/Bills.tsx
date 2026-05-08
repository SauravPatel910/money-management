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
          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <section className="rounded-2xl border-l-4 border-primary-500 bg-white/90 p-6 shadow-card">
              <h3 className="mb-6 border-b border-primary-100 pb-3 text-xl font-semibold text-primary-700">
                {editingId ? "Edit Bill" : "Add Bill"}
              </h3>
              {message && (
                <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
                  {message}
                </div>
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
                <label className="flex items-center gap-2 text-sm font-medium text-primary-700">
                  <input
                    type="checkbox"
                    checked={form.active}
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
                    className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-md"
                  >
                    {editingId ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm"
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

          <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
            <h3 className="mb-4 text-xl font-semibold text-primary-700">
              All Bills
            </h3>
            <div className="space-y-3">
              {recurringBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-primary-800">{bill.name}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {formatCurrency(bill.amount)} - {bill.frequency} - due{" "}
                      {bill.nextDueDate}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700"
                      onClick={() => startEdit(bill)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700"
                      onClick={() => toggleActive(bill)}
                    >
                      {bill.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-expense px-3 py-1.5 text-xs font-medium text-white"
                      onClick={() => removeBill(bill.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {recurringBills.length === 0 && (
                <p className="rounded-xl border border-primary-100 bg-primary-50/40 p-5 text-sm text-gray-500">
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
  <label className="block text-sm font-medium text-primary-700">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
      className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
    />
  </label>
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
  <label className="block text-sm font-medium text-primary-700">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={label !== "Subcategory"}
      className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option.value || "empty"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);
