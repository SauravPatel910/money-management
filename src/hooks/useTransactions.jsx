import { use } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  addTransaction as addTransactionAction,
  deleteTransaction as deleteTransactionAction,
} from "../store/transactionsSlice";

/**
 * Custom hook for transaction operations using React 19's use hook
 * This provides an efficient way to handle data fetching directly
 */
export const useTransactions = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  // Create a promise for fetching transactions
  const fetchTransactionsPromise = async () => {
    // In a real app, this would be a fetch call to your API
    const localTransactions = JSON.parse(
      localStorage.getItem("transactions") || "[]",
    );
    return localTransactions;
  };

  // Create a reusable transaction fetcher
  // In a real-world application, you'd likely memoize this
  const transactionPromise = fetchTransactionsPromise();

  // Use the new use hook to directly consume the promise in render
  const transactions = use(transactionPromise);

  // Add transaction mutation
  const addTransaction = useMutation({
    mutationFn: async (transaction) => {
      // Mock API call - replace with actual API when you have a backend
      return transaction;
    },
    onSuccess: (newTransaction) => {
      // Update Redux state
      dispatch(addTransactionAction(newTransaction));

      // Invalidate and refetch the 'transactions' query
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id) => {
      // Mock API call - replace with actual API when you have a backend
      return id;
    },
    onSuccess: (id) => {
      // Update Redux state
      dispatch(deleteTransactionAction(id));

      // Invalidate and refetch the 'transactions' query
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    transactions,
    isLoading: false, // With use hook, loading state is handled by React's Suspense
    error: null, // With use hook, errors can be caught with ErrorBoundary
    addTransaction: addTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isAddingTransaction: addTransaction.isPending,
    isDeletingTransaction: deleteTransaction.isPending,
  };
};

export default useTransactions;
