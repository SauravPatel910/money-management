import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../config/reduxStore";
import {
  selectTransactions,
  selectAccounts,
  selectTransactionsStatus,
  selectTransactionsError,
  selectAccountsStatus,
  selectAccountsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
} from "../store/transactionsSlice";

export const useAppData = () => {
  const transactions = useAppSelector(selectTransactions);
  const accounts = useAppSelector(selectAccounts);
  const transactionsStatus = useAppSelector(selectTransactionsStatus);
  const transactionsError = useAppSelector(selectTransactionsError);
  const accountsStatus = useAppSelector(selectAccountsStatus);
  const accountsError = useAppSelector(selectAccountsError);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (transactionsStatus === "idle") {
      dispatch(fetchTransactionsThunk());
    }

    if (accountsStatus === "idle") {
      dispatch(fetchAccountsThunk());
    }
  }, [accountsStatus, transactionsStatus, dispatch]);

  return {
    transactions,
    accounts,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    dispatch,
  };
};
