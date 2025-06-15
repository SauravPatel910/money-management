import { useDispatch } from "react-redux";
import {
  fetchAccountsThunk,
  fetchTransactionsThunk,
} from "../../store/transactionsSlice";

function Failed({ error, text = "Faild to load data." }) {
  const dispatch = useDispatch();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 rounded-lg bg-expense-light/50 p-4 text-expense-dark">
        <h2 className="mb-2 text-xl font-bold">Error Loading Account Data</h2>
        <p>{error || text}</p>
        <button
          onClick={() => {
            dispatch(fetchTransactionsThunk());
            dispatch(fetchAccountsThunk());
          }}
          className="mt-3 rounded-lg bg-primary-500 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export default Failed;
