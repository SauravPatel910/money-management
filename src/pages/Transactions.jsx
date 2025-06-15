import { useCallback } from "react";
import { useSelector } from "react-redux";
import {
  toggleSortOrder as toggleSortOrderAction,
  deleteTransactionThunk,
  selectSortOrder,
} from "../store/transactionsSlice";
import { useAppData } from "../hooks/useAppData";
import { useCommonUtils } from "../hooks/useCommonUtils";
import TransactionHistory from "../components/transactions/TransactionHistory";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import PageLayout from "../components/UI/PageLayout";
import Loading from "../components/UI/Loading";

function TransactionHistoryPage() {
  const { transactions, dispatch, status, error } = useAppData();
  const { formatDate } = useCommonUtils();
  const sortOrder = useSelector(selectSortOrder);

  const handleToggleSortOrder = useCallback(() => {
    dispatch(toggleSortOrderAction());
  }, [dispatch]);

  const handleDeleteTransaction = useCallback(
    (id) => {
      if (confirm("Are you sure you want to delete this transaction?")) {
        dispatch(deleteTransactionThunk(id));
      }
    },
    [dispatch],
  );

  const sortedTransactions = useCallback(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);

      if (dateA.getTime() === dateB.getTime()) {
        const idA = typeof a.id === "string" ? a.id : a.id;
        const idB = typeof b.id === "string" ? b.id : b.id;
        // prettier-ignore
        return sortOrder === "newest" ? (idB > idA ? 1 : -1) : idA > idB ? 1 : -1;
      }

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
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
      <TransactionHistory
        transactions={transactions}
        sortOrder={sortOrder}
        toggleSortOrder={handleToggleSortOrder}
        formatDate={formatDate}
        deleteTransaction={handleDeleteTransaction}
        sortTransactions={sortedTransactions}
      />
    </PageLayout>
  );
}

export default TransactionHistoryPage;
