import { useCallback } from "react";
import type {
  Account,
  TransactionFormState,
  TransactionInput,
} from "../types/money";

type ValidationResult =
  | { ok: true; amount: number; transaction: TransactionInput }
  | { ok: false; message: string };

type ValidationOptions = {
  checkAvailableBalance?: boolean;
};

export const useTransactionValidation = (accounts: Account[]) => {
  return useCallback(
    (
      form: TransactionFormState,
      options: ValidationOptions = {},
    ): ValidationResult => {
      const amount = parseFloat(String(form.amount));

      if (Number.isNaN(amount) || amount <= 0) {
        return {
          ok: false,
          message: "Please enter a valid amount greater than 0",
        };
      }

      if (!form.categoryId) {
        return { ok: false, message: "Please select a category" };
      }

      if ((form.type === "income" || form.type === "expense") && !form.account) {
        return { ok: false, message: "Please select an account" };
      }

      if (form.type === "transfer") {
        if (!form.from || !form.to) {
          return { ok: false, message: "Please select both transfer accounts" };
        }

        if (form.from === form.to) {
          return {
            ok: false,
            message: "You cannot transfer money to the same account",
          };
        }
      }

      if (form.type === "person") {
        if (!form.account) {
          return { ok: false, message: "Please select an account" };
        }

        if (!form.direction) {
          return { ok: false, message: "Please select a payment direction" };
        }

        if (!form.person?.trim()) {
          return { ok: false, message: "Please enter the person's name" };
        }
      }

      if (options.checkAvailableBalance) {
        const getAccount = (id?: string) =>
          accounts.find((account) => account.id === id);
        const sourceAccount =
          form.type === "transfer"
            ? getAccount(form.from)
            : form.type === "expense" ||
                (form.type === "person" && form.direction === "to")
              ? getAccount(form.account)
              : undefined;

        if (sourceAccount && amount > sourceAccount.balance) {
          const reason =
            form.type === "transfer"
              ? "for this transfer"
              : form.type === "expense"
                ? "for this expense"
                : "to make this payment";
          return {
            ok: false,
            message: `Not enough balance in your ${sourceAccount.name || "account"} ${reason}`,
          };
        }
      }

      return {
        ok: true,
        amount,
        transaction: {
          ...form,
          amount,
        },
      };
    },
    [accounts],
  );
};
