// @ts-nocheck
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  toggleSortOrder as toggleSortOrderAction,
  deleteTransactionThunk,
  updateTransactionThunk,
  selectSortOrder,
} from "../store/transactionsSlice";
import { useAppData } from "../hooks/useAppData";
import { useCommonUtils } from "../hooks/useCommonUtils";
import { getCurrentIstDateTimeInputs } from "../utils/dateTime";
import TransactionForm from "../components/forms/TransactionForm";
import TransactionHistory from "../components/transactions/TransactionHistory";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import Failed from "../components/UI/Failed";

const hiddenAutomaticDateTimeFields = [
  "transactionTime",
  "entryDate",
  "entryTime",
];

function TransactionHistoryPage() {
  const { transactions, accounts, dispatch, status, error } = useAppData();
  const { formatDate } = useCommonUtils();
  const sortOrder = useSelector(selectSortOrder);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    if (editingTransactionId == null) {
      return;
    }

    const updateLockedDateTimeFields = () => {
      const latestDateTime = getCurrentIstDateTimeInputs();
      setEditForm((prevForm) =>
        prevForm
          ? {
              ...prevForm,
              transactionTime: latestDateTime.time,
              entryDate: latestDateTime.date,
              entryTime: latestDateTime.time,
            }
          : prevForm,
      );
    };

    updateLockedDateTimeFields();
    const intervalId = window.setInterval(updateLockedDateTimeFields, 15000);

    return () => window.clearInterval(intervalId);
  }, [editingTransactionId]);

  const handleToggleSortOrder = useCallback(() => {
    dispatch(toggleSortOrderAction());
  }, [dispatch]);

  const handleDeleteTransaction = useCallback(
    (id) => {
      if (confirm("Are you sure you want to delete this transaction?")) {
        if (editingTransactionId === id) {
          setEditingTransactionId(null);
          setEditForm(null);
        }
        dispatch(deleteTransactionThunk(id));
      }
    },
    [dispatch, editingTransactionId],
  );

  const normalizeTransactionForEdit = useCallback((transaction) => {
    const latestDateTime = getCurrentIstDateTimeInputs();
    const form = {
      type: transaction.type,
      amount: transaction.amount,
      transactionDate: transaction.transactionDate,
      transactionTime: latestDateTime.time,
      entryDate: latestDateTime.date,
      entryTime: latestDateTime.time,
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
  }, []);

  const handleStartEdit = useCallback(
    (transaction) => {
      setEditingTransactionId(transaction.id);
      setEditForm(normalizeTransactionForEdit(transaction));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [normalizeTransactionForEdit],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingTransactionId(null);
    setEditForm(null);
  }, []);

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm((prevForm) => ({ ...prevForm, [name]: value }));
  }, []);

  const handleEditTypeChange = useCallback(
    (type) => {
      setEditForm((prevForm) => {
        const newForm = { ...prevForm, type };

        if (type === "income" || type === "expense") {
          delete newForm.from;
          delete newForm.to;
          delete newForm.direction;
          delete newForm.person;
          newForm.account = newForm.account || "cash";
        } else if (type === "transfer") {
          delete newForm.account;
          delete newForm.direction;
          delete newForm.person;
          newForm.from = newForm.from || "cash";
          newForm.to =
            newForm.to ||
            accounts.find((account) => account.id !== newForm.from)?.id ||
            "bank";
        } else if (type === "person") {
          delete newForm.from;
          delete newForm.to;
          newForm.direction = newForm.direction || "to";
          newForm.account = newForm.account || "cash";
          newForm.person = newForm.person || "";
        }

        return newForm;
      });
    },
    [accounts],
  );

  const handleEditSelectChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setEditForm((prevForm) => {
        const nextForm = { ...prevForm, [name]: value };

        if (name === "from" && value === prevForm.to) {
          nextForm.to = prevForm.from;
        } else if (name === "to" && value === prevForm.from) {
          nextForm.from = prevForm.to;
        }

        return nextForm;
      });
    },
    [],
  );

  const handleUpdateTransaction = useCallback(
    (e) => {
      e.preventDefault();
      const amount = parseFloat(editForm.amount);

      if (amount <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
      }

      if (editForm.type === "transfer" && editForm.from === editForm.to) {
        alert("You cannot transfer money to the same account");
        return;
      }

      const latestDateTime = getCurrentIstDateTimeInputs();
      dispatch(
        updateTransactionThunk({
          id: editingTransactionId,
          ...editForm,
          amount,
          transactionTime: latestDateTime.time,
          entryDate: latestDateTime.date,
          entryTime: latestDateTime.time,
        }),
      );
      setEditingTransactionId(null);
      setEditForm(null);
    },
    [dispatch, editForm, editingTransactionId],
  );

  const sortedTransactions = useCallback(() => {
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

  if (status === "loading" && transactions.length === 0) {
    return <Loading />;
  }
  if (status === "failed") {
    return (
      <Failed
        error={error}
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
      {editForm && (
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
        sortTransactions={sortedTransactions}
      />
    </PageLayout>
  );
}

export default TransactionHistoryPage;
