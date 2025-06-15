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

  // Common fields for all transaction types
  const commonFields = useMemo(() => {
    return [
      <div className="mb-4" key="amount">
        <Input
          label="Amount"
          name="amount"
          type="number"
          step="1.00"
          value={form.amount}
          onChange={handleInputChange}
          placeholder="Enter amount"
          required
        />
      </div>,
      <div className="mb-4" key="date">
        <Input
          label="Date"
          name="transactionDate"
          type="date"
          value={form.transactionDate}
          onChange={handleInputChange}
          required
        />
      </div>,
    ];
  }, [form.amount, form.transactionDate, handleInputChange]);

  // Type-specific fields
  const typeSpecificFields = useMemo(() => {
    const fields = []; // Fields specific to transaction types
    if (form.type === "income" || form.type === "expense") {
      fields.push(
        <div className="mb-4" key="account">
          <Select
            label="Account"
            name="account"
            value={form.account || "cash"}
            onChange={handleSelectChange}
            options={accountOptions.map((option) => option.label)}
            required
          />
        </div>,
      );
    } else if (form.type === "transfer") {
      fields.push(
        <div className="mb-4" key="from">
          <Select
            label="From Account"
            name="from"
            value={form.from || "cash"}
            onChange={handleSelectChange}
            options={accountOptions.map((option) => option.label)}
            required
          />
        </div>,
        <div className="mb-4" key="to">
          <Select
            label="To Account"
            name="to"
            value={form.to || "bank"}
            onChange={handleSelectChange}
            options={accountOptions.map((option) => option.label)}
            required
          />
        </div>,
      );
    } else if (form.type === "person") {
      fields.push(
        <div className="mb-4" key="direction">
          <Select
            label="Direction"
            name="direction"
            value={form.direction || "to"}
            onChange={handleSelectChange}
            options={["to", "from"]}
            required
          />
        </div>,
        <div className="mb-4" key="account">
          <Select
            label="Account"
            name="account"
            value={form.account || "cash"}
            onChange={handleSelectChange}
            options={accountOptions.map((option) => option.label)}
            required
          />
        </div>,
        <div className="mb-4" key="person">
          <Input
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
        <Input
          label="Note (Optional)"
          name="note"
          type="text"
          value={form.note || ""}
          onChange={handleInputChange}
          placeholder="Add a note"
        />
      </div>,
    );

    return fields;
  }, [
    form.type,
    form.account,
    form.from,
    form.to,
    form.direction,
    form.person,
    form.note,
    accountOptions,
    handleInputChange,
    handleSelectChange,
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

        {commonFields}
        {typeSpecificFields}

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
