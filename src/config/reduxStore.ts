import { configureStore } from "@reduxjs/toolkit";
import transactionsReducer from "../store/transactionsSlice";

export const reduxStore = configureStore({
  reducer: {
    transactions: transactionsReducer,
  },
  // Adding Redux DevTools extension support
  devTools: process.env.NODE_ENV !== "production",
});

export default reduxStore;
