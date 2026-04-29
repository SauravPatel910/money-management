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
  categoryId?: string | null;
  subcategoryId?: string | null;
  category?: TransactionCategorySummary | null;
  subcategory?: TransactionCategorySummary | null;
  transactionDate: string;
  transactionTime?: string;
  entryDate: string;
  entryTime?: string;
  accountBalances?: Record<string, number> | null;
  totalBalance?: number;
};

export type TransactionEditChangedField = {
  field: string;
  before: string | number | null;
  after: string | number | null;
};

export type TransactionEditSnapshot = TransactionInput;

export type TransactionEditHistory = {
  id: string;
  transactionId: string;
  editedAt: string;
  before: TransactionEditSnapshot;
  after: TransactionEditSnapshot;
  changedFields: TransactionEditChangedField[];
};

export type TransactionInput = Omit<
  MoneyTransaction,
  "id" | "accountBalances" | "totalBalance" | "category" | "subcategory"
>;

export type AccountInput = {
  id?: string;
  name: string;
  owner?: string | null;
  icon?: string;
};

export type Summary = {
  totalIncome: number;
  totalExpense: number;
};

export type TransactionCategory = {
  id: string;
  type: TransactionType;
  name: string;
  parentId?: string | null;
  isSystem: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TransactionCategorySummary = Pick<
  TransactionCategory,
  "id" | "type" | "name" | "parentId" | "isSystem"
>;

export type TransactionCategoryInput = {
  type: TransactionType;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
};

export type TransactionFormFieldName =
  | "type"
  | "amount"
  | "account"
  | "from"
  | "to"
  | "direction"
  | "person"
  | "note"
  | "categoryId"
  | "subcategoryId"
  | "transactionDate"
  | "transactionTime"
  | "entryDate"
  | "entryTime";

export type TransactionFormState = {
  type: TransactionType;
  amount: string | number;
  account?: string;
  from?: string;
  to?: string;
  direction?: PersonDirection;
  person?: string;
  note: string;
  categoryId?: string;
  subcategoryId?: string;
  transactionDate: string;
  transactionTime: string;
  entryDate: string;
  entryTime: string;
};

export type NewTransactionFormState = Omit<TransactionFormState, "amount"> & {
  amount: string;
};

export type EditTransactionFormState = TransactionFormState;

export type AccountFormState = {
  name: string;
  owner?: string | null;
  icon: string;
};
