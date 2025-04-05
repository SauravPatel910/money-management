import { memo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectAccounts } from "../store/transactionsSlice";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";

const TransactionForm = ({
  form,
  handleInputChange,
  handleTypeChange,
  handleSelectChange,
  addTransaction,
}) => {
  const accounts = useSelector(selectAccounts);
  const [formFields, setFormFields] = useState([]);

  // Extract account options for select fields
  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  // Dynamically update form fields based on transaction type
  useEffect(() => {
    let fields = [];

    // Common fields for all transaction types
    fields.push(
      <div className="mb-4" key="amount">
        <FormInput
          label="Amount"
          name="amount"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={handleInputChange}
          placeholder="Enter amount"
          required
        />
      </div>,
    );

    fields.push(
      <div className="mb-4" key="date">
        <FormInput
          label="Date"
          name="transactionDate"
          type="date"
          value={form.transactionDate}
          onChange={handleInputChange}
          required
        />
      </div>,
    );

    // Fields specific to transaction types
    if (form.type === "income" || form.type === "expense") {
      fields.push(
        <div className="mb-4" key="account">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            Account
          </label>
          <select
            name="account"
            id="account"
            value={form.account || "cash"}
            onChange={handleSelectChange}
            required
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>,
      );
    } else if (form.type === "transfer") {
      fields.push(
        <div className="mb-4" key="from">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            From Account
          </label>
          <select
            name="from"
            id="from"
            value={form.from || "cash"}
            onChange={handleSelectChange}
            required
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>,
      );

      fields.push(
        <div className="mb-4" key="to">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            To Account
          </label>
          <select
            name="to"
            id="to"
            value={form.to || "bank"}
            onChange={handleSelectChange}
            required
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>,
      );
    } else if (form.type === "person") {
      fields.push(
        <div className="mb-4" key="direction">
          <FormSelect
            label="Direction"
            name="direction"
            value={form.direction || "to"}
            onChange={handleSelectChange}
            options={["to", "from"]}
            required
          />
        </div>,
      );

      fields.push(
        <div className="mb-4" key="account">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            Account
          </label>
          <select
            name="account"
            id="account"
            value={form.account || "cash"}
            onChange={handleSelectChange}
            required
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            {accountOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>,
      );

      fields.push(
        <div className="mb-4" key="person">
          <FormInput
            label="Person's Name"
            name="person"
            type="text"
            value={form.person || ""}
            onChange={handleInputChange}
            placeholder="Enter person's name"
            required
          />
        </div>,
      );
    }

    // Note field for all transaction types
    fields.push(
      <div className="mb-6" key="note">
        <FormInput
          label="Note (Optional)"
          name="note"
          type="text"
          value={form.note}
          onChange={handleInputChange}
          placeholder="Add a note"
        />
      </div>,
    );

    setFormFields(fields);
  }, [form, handleInputChange, handleSelectChange, accountOptions]);

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
            <TypeButton
              type="income"
              currentType={form.type}
              onClick={handleTypeChange}
            />
            <TypeButton
              type="expense"
              currentType={form.type}
              onClick={handleTypeChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TypeButton
              type="transfer"
              currentType={form.type}
              onClick={handleTypeChange}
            />
            <TypeButton
              type="person"
              currentType={form.type}
              onClick={handleTypeChange}
            />
          </div>
        </div>

        {formFields}

        <div>
          <button
            type="submit"
            className="flex w-full transform items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-center font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <svg
              className="mr-2 h-5 w-5"
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
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
};

// Memoized Type Button component
const TypeButton = memo(({ type, currentType, onClick }) => {
  const isActive = type === currentType;
  const baseClasses =
    "flex items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-medium transition-all duration-200";

  let activeClasses;
  if (type === "income") {
    activeClasses =
      "bg-gradient-to-r from-income to-income-dark text-white shadow-md";
  } else if (type === "expense") {
    activeClasses =
      "bg-gradient-to-r from-expense to-expense-dark text-white shadow-md";
  } else if (type === "transfer") {
    activeClasses =
      "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md";
  } else if (type === "person") {
    activeClasses =
      "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-md";
  }

  const inactiveClasses = "bg-gray-100 text-gray-500 hover:bg-gray-200";

  return (
    <button
      type="button"
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      onClick={() => onClick(type)}
    >
      <svg
        className="mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        {type === "income" && (
          <path
            fillRule="evenodd"
            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        )}
        {type === "expense" && (
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        )}
        {type === "transfer" && (
          <path
            fillRule="evenodd"
            d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        )}
        {type === "person" && (
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        )}
      </svg>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );
});

// Export memoized component
export default memo(TransactionForm);
