import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  addTransaction as addTransactionAction,
  deleteTransaction as deleteTransactionAction,
} from "../store/transactionsSlice";

/**
 * Custom hook for transaction operations with React Query
 * This provides an efficient way to handle API calls if you expand the app with a backend
 */
export const useTransactions = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  // Get transactions (currently mocked, but ready for API integration)
  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      // Mock API call - replace with actual API when you have a backend
      const localTransactions = JSON.parse(
        localStorage.getItem("transactions") || "[]",
      );
      return localTransactions;

      // When you have an API, you would use:
      // const response = await fetch('/api/transactions');
      // return response.json();
    },
    // Configure stale time to reduce unnecessary refetches
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add transaction mutation
  const addTransaction = useMutation({
    mutationFn: async (transaction) => {
      // Mock API call - replace with actual API when you have a backend
      // This would normally be a POST request to your API
      // const response = await fetch('/api/transactions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(transaction)
      // });
      // return response.json();

      // For now, we're just using Redux and localStorage
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
      // This would normally be a DELETE request to your API
      // await fetch(`/api/transactions/${id}`, { method: 'DELETE' });

      // For now, we're just using Redux and localStorage
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
    isLoading,
    error,
    addTransaction: addTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isAddingTransaction: addTransaction.isPending,
    isDeletingTransaction: deleteTransaction.isPending,
  };
};

export default useTransactions;
