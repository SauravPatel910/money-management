export type TransactionType = "income" | "expense" | "transfer" | "person";
export type PersonDirection = "to" | "from";

export type Account = {
  id: string;
  name: string;
  owner?: string | null;
  balance: number;
  icon: string;
};

export type MoneyTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  account?: string | null;
  from?: string | null;
  to?: string | null;
  direction?: PersonDirection | null;
  person?: string | null;
  note?: string | null;
  transactionDate: string;
  entryDate: string;
  accountBalances?: Record<string, number> | null;
  totalBalance?: number;
};

export type TransactionInput = Omit<
  MoneyTransaction,
  "id" | "accountBalances" | "totalBalance"
>;

export type AccountInput = {
  id?: string;
  name: string;
  owner?: string | null;
  icon?: string;
};
