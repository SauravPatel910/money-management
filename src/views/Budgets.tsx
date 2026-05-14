"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import BudgetSummary from "../components/budgets/BudgetSummary";
import FeatureDisabled from "../components/common/FeatureDisabled";
import FeatureGate from "../components/common/FeatureGate";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import Failed from "../components/UI/Failed";
import Loading from "../components/UI/Loading";
import PageLayout from "../components/UI/PageLayout";
import DatePicker from "../components/forms/DatePicker";
import Select from "../components/forms/Select";
import StatusMessage from "../components/UI/StatusMessage";
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
    <FeatureGate
      feature="budgets"
      fallback={<FeatureDisabled title="Budgets disabled" />}
    >
      <PageLayout
        title="Budgets"
        headerLinks={getNavigationLinks("budgets")}
        loadingText="Loading budgets..."
      >
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
            <section className="rounded-[25px] bg-white p-6">
              <h3 className="mb-6 border-b border-[#ebeef2] pb-4 text-[22px] font-semibold text-[#343c6a]">
                {editingId ? "Edit Budget" : "Add Budget"}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <DatePicker
                  label="Month"
                  name="budgetMonth"
                  value={form.month}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      month: value,
                    }))
                  }
                  mode="month"
                  required
                />
                <Select
                  label="Category"
                  name="categoryId"
                  value={form.categoryId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: value,
                      subcategoryId: "",
                    }))
                  }
                  options={expenseCategories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                  placeholder="Select expense category"
                  required
                />
                <Select
                  label="Subcategory"
                  name="subcategoryId"
                  value={form.subcategoryId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      subcategoryId: value,
                    }))
                  }
                  options={subcategoryOptions.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                  placeholder="Whole category"
                />
                <label className="block text-sm font-medium text-[#343c6a]">
                  Limit Amount
                  <span className="ml-1 text-[#ff4b4a]">*</span>
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
                    className="mt-2 h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none focus:border-[#2d60ff]"
                  />
                </label>
                <label className="block text-sm font-medium text-[#343c6a]">
                  Alert Threshold %
                  <span className="ml-1 text-[#ff4b4a]">*</span>
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
                    className="mt-2 h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none focus:border-[#2d60ff]"
                  />
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

            <section className="rounded-[25px] bg-white p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-[22px] font-semibold text-[#343c6a]">
                  Monthly Budgets
                </h3>
                <DatePicker
                  label="Selected month"
                  name="selectedBudgetMonth"
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  mode="month"
                  buttonClassName="h-[44px] px-4 text-sm"
                  containerClassName="min-w-[180px]"
                  labelClassName="sr-only"
                />
              </div>
              {progress.length === 0 ? (
                <p className="rounded-[18px] border border-[#dfeaf2] bg-[#f5f7fa] p-5 text-sm text-[#718ebf]">
                  No budgets set for this month.
                </p>
              ) : (
                <div className="space-y-4">
                  {progress.map((budget) => (
                    <div
                      key={budget.id}
                      className="rounded-[18px] border border-[#e6eff5] bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-[#343c6a]">
                            {budget.category?.name || "Category"}
                          </div>
                          <div className="text-sm text-[#718ebf]">
                            {budget.subcategory?.name || "Whole category"} - alert
                            at {budget.alertThreshold}%
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-[#123288] bg-white px-3 py-1.5 text-xs font-medium text-[#123288]"
                            onClick={() => startEdit(budget)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-[#ff4b4a] px-3 py-1.5 text-xs font-medium text-white"
                            onClick={() => removeBudget(budget.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f5f7fa]">
                        <div
                          className={
                            budget.status === "over"
                              ? "h-full bg-expense"
                              : budget.status === "near"
                                ? "h-full bg-yellow-500"
                                : "h-full bg-income"
                          }
                          style={{
                            width: `${Math.min(budget.progressPercent, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                        <BudgetStat
                          label="Limit"
                          value={formatCurrency(budget.limitAmount)}
                        />
                        <BudgetStat
                          label="Spent"
                          value={formatCurrency(budget.spentAmount)}
                        />
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
    </FeatureGate>
  );
}

const BudgetStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-primary-50/60 px-3 py-2">
    <div className="text-xs font-medium text-[#718ebf]">{label}</div>
    <div className="mt-1 font-semibold text-[#343c6a]">{value}</div>
  </div>
);
