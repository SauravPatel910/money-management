import { useCallback, useState } from "react";
import type { ChangeEvent } from "react";
import type {
  Account,
  TransactionFormState,
  TransactionType,
} from "../types/money";
import { getCurrentIstDateTimeInputs } from "../utils/dateTime";
import {
  type LockedIstDateTime,
  useLockedIstDateTime,
} from "./useLockedIstDateTime";

type UseTransactionFormOptions<TForm extends TransactionFormState> = {
  initialForm: TForm;
  accounts: Account[];
  lockDateTime?: boolean;
};

const withLockedDateTime = <TForm extends TransactionFormState>(
  form: TForm,
  dateTime: LockedIstDateTime,
) => ({
  ...form,
  transactionTime: dateTime.time,
  entryDate: dateTime.date,
  entryTime: dateTime.time,
});

export const useTransactionForm = <TForm extends TransactionFormState>({
  initialForm,
  accounts,
  lockDateTime = true,
}: UseTransactionFormOptions<TForm>) => {
  const [form, setForm] = useState<TForm>(initialForm);

  const lockFormDateTime = useCallback((dateTime: LockedIstDateTime) => {
    setForm((prevForm) => withLockedDateTime(prevForm, dateTime));
  }, []);

  useLockedIstDateTime(lockFormDateTime, lockDateTime);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }, []);

  const handleTypeChange = useCallback(
    (type: TransactionType) => {
      setForm((prevForm) => {
        const newForm = { ...prevForm, type };

        if (type === "income" || type === "expense") {
          delete newForm.from;
          delete newForm.to;
          delete newForm.direction;
          delete newForm.person;
          newForm.account = newForm.account || "cash";
        } else if (type === "transfer") {
          delete newForm.account;
          delete newForm.direction;
          delete newForm.person;
          newForm.from = newForm.from || "cash";
          newForm.to =
            newForm.to ||
            accounts.find((account) => account.id !== newForm.from)?.id ||
            "bank";
        } else if (type === "person") {
          delete newForm.from;
          delete newForm.to;
          newForm.direction = newForm.direction || "to";
          newForm.account = newForm.account || "cash";
          newForm.person = newForm.person || "";
        }

        delete newForm.categoryId;
        delete newForm.subcategoryId;
        return newForm;
      });
    },
    [accounts],
  );

  const handleSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => {
      const nextForm = { ...prevForm, [name]: value };

      if (name === "from" && value === prevForm.to) {
        nextForm.to = prevForm.from;
      } else if (name === "to" && value === prevForm.from) {
        nextForm.from = prevForm.to;
      } else if (name === "categoryId") {
        nextForm.subcategoryId = "";
      }

      return nextForm;
    });
  }, []);

  const resetAfterSubmit = useCallback(() => {
    setForm((prevForm) => {
      const latestDateTime = getCurrentIstDateTimeInputs();
      const resetForm = withLockedDateTime(prevForm, {
        date: latestDateTime.date,
        time: latestDateTime.time,
      });

      resetForm.amount = "";
      resetForm.note = "";
      if (resetForm.type === "person") {
        resetForm.person = "";
      }

      return resetForm;
    });
  }, []);

  return {
    form,
    setForm,
    handleInputChange,
    handleTypeChange,
    handleSelectChange,
    resetAfterSubmit,
  };
};
