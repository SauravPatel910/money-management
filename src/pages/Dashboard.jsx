import { useState, useCallback } from "react";
import { addTransactionThunk } from "../store/transactionsSlice";
import { useAppData } from "../hooks/useAppData";
import { useCommonUtils } from "../hooks/useCommonUtils";
import TransactionForm from "../components/forms/TransactionForm";
import RecentActivity from "../components/transactions/RecentActivity";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";
import Failed from "../components/UI/Failed";

function Dashboard() {
  const { transactions, accounts, dispatch, status, error } = useAppData();
  const { formatDate } = useCommonUtils();

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    account: "cash",
    note: "",
  });

  // Memoized function for handling input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }, []);

  // Memoized function for handling type changes
  const handleTypeChange = useCallback(
    (type) => {
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
    (e) => {
      const { name, value } = e.target;
      setForm((prevForm) => ({ ...prevForm, [name]: value }));

      if (name === "from" && value === form.to) {
        setForm((prevForm) => ({ ...prevForm, to: prevForm.from }));
      } else if (name === "to" && value === form.from) {
        setForm((prevForm) => ({ ...prevForm, from: prevForm.to }));
      }
    },
    [form.to, form.from],
  );

  // Memoized function for adding transactions
  const handleAddTransaction = useCallback(
    (e) => {
      e.preventDefault();
      const amount = parseFloat(form.amount);

      if (amount <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
      }

      const getAccount = (id) => accounts.find((acc) => acc.id === id);

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

      const newTransaction = {
        ...form,
        amount,
        entryDate: new Date().toISOString().split("T")[0],
      };

      dispatch(addTransactionThunk(newTransaction));

      setForm((prevForm) => {
        const resetForm = { ...prevForm, amount: "", note: "" };
        if (form.type === "person") {
          resetForm.person = "";
        }
        return resetForm;
      });
    },
    [form, dispatch, accounts],
  );
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
        />

        <RecentActivity transactions={transactions} formatDate={formatDate} />
      </div>
    </PageLayout>
  );
}

export default Dashboard;
