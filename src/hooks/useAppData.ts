import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../config/reduxStore";
import {
  selectTransactions,
  selectAccounts,
  selectTransactionsStatus,
  selectTransactionsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
} from "../store/transactionsSlice";

export const useAppData = () => {
  const transactions = useAppSelector(selectTransactions);
  const accounts = useAppSelector(selectAccounts);
  const status = useAppSelector(selectTransactionsStatus);
  const error = useAppSelector(selectTransactionsError);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTransactionsThunk());
      dispatch(fetchAccountsThunk());
    }
  }, [status, dispatch]);

  return { transactions, accounts, status, error, dispatch };
};
