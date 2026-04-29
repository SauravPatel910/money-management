import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import transactionsReducer from "../store/transactionsSlice";

export const reduxStore = configureStore({
  reducer: {
    transactions: transactionsReducer,
  },
  // Adding Redux DevTools extension support
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof reduxStore.getState>;
export type AppDispatch = typeof reduxStore.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default reduxStore;
