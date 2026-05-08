"use client";

import { useCallback, useState } from "react";
import type { SubmitEventHandler } from "react";
import { addTransactionThunk } from "../store/transactionsSlice";
import { useAppData } from "../hooks/useAppData";
import { useCommonUtils } from "../hooks/useCommonUtils";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { useTransactionValidation } from "../hooks/useTransactionValidation";
import { getCurrentIstDateTimeInputs } from "../utils/dateTime";
import TransactionForm from "../components/forms/TransactionForm";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import RecentActivity from "../components/transactions/RecentActivity";
import BudgetSummary from "../components/budgets/BudgetSummary";
import UpcomingBills from "../components/bills/UpcomingBills";
import FeatureDisabled from "../components/common/FeatureDisabled";
import FeatureGate from "../components/common/FeatureGate";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import { getCurrentBudgetMonth } from "../lib/budgetAnalytics";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import Failed from "../components/UI/Failed";
import type {
  NewTransactionFormState,
  TransactionFormFieldName,
  TransactionInput,
} from "../types/money";

const hiddenAutomaticDateTimeFields: TransactionFormFieldName[] = [
  "transactionTime",
  "entryDate",
  "entryTime",
];

function Dashboard() {
  const {
    transactions,
    accounts,
    budgets,
    recurringBills,
    dispatch,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
    budgetsStatus,
    budgetsError,
    recurringBillsStatus,
    recurringBillsError,
  } = useAppData();
  const { formatDate } = useCommonUtils();
  const currentDateTime = getCurrentIstDateTimeInputs();
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const {
    form,
    handleInputChange,
    handleTypeChange,
    handleSelectChange,
    resetAfterSubmit,
  } = useTransactionForm<NewTransactionFormState>({
    accounts,
    initialForm: {
    type: "income",
    amount: "",
    transactionDate: currentDateTime.date,
    transactionTime: currentDateTime.time,
    entryDate: currentDateTime.date,
    entryTime: currentDateTime.time,
    account: "cash",
    note: "",
    },
  });
  const validateTransaction = useTransactionValidation(accounts);

  // Memoized function for adding transactions
  const handleAddTransaction = useCallback(
    async (e: Parameters<SubmitEventHandler<HTMLFormElement>>[0]) => {
      e.preventDefault();
      const validation = validateTransaction(form, {
        checkAvailableBalance: true,
      });
      if (!validation.ok) {
        setFormMessage(validation.message);
        return;
      }

      const latestDateTime = getCurrentIstDateTimeInputs();
      const newTransaction: TransactionInput = {
        ...validation.transaction,
        transactionTime: latestDateTime.time,
        entryDate: latestDateTime.date,
        entryTime: latestDateTime.time,
      };

      try {
        await dispatch(addTransactionThunk(newTransaction)).unwrap();
        setFormMessage("Transaction added successfully.");
        resetAfterSubmit();
      } catch (error) {
        setFormMessage(
          error instanceof Error ? error.message : "Failed to add transaction.",
        );
      }
    },
    [dispatch, form, resetAfterSubmit, validateTransaction],
  );
  if (
    transactionsStatus === "idle" ||
    accountsStatus === "idle" ||
    categoriesStatus === "idle" ||
    budgetsStatus === "idle" ||
    recurringBillsStatus === "idle" ||
    (transactionsStatus === "loading" && transactions.length === 0) ||
    (accountsStatus === "loading" && accounts.length === 0) ||
    categoriesStatus === "loading" ||
    budgetsStatus === "loading" ||
    recurringBillsStatus === "loading"
  ) {
    return <Loading />;
  }
  if (
    transactionsStatus === "failed" ||
    accountsStatus === "failed" ||
    categoriesStatus === "failed" ||
    budgetsStatus === "failed" ||
    recurringBillsStatus === "failed"
  ) {
    return (
      <Failed
        error={
          transactionsError ||
          accountsError ||
          categoriesError ||
          budgetsError ||
          recurringBillsError
        }
        text="Failed to load dashboard data. Please try again later."
      />
    );
  }
  return (
    <FeatureGate feature="dashboard" fallback={<FeatureDisabled title="Dashboard disabled" />}>
    <PageLayout
      title="Dashboard"
      headerLinks={getNavigationLinks("dashboard")}
      loadingText="Loading your finances..."
    >
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <FeatureGate feature="transactions">
          <div>
            {formMessage && (
              <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
                {formMessage}
              </div>
            )}
            <TransactionForm
              form={form}
              handleInputChange={handleInputChange}
              handleTypeChange={handleTypeChange}
              handleSelectChange={handleSelectChange}
              addTransaction={handleAddTransaction}
              hiddenFields={hiddenAutomaticDateTimeFields}
            />
          </div>
        </FeatureGate>

        <FeatureGate feature="transactions">
          <RecentActivity transactions={transactions} formatDate={formatDate} />
        </FeatureGate>
      </div>
      <FeatureGate feature="budgets">
        <div className="mb-8">
          <BudgetSummary
            budgets={budgets}
            transactions={transactions}
            month={getCurrentBudgetMonth()}
            compact
          />
        </div>
      </FeatureGate>
      <FeatureGate feature="recurringBills">
        <div className="mb-8">
          <UpcomingBills bills={recurringBills} dispatch={dispatch} compact />
        </div>
      </FeatureGate>
      <DashboardCharts transactions={transactions} />
    </PageLayout>
    </FeatureGate>
  );
}

export default Dashboard;
