import { configureStore } from "@reduxjs/toolkit";
import transactionsReducer from "./transactionsSlice";

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
  },
  // Adding Redux DevTools extension support
  devTools: import.meta.env.MODE !== "production",
});

export default store;
