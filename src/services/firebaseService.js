import {
  get,
  set,
  push,
  update,
  remove,
  onValue,
  child,
  query,
  orderByChild,
} from "firebase/database";
import { transactionsRef, accountsRef } from "../config/firebase";

// Default accounts if none exist
const DEFAULT_ACCOUNTS = [
  { id: "cash", name: "Cash", balance: 0, icon: "cash" },
  { id: "bank", name: "Primary Bank", balance: 0, icon: "bank" },
];

// Calculate summary based on transactions
export const calculateSummary = (transactions = []) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  return { totalIncome, totalExpense };
};

// Helper function to recalculate balances for all transactions and accounts
export const recalculateBalances = (transactions = [], accounts = []) => {
  // Reset account balances to zero
  const accountBalances = accounts.reduce((acc, account) => {
    acc[account.id] = 0;
    return acc;
  }, {});

  // Sort transactions by date before processing
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
  );

  // Process all transactions to recalculate account balances
  const processedTransactions = sortedTransactions.map((transaction) => {
    if (transaction.type === "income") {
      // Regular income
      const accountId = transaction.account || "cash";
      accountBalances[accountId] =
        (accountBalances[accountId] || 0) + transaction.amount;
    } else if (transaction.type === "expense") {
      // Regular expense
      const accountId = transaction.account || "cash";
      accountBalances[accountId] =
        (accountBalances[accountId] || 0) - transaction.amount;
    } else if (transaction.type === "transfer") {
      // Transfer between accounts
      const fromAccountId = transaction.from || "cash";
      const toAccountId = transaction.to || "bank";
      accountBalances[fromAccountId] =
        (accountBalances[fromAccountId] || 0) - transaction.amount;
      accountBalances[toAccountId] =
        (accountBalances[toAccountId] || 0) + transaction.amount;
    } else if (transaction.type === "person") {
      // Person-to-person transaction
      const accountId = transaction.account || "cash";
      if (transaction.direction === "to") {
        // Giving money to someone
        accountBalances[accountId] =
          (accountBalances[accountId] || 0) - transaction.amount;
      } else if (transaction.direction === "from") {
        // Receiving money from someone
        accountBalances[accountId] =
          (accountBalances[accountId] || 0) + transaction.amount;
      }
    }

    // Calculate total balance across all accounts
    const totalBalance = Object.values(accountBalances).reduce(
      (sum, balance) => sum + balance,
      0,
    );

    return {
      ...transaction,
      accountBalances: { ...accountBalances }, // Store a snapshot of all account balances at this point
      totalBalance: totalBalance,
    };
  });

  return {
    processedTransactions,
    accountBalances,
  };
};

// Transaction Services
export const fetchTransactions = async () => {
  try {
    const snapshot = await get(transactionsRef);
    if (snapshot.exists()) {
      const transactionsObj = snapshot.val();
      // Convert object to array with keys as id
      return Object.entries(transactionsObj).map(([id, data]) => ({
        id,
        ...data,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const listenToTransactions = (callback) => {
  const q = query(transactionsRef, orderByChild("transactionDate"));
  return onValue(q, (snapshot) => {
    if (snapshot.exists()) {
      const transactionsObj = snapshot.val();
      // Convert object to array with keys as id
      const transactions = Object.entries(transactionsObj).map(
        ([id, data]) => ({
          id,
          ...data,
        }),
      );
      callback(transactions);
    } else {
      callback([]);
    }
  });
};

export const addTransactionToFirebase = async (transaction) => {
  try {
    // Get current transactions and accounts to calculate historical balances
    const currentTransactions = await fetchTransactions();
    const accounts = await fetchAccounts();

    // Make sure the new transaction has all required fields
    const transactionWithDefaults = {
      ...transaction,
      account: transaction.account || "cash",
      entryDate: transaction.entryDate || new Date().toISOString(), // Default to today if not provided
    };

    // Temporarily add the new transaction to calculate correct balances
    const newTransactionsSet = [
      ...currentTransactions,
      transactionWithDefaults,
    ];

    // Recalculate all balances including the new transaction
    const { processedTransactions } = recalculateBalances(
      newTransactionsSet,
      accounts,
    );

    // Find our transaction in the processed list to get the correct balances
    const matchTransaction = (t) =>
      t.type === transaction.type &&
      t.amount === transaction.amount &&
      t.transactionDate === transaction.transactionDate &&
      (t.note === transaction.note || (!t.note && !transaction.note));

    const correctTransaction = processedTransactions.find(matchTransaction);

    if (!correctTransaction) {
      throw new Error("Failed to process transaction correctly");
    }

    // Create the transaction with the correct account balance snapshot
    const transactionWithBalances = {
      ...transactionWithDefaults,
      accountBalances: { ...correctTransaction.accountBalances },
      totalBalance: correctTransaction.totalBalance,
    };

    // Save to Firebase
    const newTransactionRef = push(transactionsRef);
    await set(newTransactionRef, transactionWithBalances);

    return { id: newTransactionRef.key, ...transactionWithBalances };
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};

export const updateTransactionInFirebase = async (id, transaction) => {
  try {
    await update(child(transactionsRef, id), transaction);
    return { id, ...transaction };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransactionFromFirebase = async (id) => {
  try {
    await remove(child(transactionsRef, id));
    return id;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

// Account Services
export const fetchAccounts = async () => {
  try {
    const snapshot = await get(accountsRef);
    if (snapshot.exists()) {
      const accountsObj = snapshot.val();
      // Convert object to array with keys as id
      return Object.entries(accountsObj).map(([id, data]) => ({
        id,
        ...data,
      }));
    }
    // Initialize with default accounts if no accounts exist
    await initializeDefaultAccounts();
    return DEFAULT_ACCOUNTS;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const listenToAccounts = (callback) => {
  return onValue(accountsRef, async (snapshot) => {
    if (snapshot.exists()) {
      const accountsObj = snapshot.val();
      // Convert object to array with keys as id
      const accounts = Object.entries(accountsObj).map(([id, data]) => ({
        id,
        ...data,
      }));
      callback(accounts);
    } else {
      // Initialize with default accounts if no accounts exist
      await initializeDefaultAccounts();
      callback(DEFAULT_ACCOUNTS);
    }
  });
};

export const initializeDefaultAccounts = async () => {
  try {
    // Use an object to store accounts by their id
    const accountsObj = DEFAULT_ACCOUNTS.reduce((acc, account) => {
      acc[account.id] = {
        name: account.name,
        balance: account.balance,
        icon: account.icon,
      };
      return acc;
    }, {});

    await set(accountsRef, accountsObj);
    return DEFAULT_ACCOUNTS;
  } catch (error) {
    console.error("Error initializing default accounts:", error);
    throw error;
  }
};

export const addAccountToFirebase = async (account) => {
  try {
    const id = account.id || Date.now().toString();
    const newAccount = {
      ...account,
      balance: 0, // Always initialize with zero balance
    };

    await set(child(accountsRef, id), newAccount);
    return { id, ...newAccount };
  } catch (error) {
    console.error("Error adding account:", error);
    throw error;
  }
};

export const updateAccountInFirebase = async (id, updates) => {
  try {
    await update(child(accountsRef, id), updates);
    return { id, ...updates };
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
};

export const deleteAccountFromFirebase = async (id) => {
  try {
    await remove(child(accountsRef, id));
    return id;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

// Update account balances based on transactions
export const updateAccountBalances = async (accounts, accountBalances) => {
  try {
    const updates = {};

    accounts.forEach((account) => {
      updates[`${account.id}/balance`] = accountBalances[account.id] || 0;
    });

    await update(accountsRef, updates);

    // Create a new array of accounts with updated balances
    return accounts.map((account) => ({
      ...account,
      balance: accountBalances[account.id] || 0,
    }));
  } catch (error) {
    console.error("Error updating account balances:", error);
    throw error;
  }
};
