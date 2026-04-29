import { memo, useMemo } from "react";
import type {
  ChangeEventHandler,
  ComponentType,
  HTMLInputTypeAttribute,
  ReactNode,
  SubmitEventHandler,
} from "react";
import { useAppSelector } from "../../config/reduxStore";
import {
  selectAccounts,
  selectCategories,
} from "../../store/transactionsSlice";
import Input from "./Input";
import Select from "./Select";
import type { SelectOption } from "./Select";
import Button from "./Button";
import type {
  TransactionFormFieldName,
  TransactionFormState,
  TransactionType,
} from "../../types/money";

type FieldConfig = {
  component: ComponentType<{
    label: string;
    name: string;
    value: string | number;
    onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
    type?: HTMLInputTypeAttribute;
    step?: string;
    placeholder?: string;
    options?: SelectOption[];
    required?: boolean;
    disabled?: boolean;
  }>;
  label: string;
  type?: HTMLInputTypeAttribute;
  step?: string;
  placeholder?: string;
  options?: SelectOption[];
  defaultValue?: string;
  required?: boolean;
};

type TransactionFormProps = {
  form: TransactionFormState;
  handleInputChange: ChangeEventHandler<HTMLInputElement>;
  handleTypeChange: (type: TransactionType) => void;
  handleSelectChange: ChangeEventHandler<HTMLSelectElement>;
  addTransaction: SubmitEventHandler<HTMLFormElement>;
  title?: string;
  submitLabel?: string;
  submitIcon?: ReactNode;
  onCancel?: () => void;
  disabledFields?: TransactionFormFieldName[];
  hiddenFields?: TransactionFormFieldName[];
};

const TransactionForm = ({
  form,
  handleInputChange,
  handleTypeChange,
  handleSelectChange,
  addTransaction,
  title = "Add Transaction",
  submitLabel = "Add Transaction",
  submitIcon,
  onCancel,
  disabledFields = [],
  hiddenFields = [],
}: TransactionFormProps) => {
  const accounts = useAppSelector(selectAccounts);
  const categories = useAppSelector(selectCategories);

  // Extract account options for select fields using useMemo
  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: account.id,
        label: account.name,
      })),
    [accounts],
  );
  // Dynamic field generator with complex logic
  const renderFields = useMemo(() => {
    const { type } = form;
    // Sort account options alphabetically by name while preserving account ids as values
    const accountOpts = [...accountOptions]
      .sort((a, b) => a.label.localeCompare(b.label));
    const categoryOptions = categories
      .filter((category) => category.type === type && !category.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((category) => ({ value: category.id, label: category.name }));
    const subcategoryOptions = categories
      .filter(
        (category) =>
          category.type === type && category.parentId === form.categoryId,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((category) => ({ value: category.id, label: category.name }));
    const defaultFromAccount = form.from || accountOpts[0]?.value || "";
    const defaultToAccount =
      accountOpts.find((opt) => opt.value !== defaultFromAccount)?.value || "";

    const fieldMap: Partial<Record<TransactionFormFieldName, FieldConfig>> = {
      // Common fields (always shown)
      amount: {
        component: Input,
        label: "Amount",
        type: "number",
        step: "1.00",
        placeholder: "Enter amount",
        required: true,
      },
      transactionDate: {
        component: Input,
        label: "Transaction Date",
        type: "date",
        required: true,
      },
      transactionTime: {
        component: Input,
        label: "Transaction Time",
        type: "time",
        required: true,
      },
      entryDate: {
        component: Input,
        label: "Entry Date",
        type: "date",
        required: true,
      },
      entryTime: {
        component: Input,
        label: "Entry Time",
        type: "time",
        required: true,
      },
      categoryId: {
        component: Select,
        label: "Category",
        options: categoryOptions,
        placeholder: "Select category",
        required: true,
      },
      subcategoryId: {
        component: Select,
        label: "Subcategory (Optional)",
        options: subcategoryOptions,
        placeholder: "No subcategory",
      },

      // Conditional fields based on transaction type
      ...(["income", "expense"].includes(type) && {
        account: {
          component: Select,
          label: "Account",
          options: accountOpts,
          defaultValue: "cash",
          required: true,
        },
      }),
      ...(type === "transfer" && {
        from: {
          component: Select,
          label: "From Account",
          options: accountOpts,
          defaultValue: defaultFromAccount,
          required: true,
        },
        to: {
          component: Select,
          label: "To Account",
          options: accountOpts.filter(
            (opt) => opt.value !== defaultFromAccount,
          ),
          defaultValue: defaultToAccount,
          required: true,
        },
      }),

      ...(type === "person" && {
        direction: {
          component: Select,
          label: "Direction",
          options: ["to", "from"],
          defaultValue: "to",
          required: true,
        },
        account: {
          component: Select,
          label: "Account",
          options: accountOpts,
          defaultValue: "cash",
          required: true,
        },
        person: {
          component: Input,
          label: "Person's Name",
          type: "text",
          placeholder: "Enter person's name",
          required: true,
        },
      }),

      // Note field (always shown last)
      note: {
        component: Input,
        label: "Note (Optional)",
        type: "text",
        placeholder: "Add a note",
      },
    };

    return Object.entries(fieldMap)
      .filter(([name]) =>
        !hiddenFields.includes(name as TransactionFormFieldName),
      )
      .map(([name, config]) => {
      const Component = config.component;
      const fieldName = name as TransactionFormFieldName;
      const isNote = name === "note";
      const value = form[fieldName] || config.defaultValue || "";
      const onChange =
        Component === Select ? handleSelectChange : handleInputChange;

      return (
        <div className={isNote ? "mb-6" : "mb-4"} key={name}>
          <Component
            label={config.label}
            name={name}
            value={value}
            onChange={onChange as ChangeEventHandler<HTMLInputElement | HTMLSelectElement>}
            {...(config.type && { type: config.type })}
            {...(config.step && { step: config.step })}
            {...(config.placeholder && { placeholder: config.placeholder })}
            {...(config.options && { options: config.options })}
            {...(config.required && { required: config.required })}
            disabled={disabledFields.includes(fieldName)}
          />
        </div>
      );
    });
  }, [
    form,
    accountOptions,
    categories,
    handleInputChange,
    handleSelectChange,
    hiddenFields,
    disabledFields,
  ]);

  const addTransactionIcon = (
    <svg
      className="h-5 w-5" // Retain size class here
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );

  const incomeIcon = (
    <svg
      className="h-4 w-4" // Retain size class here
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const expenseIcon = (
    <svg
      className="h-4 w-4" // Retain size class here
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const transferIcon = (
    <svg
      className="h-4 w-4" // Retain size class here
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const personIcon = (
    <svg
      className="h-4 w-4" // Retain size class here
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="rounded-2xl border-l-4 border-primary-500 bg-white/90 p-6 shadow-card backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <h3 className="mb-6 border-b border-primary-100 pb-3 text-xl font-semibold text-primary-700">
        {title}
      </h3>
      <form onSubmit={addTransaction}>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            Transaction Type
          </label>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button
              variant="income"
              isActive={form.type === "income"}
              onClick={() => handleTypeChange("income")}
              icon={incomeIcon}
            >
              Income
            </Button>
            <Button
              variant="expense"
              isActive={form.type === "expense"}
              onClick={() => handleTypeChange("expense")}
              icon={expenseIcon}
            >
              Expense
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="transfer"
              isActive={form.type === "transfer"}
              onClick={() => handleTypeChange("transfer")}
              icon={transferIcon}
            >
              Transfer
            </Button>
            <Button
              variant="person"
              isActive={form.type === "person"}
              onClick={() => handleTypeChange("person")}
              icon={personIcon}
            >
              Person
            </Button>
          </div>
        </div>

        {renderFields}

        <div className={onCancel ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : ""}>
          <Button
            variant="action"
            htmlType="submit"
            icon={submitIcon || addTransactionIcon}
          >
            {submitLabel}
          </Button>
          {onCancel && (
            <button
              type="button"
              className="flex w-full transform items-center justify-center rounded-lg border border-primary-200 bg-white px-6 py-3 text-center font-medium text-primary-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-md focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// ...existing code...
// Remove the old TypeButton component if it was defined here
// ...existing code...

export default memo(TransactionForm);
