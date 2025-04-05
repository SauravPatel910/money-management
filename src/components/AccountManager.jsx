import { memo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAccounts,
  addAccount,
  editAccount,
  deleteAccount,
} from "../store/transactionsSlice";
import FormInput from "./FormInput";

// Account icon components
const AccountIcon = memo(({ type }) => {
  switch (type) {
    case "cash":
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "bank":
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "credit":
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path
            fillRule="evenodd"
            d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "savings":
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "investment":
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "wallet":
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      );
    default:
      return (
        <svg
          className="h-5 w-5 text-primary-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
});

// Account Type Options Component
const AccountTypeOptions = memo(() => (
  <>
    <option value="bank">Bank Account</option>
    <option value="credit">Credit Card</option>
    <option value="savings">Savings</option>
    <option value="investment">Investment</option>
    <option value="wallet">Digital Wallet</option>
  </>
));

// Add Account Form Component
const AddAccountForm = memo(
  ({ newAccount, handleInputChange, handleAddAccount, onCancel }) => (
    <div className="mb-6 rounded-lg border border-primary-100 bg-primary-50/50 p-4">
      <h4 className="mb-3 text-lg font-medium text-primary-700">
        Add New Account
      </h4>
      <form onSubmit={handleAddAccount}>
        <div className="mb-3">
          <FormInput
            label="Account Name"
            name="name"
            type="text"
            value={newAccount.name}
            onChange={handleInputChange}
            placeholder="e.g. Savings Account, Credit Card"
            required
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            Account Type
          </label>
          <select
            name="icon"
            value={newAccount.icon}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm capitalize shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            <AccountTypeOptions />
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-primary-600 hover:to-primary-700"
          >
            Add Account
          </button>
        </div>
      </form>
    </div>
  ),
);

// Edit Account Form Component
const EditAccountForm = memo(
  ({ account, handleInputChange, handleEditAccount, onCancel }) => (
    <form onSubmit={(e) => handleEditAccount(e, account.id)}>
      <div className="mb-3">
        <FormInput
          label="Account Name"
          name="name"
          type="text"
          value={account.name}
          onChange={(e) => handleInputChange(e, account.id)}
          placeholder="Account Name"
          required
        />
      </div>
      {account.id !== "cash" && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-primary-700">
            Account Type
          </label>
          <select
            name="icon"
            value={account.icon}
            onChange={(e) => handleInputChange(e, account.id)}
            className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm capitalize shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            <AccountTypeOptions />
          </select>
        </div>
      )}
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:from-primary-600 hover:to-primary-700"
        >
          Save
        </button>
      </div>
    </form>
  ),
);

// Account Card Component
const AccountCard = memo(({ account, onEdit, onDelete }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <div className="mr-3 rounded-full bg-primary-100 p-2">
        <AccountIcon type={account.icon} />
      </div>
      <div>
        <h4 className="font-medium text-primary-800">{account.name}</h4>
        <p className="text-sm font-semibold text-primary-600">
          ₹
          {account.balance.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
    <div className="hidden space-x-2 group-hover:flex">
      <button
        className="rounded-lg bg-primary-100 p-1.5 text-primary-700 transition-colors hover:bg-primary-200"
        onClick={onEdit}
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
      {account.id !== "cash" && (
        <button
          className="rounded-lg bg-expense-light p-1.5 text-expense-dark transition-colors hover:bg-expense/20"
          onClick={onDelete}
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  </div>
));

const AccountManager = () => {
  const accounts = useSelector(selectAccounts);
  const dispatch = useDispatch();
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [newAccount, setNewAccount] = useState({ name: "", icon: "bank" });

  // Memoized callbacks
  const handleAddAccount = useCallback(
    (e) => {
      e.preventDefault();

      if (!newAccount.name.trim()) {
        alert("Please enter an account name");
        return;
      }

      dispatch(
        addAccount({
          name: newAccount.name,
          icon: newAccount.icon || "bank",
        }),
      );

      setNewAccount({ name: "", icon: "bank" });
      setIsAddingAccount(false);
    },
    [dispatch, newAccount],
  );

  const handleEditAccount = useCallback(
    (e, id) => {
      e.preventDefault();
      const accountToEdit = accounts.find((acc) => acc.id === id);

      if (!accountToEdit.name.trim()) {
        alert("Please enter an account name");
        return;
      }

      dispatch(
        editAccount({
          id,
          name: accountToEdit.name,
          icon: accountToEdit.icon,
        }),
      );

      setEditingAccountId(null);
    },
    [accounts, dispatch],
  );

  const handleDeleteAccount = useCallback(
    (id) => {
      const account = accounts.find((acc) => acc.id === id);

      if (id === "cash") {
        alert("The Cash account cannot be deleted.");
        return;
      }

      if (
        confirm(
          `Are you sure you want to delete the account "${account.name}"?`,
        )
      ) {
        dispatch(deleteAccount(id));
      }
    },
    [accounts, dispatch],
  );

  const handleInputChange = useCallback(
    (e, id = null) => {
      const { name, value } = e.target;

      if (id) {
        // Editing existing account
        dispatch({
          type: "transactions/accountsUpdated",
          payload: accounts.map((acc) =>
            acc.id === id ? { ...acc, [name]: value } : acc,
          ),
        });
      } else {
        // New account
        setNewAccount((prev) => ({ ...prev, [name]: value }));
      }
    },
    [accounts, dispatch],
  );

  const handleCancelAdd = useCallback(() => {
    setIsAddingAccount(false);
    setNewAccount({ name: "", icon: "bank" });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingAccountId(null);
  }, []);

  // Find the account being edited
  // const accountBeingEdited = useMemo(
  //   () => accounts.find((acc) => acc.id === editingAccountId),
  //   [accounts, editingAccountId],
  // );

  return (
    <div className="rounded-2xl border-b-4 border-primary-500 bg-white/90 p-6 shadow-card backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <div className="mb-6 flex items-center justify-between border-b border-primary-100 pb-3">
        <h3 className="text-xl font-semibold text-primary-700">
          Manage Accounts
        </h3>
        {!isAddingAccount && (
          <button
            className="flex transform items-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => setIsAddingAccount(true)}
          >
            <svg
              className="mr-1 h-4 w-4"
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
            Add Account
          </button>
        )}
      </div>

      {/* Add Account Form */}
      {isAddingAccount && (
        <AddAccountForm
          newAccount={newAccount}
          handleInputChange={handleInputChange}
          handleAddAccount={handleAddAccount}
          onCancel={handleCancelAdd}
        />
      )}

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="group rounded-lg border border-primary-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md"
          >
            {editingAccountId === account.id ? (
              <EditAccountForm
                account={account}
                handleInputChange={handleInputChange}
                handleEditAccount={handleEditAccount}
                onCancel={handleCancelEdit}
              />
            ) : (
              <AccountCard
                account={account}
                onEdit={() => setEditingAccountId(account.id)}
                onDelete={() => handleDeleteAccount(account.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(AccountManager);
