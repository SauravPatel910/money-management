import { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  addTransaction as addTransactionAction,
  selectTransactions,
  selectAccounts,
  // selectTotalBalance,
  // selectSummary,
  // selectSortOrder,
} from "../store/transactionsSlice";
import BalanceCard from "../components/BalanceCard";
import TransactionForm from "../components/TransactionForm";
import RecentActivity from "../components/RecentActivity";

function HomePage() {
  // Use Redux selectors
  const transactions = useSelector(selectTransactions);
  const accounts = useSelector(selectAccounts);
  // const totalBalance = useSelector(selectTotalBalance);
  // const summary = useSelector(selectSummary);
  // const sortOrder = useSelector(selectSortOrder);
  const dispatch = useDispatch();

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
      // Reset some form fields when changing type to avoid invalid data
      setForm((prevForm) => {
        const newForm = { ...prevForm, type };

        // Remove fields that are not relevant to the new type
        if (type === "income" || type === "expense") {
          delete newForm.from;
          delete newForm.to;
          delete newForm.direction;
          delete newForm.person;
        } else if (type === "transfer") {
          delete newForm.account;
          delete newForm.direction;
          delete newForm.person;
          // Set defaults for transfer
          newForm.from = "cash";
          newForm.to = accounts.length > 1 ? accounts[1].id : "bank";
        } else if (type === "person") {
          delete newForm.from;
          delete newForm.to;
          // Set defaults for person transaction
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

      // Prevent setting same account for from/to in transfers
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

      // Find relevant account objects for validation
      const getAccount = (id) => accounts.find((acc) => acc.id === id);

      // Validate form based on transaction type
      if (form.type === "transfer") {
        if (form.from === form.to) {
          alert("You cannot transfer money to the same account");
          return;
        }

        // Check if there's enough money in the 'from' account
        const sourceAccount = getAccount(form.from);
        const sourceBalance = sourceAccount ? sourceAccount.balance : 0;

        if (amount > sourceBalance) {
          alert(
            `Not enough balance in your ${sourceAccount?.name || "account"} for this transfer`,
          );
          return;
        }
      } else if (form.type === "person" && form.direction === "to") {
        // Check if there's enough money for paying someone
        const sourceAccount = getAccount(form.account);
        const sourceBalance = sourceAccount ? sourceAccount.balance : 0;

        if (amount > sourceBalance) {
          alert(
            `Not enough balance in your ${sourceAccount?.name || "account"} to make this payment`,
          );
          return;
        }
      } else if (form.type === "expense") {
        // Check if there's enough money for an expense
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
        id: Date.now(),
        ...form,
        amount,
        entryDate: new Date().toISOString().split("T")[0],
      };

      dispatch(addTransactionAction(newTransaction));

      // Reset form fields
      setForm((prevForm) => {
        const resetForm = { ...prevForm, amount: "", note: "" };

        // Keep type-specific fields
        if (form.type === "person") {
          resetForm.person = ""; // Reset person name for new entry
        }

        return resetForm;
      });
    },
    [form, dispatch, accounts],
  );

  // Memoized formatter function
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Using React Query for any potential async operations
  const { data: cachedTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => Promise.resolve(transactions),
    initialData: transactions,
    enabled: transactions.length > 0,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/accounts"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Manage Accounts
          </Link>
          <Link
            to="/transactions"
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Transaction History
          </Link>
        </div>
      </div>

      <BalanceCard />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TransactionForm
          form={form}
          handleInputChange={handleInputChange}
          handleTypeChange={handleTypeChange}
          handleSelectChange={handleSelectChange}
          addTransaction={handleAddTransaction}
        />

        <RecentActivity
          transactions={cachedTransactions || transactions}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
}

export default HomePage;
