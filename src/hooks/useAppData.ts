import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../config/reduxStore";
import {
  selectTransactions,
  selectAccounts,
  selectCategories,
  selectBudgets,
  selectTransactionsStatus,
  selectTransactionsError,
  selectAccountsStatus,
  selectAccountsError,
  selectCategoriesStatus,
  selectCategoriesError,
  selectBudgetsStatus,
  selectBudgetsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
  fetchCategoriesThunk,
  fetchBudgetsThunk,
} from "../store/transactionsSlice";

export const useAppData = () => {
  const transactions = useAppSelector(selectTransactions);
  const accounts = useAppSelector(selectAccounts);
  const categories = useAppSelector(selectCategories);
  const budgets = useAppSelector(selectBudgets);
  const transactionsStatus = useAppSelector(selectTransactionsStatus);
  const transactionsError = useAppSelector(selectTransactionsError);
  const accountsStatus = useAppSelector(selectAccountsStatus);
  const accountsError = useAppSelector(selectAccountsError);
  const categoriesStatus = useAppSelector(selectCategoriesStatus);
  const categoriesError = useAppSelector(selectCategoriesError);
  const budgetsStatus = useAppSelector(selectBudgetsStatus);
  const budgetsError = useAppSelector(selectBudgetsError);
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
  }, [accountsStatus, budgetsStatus, categoriesStatus, transactionsStatus, dispatch]);

  return {
    transactions,
    accounts,
    categories,
    budgets,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
    budgetsStatus,
    budgetsError,
    dispatch,
  };
};
