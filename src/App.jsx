import { useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  addTransaction as addTransactionAction,
  deleteTransaction as deleteTransactionAction,
  toggleSortOrder as toggleSortOrderAction,
  selectTransactions,
  selectAccounts,
  selectTotalBalance,
  selectSummary,
  selectSortOrder,
} from "./store/transactionsSlice";
import BalanceCard from "./components/BalanceCard";
import AccountManager from "./components/AccountManager";
import TransactionForm from "./components/TransactionForm";
import RecentActivity from "./components/RecentActivity";
import TransactionHistory from "./components/TransactionHistory";

function App() {
  // Use Redux selectors
  const transactions = useSelector(selectTransactions);
  const accounts = useSelector(selectAccounts);
  const totalBalance = useSelector(selectTotalBalance);
  const summary = useSelector(selectSummary);
  const sortOrder = useSelector(selectSortOrder);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    account: "cash",
    note: "",
  });

  // State for toggling the accounts manager visibility
  const [showAccountManager, setShowAccountManager] = useState(false);

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

  // Memoized function for deleting transactions
  const handleDeleteTransaction = useCallback(
    (id) => {
      dispatch(deleteTransactionAction(id));
    },
    [dispatch],
  );

  // Memoized function for toggling sort order
  const handleToggleSortOrder = useCallback(() => {
    dispatch(toggleSortOrderAction());
  }, [dispatch]);

  // Memoized formatter function
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Memoized sorted transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);

      // If dates are equal, sort by ID (newest added first if sorting by newest)
      if (dateA.getTime() === dateB.getTime()) {
        // ID is a timestamp when the transaction was added
        return sortOrder === "newest" ? b.id - a.id : a.id - b.id;
      }

      // Otherwise sort by date
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, sortOrder]);

  // Using React Query for any potential async operations
  // This is a placeholder that you can expand for actual API calls
  const { data: cachedTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => Promise.resolve(transactions),
    initialData: transactions,
    enabled: transactions.length > 0,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 to-primary-200 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-primary-800 drop-shadow-sm">
          <span className="decoration-primary-400">Money Management App</span>
        </h1>

        <div className="mb-4 flex justify-end">
          <button
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => setShowAccountManager(!showAccountManager)}
          >
            {showAccountManager ? "Hide Accounts" : "Manage Accounts"}
          </button>
        </div>

        {showAccountManager && (
          <div className="mb-8">
            <AccountManager />
          </div>
        )}

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

        <TransactionHistory
          transactions={cachedTransactions || transactions}
          sortOrder={sortOrder}
          toggleSortOrder={handleToggleSortOrder}
          formatDate={formatDate}
          deleteTransaction={handleDeleteTransaction}
          sortTransactions={() => sortedTransactions}
        />
      </div>
    </div>
  );
}

export default App;
