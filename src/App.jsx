import { useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  addTransaction as addTransactionAction,
  deleteTransaction as deleteTransactionAction,
  toggleSortOrder as toggleSortOrderAction,
  selectTransactions,
  selectBalance,
  selectSummary,
  selectSortOrder,
} from "./store/transactionsSlice";
import BalanceCard from "./components/BalanceCard";
import TransactionForm from "./components/TransactionForm";
import RecentActivity from "./components/RecentActivity";
import TransactionHistory from "./components/TransactionHistory";

function App() {
  // Use Redux selectors instead of local state
  const transactions = useSelector(selectTransactions);
  const balance = useSelector(selectBalance);
  const summary = useSelector(selectSummary);
  const sortOrder = useSelector(selectSortOrder);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    transactionDate: new Date().toISOString().split("T")[0],
    note: "",
    category: "general",
  });

  // Memoized function for handling input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }, []);

  // Memoized function for handling type changes
  const handleTypeChange = useCallback((type) => {
    setForm((prevForm) => ({ ...prevForm, type, category: "general" }));
  }, []);

  // Memoized function for adding transactions
  const handleAddTransaction = useCallback(
    (e) => {
      e.preventDefault();
      const amount = parseFloat(form.amount);

      if (amount <= 0) {
        alert("Please enter a valid amount greater than 0");
        return;
      }

      const newTransaction = {
        id: Date.now(),
        ...form,
        amount,
        entryDate: new Date().toISOString().split("T")[0],
      };

      dispatch(addTransactionAction(newTransaction));

      setForm((prevForm) => ({
        ...prevForm,
        amount: "",
        note: "",
        category: "general",
      }));
    },
    [form, dispatch],
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
        <h1 className="mb-10 text-center text-4xl font-bold text-primary-800 drop-shadow-sm">
          <span className="decoration-primary-400">Money Management App</span>
        </h1>

        <BalanceCard balance={balance} summary={summary} />

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TransactionForm
            form={form}
            handleInputChange={handleInputChange}
            handleTypeChange={handleTypeChange}
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
