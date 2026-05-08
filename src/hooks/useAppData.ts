import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../config/reduxStore";
import {
  selectTransactions,
  selectAccounts,
  selectCategories,
  selectBudgets,
  selectRecurringBills,
  selectTransactionsStatus,
  selectTransactionsError,
  selectAccountsStatus,
  selectAccountsError,
  selectCategoriesStatus,
  selectCategoriesError,
  selectBudgetsStatus,
  selectBudgetsError,
  selectRecurringBillsStatus,
  selectRecurringBillsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
  fetchCategoriesThunk,
  fetchBudgetsThunk,
  fetchRecurringBillsThunk,
} from "../store/transactionsSlice";

export const useAppData = () => {
  const transactions = useAppSelector(selectTransactions);
  const accounts = useAppSelector(selectAccounts);
  const categories = useAppSelector(selectCategories);
  const budgets = useAppSelector(selectBudgets);
  const recurringBills = useAppSelector(selectRecurringBills);
  const transactionsStatus = useAppSelector(selectTransactionsStatus);
  const transactionsError = useAppSelector(selectTransactionsError);
  const accountsStatus = useAppSelector(selectAccountsStatus);
  const accountsError = useAppSelector(selectAccountsError);
  const categoriesStatus = useAppSelector(selectCategoriesStatus);
  const categoriesError = useAppSelector(selectCategoriesError);
  const budgetsStatus = useAppSelector(selectBudgetsStatus);
  const budgetsError = useAppSelector(selectBudgetsError);
  const recurringBillsStatus = useAppSelector(selectRecurringBillsStatus);
  const recurringBillsError = useAppSelector(selectRecurringBillsError);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (transactionsStatus === "idle") {
      dispatch(fetchTransactionsThunk());
    }

    if (accountsStatus === "idle") {
      dispatch(fetchAccountsThunk());
    }

    if (categoriesStatus === "idle") {
      dispatch(fetchCategoriesThunk());
    }

    if (budgetsStatus === "idle") {
      dispatch(fetchBudgetsThunk());
    }

    if (recurringBillsStatus === "idle") {
      dispatch(fetchRecurringBillsThunk());
    }
  }, [
    accountsStatus,
    budgetsStatus,
    categoriesStatus,
    recurringBillsStatus,
    transactionsStatus,
    dispatch,
  ]);

  return {
    transactions,
    accounts,
    categories,
    budgets,
    recurringBills,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
    budgetsStatus,
    budgetsError,
    recurringBillsStatus,
    recurringBillsError,
    dispatch,
  };
};
