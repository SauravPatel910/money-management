"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChangeEvent, SubmitEventHandler } from "react";
import { addTransactionThunk } from "../store/transactionsSlice";
import { useAppData } from "../hooks/useAppData";
import { useCommonUtils } from "../hooks/useCommonUtils";
import { getCurrentIstDateTimeInputs } from "../utils/dateTime";
import TransactionForm from "../components/forms/TransactionForm";
import RecentActivity from "../components/transactions/RecentActivity";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import Failed from "../components/UI/Failed";
import type {
  NewTransactionFormState,
  TransactionFormFieldName,
  TransactionInput,
  TransactionType,
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
    dispatch,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
  } = useAppData();
  const { formatDate } = useCommonUtils();
  const currentDateTime = getCurrentIstDateTimeInputs();

  const [form, setForm] = useState<NewTransactionFormState>({
    type: "income",
    amount: "",
    transactionDate: currentDateTime.date,
    transactionTime: currentDateTime.time,
    entryDate: currentDateTime.date,
    entryTime: currentDateTime.time,
    account: "cash",
    note: "",
  });

  useEffect(() => {
    const updateLockedDateTimeFields = () => {
      const latestDateTime = getCurrentIstDateTimeInputs();
      setForm((prevForm) => ({
        ...prevForm,
        transactionTime: latestDateTime.time,
        entryDate: latestDateTime.date,
        entryTime: latestDateTime.time,
      }));
    };

    updateLockedDateTimeFields();
    const intervalId = window.setInterval(updateLockedDateTimeFields, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Memoized function for handling input changes
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }, []);

  // Memoized function for handling type changes
  const handleTypeChange = useCallback(
    (type: TransactionType) => {
      setForm((prevForm) => {
        const newForm = { ...prevForm, type };

        if (type === "income" || type === "expense") {
          delete newForm.from;
          delete newForm.to;
          delete newForm.direction;
          delete newForm.person;
        } else if (type === "transfer") {
          delete newForm.account;
          delete newForm.direction;
          delete newForm.person;
          newForm.from = "cash";
          newForm.to = accounts.length > 1 ? accounts[1].id : "bank";
        } else if (type === "person") {
          delete newForm.from;
          delete newForm.to;
          newForm.direction = "to";
          newForm.account = "cash";
          newForm.person = "";
        }

        return newForm;
      });
    },
    [accounts],
  );

  // Memoized function for handling select changes
  const handleSelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prevForm) => {
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

  // Memoized function for adding transactions
  const handleAddTransaction = useCallback(
    (e: Parameters<SubmitEventHandler<HTMLFormElement>>[0]) => {
      e.preventDefault();
      const amount = parseFloat(form.amount);

      if (amount <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
      }

      const getAccount = (id?: string) =>
        accounts.find((acc) => acc.id === id);

      if (form.type === "transfer") {
        if (form.from === form.to) {
          alert("You cannot transfer money to the same account");
          return;
        }

        const sourceAccount = getAccount(form.from);
        const sourceBalance = sourceAccount ? sourceAccount.balance : 0;

        if (amount > sourceBalance) {
          alert(
            `Not enough balance in your ${sourceAccount?.name || "account"} for this transfer`,
          );
          return;
        }
      } else if (form.type === "person" && form.direction === "to") {
        const sourceAccount = getAccount(form.account);
        const sourceBalance = sourceAccount ? sourceAccount.balance : 0;

        if (amount > sourceBalance) {
          alert(
            `Not enough balance in your ${sourceAccount?.name || "account"} to make this payment`,
          );
          return;
        }
      } else if (form.type === "expense") {
        const sourceAccount = getAccount(form.account);
        const sourceBalance = sourceAccount ? sourceAccount.balance : 0;

        if (amount > sourceBalance) {
          alert(
            `Not enough balance in your ${sourceAccount?.name || "account"} for this expense`,
          );
          return;
        }
      }

      const latestDateTime = getCurrentIstDateTimeInputs();
      const newTransaction: TransactionInput = {
        ...form,
        amount,
        transactionTime: latestDateTime.time,
        entryDate: latestDateTime.date,
        entryTime: latestDateTime.time,
      };

      dispatch(addTransactionThunk(newTransaction));

      setForm((prevForm) => {
        const latestDateTime = getCurrentIstDateTimeInputs();
        const resetForm = {
          ...prevForm,
          amount: "",
          note: "",
          transactionTime: latestDateTime.time,
          entryDate: latestDateTime.date,
          entryTime: latestDateTime.time,
        };
        if (form.type === "person") {
          resetForm.person = "";
        }
        return resetForm;
      });
    },
    [form, dispatch, accounts],
  );
  if (
    (transactionsStatus === "loading" && transactions.length === 0) ||
    (accountsStatus === "loading" && accounts.length === 0)
  ) {
    return <Loading />;
  }
  if (transactionsStatus === "failed" || accountsStatus === "failed") {
    return (
      <Failed
        error={transactionsError || accountsError}
        text="Failed to load dashboard data. Please try again later."
      />
    );
  }
  return (
    <PageLayout
      title="Dashboard"
      headerLinks={getNavigationLinks("dashboard")}
      loadingText="Loading your finances..."
    >
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TransactionForm
          form={form}
          handleInputChange={handleInputChange}
          handleTypeChange={handleTypeChange}
          handleSelectChange={handleSelectChange}
          addTransaction={handleAddTransaction}
          hiddenFields={hiddenAutomaticDateTimeFields}
        />

        <RecentActivity transactions={transactions} formatDate={formatDate} />
      </div>
    </PageLayout>
  );
}

export default Dashboard;
