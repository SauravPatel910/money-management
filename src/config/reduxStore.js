import { configureStore } from "@reduxjs/toolkit";
import transactionsReducer from "../store/transactionsSlice";

export const reduxStore = configureStore({
  reducer: {
    transactions: transactionsReducer,
  },
  // Adding Redux DevTools extension support
  devTools: import.meta.env.MODE !== "production",
});

export default reduxStore;
