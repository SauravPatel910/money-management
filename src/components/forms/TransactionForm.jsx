import { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAccounts } from "../../store/transactionsSlice";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";

const TransactionForm = ({
  form,
  handleInputChange,
  handleTypeChange,
  handleSelectChange,
  addTransaction,
}) => {
  const accounts = useSelector(selectAccounts);

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
    // Sort account options alphabetically by name
    const accountOpts = [...accountOptions]
      .map((opt) => opt.label)
      .sort((a, b) => a.localeCompare(b));

    const fieldMap = {
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
        label: "Date",
        type: "date",
        required: true,
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
          defaultValue: accountOpts[0],
          required: true,
        },
        to: {
          component: Select,
          label: "To Account",
          options: accountOpts.filter(
            (opt) => opt !== (form.from || accountOpts[0]),
          ),
          defaultValue:
            accountOpts.find((opt) => opt !== (form.from || accountOpts[0])) ||
            accountOpts[1],
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

    return Object.entries(fieldMap).map(([name, config]) => {
      const Component = config.component;
      const isNote = name === "note";
      const value = form[name] || config.defaultValue || "";
      const onChange =
        Component === Select ? handleSelectChange : handleInputChange;

      if (config.label && config.options) {
        console.log(config.label, config.options);
      }

      return (
        <div className={isNote ? "mb-6" : "mb-4"} key={name}>
          <Component
            label={config.label}
            name={name}
            value={value}
            onChange={onChange}
            {...(config.type && { type: config.type })}
            {...(config.step && { step: config.step })}
            {...(config.placeholder && { placeholder: config.placeholder })}
            {...(config.options && { options: config.options })}
            {...(config.required && { required: config.required })}
          />
        </div>
      );
    });
  }, [form, accountOptions, handleInputChange, handleSelectChange]);

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
        Add Transaction
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

        <div>
          <Button variant="action" htmlType="submit" icon={addTransactionIcon}>
            Add Transaction
          </Button>
        </div>
      </form>
    </div>
  );
};

// ...existing code...
// Remove the old TypeButton component if it was defined here
// ...existing code...

export default memo(TransactionForm);
