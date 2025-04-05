import { memo } from "react";
import FormInput from "./FormInput";

const TransactionForm = ({
  form,
  handleInputChange,
  handleTypeChange,
  addTransaction,
}) => {
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
          <div className="flex space-x-4">
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
        </div>

        <div className="mb-4">
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
        </div>

        <div className="mb-4">
          <FormInput
            label="Date"
            name="transactionDate"
            type="date"
            value={form.transactionDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="mb-6">
          <FormInput
            label="Note (Optional)"
            name="note"
            type="text"
            value={form.note}
            onChange={handleInputChange}
            placeholder="Add a note"
          />
        </div>

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
    "flex flex-1 items-center justify-center rounded-lg px-4 py-3 text-center text-sm font-medium transition-all duration-200";

  const activeClasses =
    type === "income"
      ? "bg-gradient-to-r from-income to-income-dark text-white shadow-md"
      : "bg-gradient-to-r from-expense to-expense-dark text-white shadow-md";

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
        {type === "income" ? (
          <path
            fillRule="evenodd"
            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
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
