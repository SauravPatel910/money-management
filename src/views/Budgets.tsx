"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import BudgetSummary from "../components/budgets/BudgetSummary";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import Failed from "../components/UI/Failed";
import Loading from "../components/UI/Loading";
import PageLayout from "../components/UI/PageLayout";
import { useAppData } from "../hooks/useAppData";
import {
  buildBudgetProgress,
  getCurrentBudgetMonth,
} from "../lib/budgetAnalytics";
import {
  addBudgetThunk,
  deleteBudgetThunk,
  editBudgetThunk,
} from "../store/transactionsSlice";
import type { Budget, BudgetInput } from "../types/money";
import { formatCurrency } from "../utils/formatters";

type BudgetFormState = {
  month: string;
  categoryId: string;
  subcategoryId: string;
  limitAmount: string;
  alertThreshold: string;
};

const defaultMonth = getCurrentBudgetMonth();

const initialForm: BudgetFormState = {
  month: defaultMonth,
  categoryId: "",
  subcategoryId: "",
  limitAmount: "",
  alertThreshold: "80",
};

export default function Budgets() {
  const {
    budgets,
    transactions,
    categories,
    dispatch,
    transactionsStatus,
    transactionsError,
    categoriesStatus,
    categoriesError,
    budgetsStatus,
    budgetsError,
  } = useAppData();
  const [form, setForm] = useState<BudgetFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
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
  const selectedBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === selectedMonth),
    [budgets, selectedMonth],
  );
  const progress = useMemo(
    () => buildBudgetProgress(selectedBudgets, transactions),
    [selectedBudgets, transactions],
  );

  const resetForm = () => {
    setForm({ ...initialForm, month: selectedMonth });
    setEditingId(null);
  };

  const startEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setForm({
      month: budget.month,
      categoryId: budget.categoryId,
      subcategoryId: budget.subcategoryId || "",
      limitAmount: String(budget.limitAmount),
      alertThreshold: String(budget.alertThreshold),
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: BudgetInput = {
      month: form.month,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      limitAmount: Number(form.limitAmount),
      alertThreshold: Number(form.alertThreshold || 80),
    };

    try {
      if (editingId) {
        await dispatch(editBudgetThunk({ id: editingId, ...payload })).unwrap();
        setMessage("Budget updated.");
      } else {
        await dispatch(addBudgetThunk(payload)).unwrap();
        setMessage("Budget added.");
      }
      setSelectedMonth(payload.month);
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Budget action failed.");
    }
  };

  const removeBudget = async (id: string) => {
    try {
      await dispatch(deleteBudgetThunk(id)).unwrap();
      setMessage("Budget deleted.");
      if (editingId === id) resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete budget.");
    }
  };

  if (
    transactionsStatus === "idle" ||
    categoriesStatus === "idle" ||
    budgetsStatus === "idle" ||
    transactionsStatus === "loading" ||
    categoriesStatus === "loading" ||
    budgetsStatus === "loading"
  ) {
    return <Loading text="Loading budgets..." />;
  }

  if (
    transactionsStatus === "failed" ||
    categoriesStatus === "failed" ||
    budgetsStatus === "failed"
  ) {
    return (
      <Failed
        error={transactionsError || categoriesError || budgetsError}
        text="Failed to load budgets. Please try again later."
      />
    );
  }

  return (
    <PageLayout
      title="Budgets"
      headerLinks={getNavigationLinks("budgets")}
      loadingText="Loading budgets..."
    >
      <div className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border-l-4 border-primary-500 bg-white/90 p-6 shadow-card">
            <h3 className="mb-6 border-b border-primary-100 pb-3 text-xl font-semibold text-primary-700">
              {editingId ? "Edit Budget" : "Add Budget"}
            </h3>
            {message && (
              <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
                {message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-primary-700">
                Month
                <input
                  type="month"
                  value={form.month}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, month: event.target.value }))
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-primary-700">
                Category
                <select
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                      subcategoryId: "",
                    }))
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                >
                  <option value="">Select expense category</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-primary-700">
                Subcategory
                <select
                  value={form.subcategoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subcategoryId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                >
                  <option value="">Whole category</option>
                  {subcategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-primary-700">
                Limit Amount
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.limitAmount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      limitAmount: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-primary-700">
                Alert Threshold %
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.alertThreshold}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      alertThreshold: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                />
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

          <section className="rounded-2xl border-t-4 border-primary-500 bg-white/90 p-6 shadow-card">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-primary-700">
                Monthly Budgets
              </h3>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
              />
            </div>
            {progress.length === 0 ? (
              <p className="rounded-xl border border-primary-100 bg-primary-50/40 p-5 text-sm text-gray-500">
                No budgets set for this month.
              </p>
            ) : (
              <div className="space-y-4">
                {progress.map((budget) => (
                  <div
                    key={budget.id}
                    className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-primary-800">
                          {budget.category?.name || "Category"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {budget.subcategory?.name || "Whole category"} ·{" "}
                          alert at {budget.alertThreshold}%
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700"
                          onClick={() => startEdit(budget)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-expense px-3 py-1.5 text-xs font-medium text-white"
                          onClick={() => removeBudget(budget.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-100">
                      <div
                        className={
                          budget.status === "over"
                            ? "h-full bg-expense"
                            : budget.status === "near"
                              ? "h-full bg-yellow-500"
                              : "h-full bg-income"
                        }
                        style={{ width: `${Math.min(budget.progressPercent, 100)}%` }}
                      />
                    </div>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                      <BudgetStat label="Limit" value={formatCurrency(budget.limitAmount)} />
                      <BudgetStat label="Spent" value={formatCurrency(budget.spentAmount)} />
                      <BudgetStat
                        label="Remaining"
                        value={formatCurrency(budget.remainingAmount)}
                      />
                      <BudgetStat
                        label="Progress"
                        value={`${budget.progressPercent.toFixed(0)}%`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <BudgetSummary
          budgets={budgets}
          transactions={transactions}
          month={selectedMonth}
        />
      </div>
    </PageLayout>
  );
}

const BudgetStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-primary-50/60 px-3 py-2">
    <div className="text-xs font-medium text-gray-500">{label}</div>
    <div className="mt-1 font-semibold text-primary-800">{value}</div>
  </div>
);
