"use client";

import { useCallback, useMemo, useState } from "react";
import type { SubmitEventHandler } from "react";
import { useAppSelector } from "../config/reduxStore";
import {
  toggleSortOrder as toggleSortOrderAction,
  deleteTransactionThunk,
  fetchTransactionEditHistoryThunk,
  updateTransactionThunk,
  selectTransactionEditHistory,
  selectTransactionEditHistoryError,
  selectTransactionEditHistoryStatus,
  selectSortOrder,
} from "../store/transactionsSlice";
import { useAppData } from "../hooks/useAppData";
import { useCommonUtils } from "../hooks/useCommonUtils";
import { useTransactionForm } from "../hooks/useTransactionForm";
import { useTransactionValidation } from "../hooks/useTransactionValidation";
import { getCurrentIstDateTimeInputs } from "../utils/dateTime";
import TransactionForm from "../components/forms/TransactionForm";
import TransactionHistory from "../components/transactions/TransactionHistory";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import Failed from "../components/UI/Failed";
import type {
  EditTransactionFormState,
  MoneyTransaction,
  TransactionEditHistory,
  TransactionFormFieldName,
} from "../types/money";

const hiddenAutomaticDateTimeFields: TransactionFormFieldName[] = [
  "transactionTime",
  "entryDate",
  "entryTime",
];
const emptyEditHistory: TransactionEditHistory[] = [];

function TransactionHistoryPage() {
  const {
    transactions,
    accounts,
    dispatch,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
  } = useAppData();
  const { formatDate } = useCommonUtils();
  const sortOrder = useAppSelector(selectSortOrder);
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [expandedHistoryTransactionId, setExpandedHistoryTransactionId] =
    useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const currentDateTime = getCurrentIstDateTimeInputs();
  const {
    form: editForm,
    setForm: setEditForm,
    handleInputChange: handleEditInputChange,
    handleTypeChange: handleEditTypeChange,
    handleSelectChange: handleEditSelectChange,
  } = useTransactionForm<EditTransactionFormState>({
    accounts,
    lockDateTime: editingTransactionId !== null,
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
  const selectedEditHistory = useAppSelector((state) =>
    expandedHistoryTransactionId
      ? selectTransactionEditHistory(expandedHistoryTransactionId)(state)
      : emptyEditHistory,
  );
  const selectedEditHistoryStatus = useAppSelector((state) =>
    expandedHistoryTransactionId
      ? selectTransactionEditHistoryStatus(expandedHistoryTransactionId)(state)
      : "idle",
  );
  const selectedEditHistoryError = useAppSelector((state) =>
    expandedHistoryTransactionId
      ? selectTransactionEditHistoryError(expandedHistoryTransactionId)(state)
      : null,
  );

  const handleToggleSortOrder = useCallback(() => {
    dispatch(toggleSortOrderAction());
  }, [dispatch]);

  const handleDeleteTransaction = useCallback((id: string) => {
    setPendingDeleteId(id);
    setPageMessage(null);
  }, []);

  const handleToggleTransactionHistory = useCallback(
    (id: string) => {
      const nextTransactionId = expandedHistoryTransactionId === id ? null : id;
      setExpandedHistoryTransactionId(nextTransactionId);
      setPageMessage(null);
      setPendingDeleteId(null);

      if (nextTransactionId) {
        dispatch(fetchTransactionEditHistoryThunk(nextTransactionId));
      }
    },
    [dispatch, expandedHistoryTransactionId],
  );

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId) {
      return;
    }

    try {
      await dispatch(deleteTransactionThunk(pendingDeleteId)).unwrap();
      if (editingTransactionId === pendingDeleteId) {
        setEditingTransactionId(null);
      }
      if (expandedHistoryTransactionId === pendingDeleteId) {
        setExpandedHistoryTransactionId(null);
      }
      setPageMessage("Transaction deleted.");
    } catch (error) {
      setPageMessage(
        error instanceof Error ? error.message : "Failed to delete transaction.",
      );
    } finally {
      setPendingDeleteId(null);
    }
  }, [dispatch, editingTransactionId, expandedHistoryTransactionId, pendingDeleteId]);

  const normalizeTransactionForEdit = useCallback(
    (transaction: MoneyTransaction): EditTransactionFormState => {
      const latestDateTime = getCurrentIstDateTimeInputs();
      const form: EditTransactionFormState = {
        type: transaction.type,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        transactionTime: latestDateTime.time,
        entryDate: latestDateTime.date,
        entryTime: latestDateTime.time,
        categoryId: transaction.categoryId || "",
        subcategoryId: transaction.subcategoryId || "",
        note: transaction.note || "",
      };

      if (transaction.type === "income" || transaction.type === "expense") {
        form.account = transaction.account || "cash";
      } else if (transaction.type === "transfer") {
        form.from = transaction.from || "cash";
        form.to = transaction.to || "bank";
      } else if (transaction.type === "person") {
        form.direction = transaction.direction || "to";
        form.account = transaction.account || "cash";
        form.person = transaction.person || "";
      }

      return form;
    },
    [],
  );

  const handleStartEdit = useCallback(
    (transaction: MoneyTransaction) => {
      setEditingTransactionId(transaction.id);
      setEditForm(normalizeTransactionForEdit(transaction));
      setPageMessage(null);
      setPendingDeleteId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [normalizeTransactionForEdit, setEditForm],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingTransactionId(null);
    setPageMessage(null);
  }, []);

  const handleUpdateTransaction = useCallback(
    async (e: Parameters<SubmitEventHandler<HTMLFormElement>>[0]) => {
      e.preventDefault();
      if (!editingTransactionId) {
        return;
      }

      const validation = validateTransaction(editForm);
      if (!validation.ok) {
        setPageMessage(validation.message);
        return;
      }

      const latestDateTime = getCurrentIstDateTimeInputs();
      try {
        await dispatch(
          updateTransactionThunk({
          id: editingTransactionId,
          ...validation.transaction,
          transactionTime: latestDateTime.time,
          entryDate: latestDateTime.date,
          entryTime: latestDateTime.time,
          }),
        ).unwrap();
        setEditingTransactionId(null);
        setPageMessage("Transaction updated successfully.");
      } catch (error) {
        setPageMessage(
          error instanceof Error
            ? error.message
            : "Failed to update transaction.",
        );
      }
    },
    [dispatch, editForm, editingTransactionId, validateTransaction],
  );

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const timestampA = new Date(
        `${a.transactionDate}T${a.transactionTime || "00:00"}:00`,
      ).getTime();
      const timestampB = new Date(
        `${b.transactionDate}T${b.transactionTime || "00:00"}:00`,
      ).getTime();

      if (timestampA === timestampB) {
        const idA = typeof a.id === "string" ? a.id : a.id;
        const idB = typeof b.id === "string" ? b.id : b.id;
        // prettier-ignore
        return sortOrder === "newest" ? (idB > idA ? 1 : -1) : idA > idB ? 1 : -1;
      }

      return sortOrder === "newest" ? timestampB - timestampA : timestampA - timestampB;
    });
  }, [transactions, sortOrder]);

  if (
    transactionsStatus === "idle" ||
    accountsStatus === "idle" ||
    categoriesStatus === "idle" ||
    (transactionsStatus === "loading" && transactions.length === 0) ||
    (accountsStatus === "loading" && accounts.length === 0) ||
    categoriesStatus === "loading"
  ) {
    return <Loading />;
  }
  if (
    transactionsStatus === "failed" ||
    accountsStatus === "failed" ||
    categoriesStatus === "failed"
  ) {
    return (
      <Failed
        error={transactionsError || accountsError || categoriesError}
        text="Failed to load dashboard data. Please try again later."
      />
    );
  }

  return (
    <PageLayout
      title="Transaction History"
      headerLinks={getNavigationLinks("transactions")}
      loadingText="Loading transaction history..."
    >
      {pageMessage && (
        <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
          {pageMessage}
        </div>
      )}
      {pendingDeleteId && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-expense-light bg-expense-light/40 px-4 py-3 text-sm text-expense-dark sm:flex-row sm:items-center sm:justify-between">
          <span>Delete this transaction?</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-expense px-3 py-1.5 text-xs font-medium text-white"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
            <button
              type="button"
              className="rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-medium text-primary-700"
              onClick={handleCancelDelete}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {editingTransactionId && (
        <div className="mb-8">
          <TransactionForm
            form={editForm}
            handleInputChange={handleEditInputChange}
            handleTypeChange={handleEditTypeChange}
            handleSelectChange={handleEditSelectChange}
            addTransaction={handleUpdateTransaction}
            title="Edit Transaction"
            submitLabel="Update Transaction"
            onCancel={handleCancelEdit}
            hiddenFields={hiddenAutomaticDateTimeFields}
          />
        </div>
      )}
      <TransactionHistory
        transactions={transactions}
        sortOrder={sortOrder}
        toggleSortOrder={handleToggleSortOrder}
        formatDate={formatDate}
        editTransaction={handleStartEdit}
        deleteTransaction={handleDeleteTransaction}
        toggleTransactionHistory={handleToggleTransactionHistory}
        expandedHistoryTransactionId={expandedHistoryTransactionId}
        selectedEditHistory={selectedEditHistory}
        selectedEditHistoryStatus={selectedEditHistoryStatus}
        selectedEditHistoryError={selectedEditHistoryError}
        sortedTransactions={sortedTransactions}
      />
    </PageLayout>
  );
}

export default TransactionHistoryPage;
