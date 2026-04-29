import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../config/reduxStore";
import {
  selectTransactions,
  selectAccounts,
  selectCategories,
  selectTransactionsStatus,
  selectTransactionsError,
  selectAccountsStatus,
  selectAccountsError,
  selectCategoriesStatus,
  selectCategoriesError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
  fetchCategoriesThunk,
} from "../store/transactionsSlice";

export const useAppData = () => {
  const transactions = useAppSelector(selectTransactions);
  const accounts = useAppSelector(selectAccounts);
  const categories = useAppSelector(selectCategories);
  const transactionsStatus = useAppSelector(selectTransactionsStatus);
  const transactionsError = useAppSelector(selectTransactionsError);
  const accountsStatus = useAppSelector(selectAccountsStatus);
  const accountsError = useAppSelector(selectAccountsError);
  const categoriesStatus = useAppSelector(selectCategoriesStatus);
  const categoriesError = useAppSelector(selectCategoriesError);
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
  }, [accountsStatus, categoriesStatus, transactionsStatus, dispatch]);

  return {
    transactions,
    accounts,
    categories,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
    dispatch,
  };
};
