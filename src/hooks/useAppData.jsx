import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectTransactions,
  selectAccounts,
  selectTransactionsStatus,
  selectTransactionsError,
  fetchTransactionsThunk,
  fetchAccountsThunk,
} from "../store/transactionsSlice";

export const useAppData = () => {
  const transactions = useSelector(selectTransactions);
  const accounts = useSelector(selectAccounts);
  const status = useSelector(selectTransactionsStatus);
  const error = useSelector(selectTransactionsError);
  const dispatch = useDispatch();

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTransactionsThunk());
      dispatch(fetchAccountsThunk());
    }
  }, [status, dispatch]);

  return { transactions, accounts, status, error, dispatch };
};
