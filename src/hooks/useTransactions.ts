import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTransaction,
  deleteTransaction,
  fetchTransactions,
} from "@/services/moneyService";

export const useTransactions = () => {
  const queryClient = useQueryClient();
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  });

  const addTransactionMutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    addTransaction: addTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    isAddingTransaction: addTransactionMutation.isPending,
    isDeletingTransaction: deleteTransactionMutation.isPending,
  };
};

export default useTransactions;
