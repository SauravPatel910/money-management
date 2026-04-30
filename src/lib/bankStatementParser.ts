import type {
  Account,
  MoneyTransaction,
  TransactionCategory,
  TransactionInput,
} from "@/types/money";
import {
  buildImportPreviewRows,
  type TransactionImportPreviewRow,
} from "./moneyAnalytics.ts";
import { toAmount } from "./moneyCalculations.ts";

export type StatementEntryType = "debit" | "credit";

export type BankStatementRow = {
  id: string;
  rowNumber: number;
  date: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance?: number;
  type: StatementEntryType;
  amount: number;
  categoryId: string;
  subcategoryId: string;
  include: boolean;
  errors: string[];
};

const amountPattern = /-?\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?|-?\d+(?:\.\d{1,2})?/g;
const datePattern =
  /(\d{1,2})[-/.\s](\d{1,2}|[A-Za-z]{3,})[-/.\s](\d{2,4})|(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/;
const monthMap: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

const normalizeAmount = (value: string) =>
  toAmount(value.replace(/[,\s]/g, "").replace(/^\+/, ""));

const normalizeDate = (raw: string) => {
  const match = raw.match(datePattern);
  if (!match) return "";

  if (match[4] && match[5] && match[6]) {
    return `${match[4]}-${match[5].padStart(2, "0")}-${match[6].padStart(2, "0")}`;
  }

  const day = match[1].padStart(2, "0");
  const monthSource = match[2].toLowerCase().slice(0, 3);
  const month = monthMap[monthSource] || match[2].padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];

  return `${year}-${month}-${day}`;
};

const isLikelyHeader = (line: string) =>
  /date|particular|description|narration|withdrawal|deposit|debit|credit|balance/i.test(
    line,
  ) && !datePattern.test(line);

const stripDate = (line: string) => line.replace(datePattern, "").trim();

const getLineAmounts = (line: string) =>
  [...line.matchAll(amountPattern)]
    .map((match) => ({
      raw: match[0],
      amount: normalizeAmount(match[0]),
      index: match.index ?? 0,
    }))
    .filter((item) => item.amount > 0);

const inferDebitCredit = (line: string, amounts: Array<{ amount: number }>) => {
  const lowerLine = line.toLowerCase();
  const hasCredit = /\b(cr|credit|deposit|received|upi\/cr)\b/.test(lowerLine);
  const hasDebit = /\b(dr|debit|withdrawal|paid|payment|pos|atm|upi\/dr)\b/.test(
    lowerLine,
  );

  if (amounts.length >= 3) {
    return {
      debitAmount: amounts.at(-3)?.amount || 0,
      creditAmount: amounts.at(-2)?.amount || 0,
      balance: amounts.at(-1)?.amount || 0,
    };
  }

  if (amounts.length >= 2) {
    const transactionAmount = amounts.at(-2)?.amount || 0;
    return {
      debitAmount: hasCredit && !hasDebit ? 0 : transactionAmount,
      creditAmount: hasCredit && !hasDebit ? transactionAmount : 0,
      balance: amounts.at(-1)?.amount || 0,
    };
  }

  const amount = amounts[0]?.amount || 0;
  return {
    debitAmount: hasCredit && !hasDebit ? 0 : amount,
    creditAmount: hasCredit && !hasDebit ? amount : 0,
    balance: undefined,
  };
};

export const parseBankStatementText = (text: string): BankStatementRow[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && !isLikelyHeader(line))
    .flatMap((line, index) => {
      const date = normalizeDate(line);
      const lineWithoutDate = stripDate(line);
      const amounts = getLineAmounts(lineWithoutDate);
      if (!date || amounts.length === 0) {
        return [];
      }

      const { debitAmount, creditAmount, balance } = inferDebitCredit(line, amounts);
      const amount = creditAmount > 0 ? creditAmount : debitAmount;
      const type: StatementEntryType = creditAmount > 0 ? "credit" : "debit";
      const amountStart = amounts[0]?.index ?? lineWithoutDate.length;
      const description =
        lineWithoutDate.slice(0, amountStart).trim() || "Bank transaction";
      const errors: string[] = [];

      if (!amount) errors.push("Amount is missing");
      if (!date) errors.push("Date is missing");

      return [
        {
          id: `statement-row-${index + 1}`,
          rowNumber: index + 1,
          date,
          description,
          debitAmount,
          creditAmount,
          balance,
          type,
          amount,
          categoryId: "",
          subcategoryId: "",
          include: errors.length === 0,
          errors,
        },
      ];
    });

export const buildStatementPreviewRows = ({
  rows,
  accountId,
  accounts,
  categories,
  existingTransactions,
}: {
  rows: BankStatementRow[];
  accountId: string;
  accounts: Account[];
  categories: TransactionCategory[];
  existingTransactions: MoneyTransaction[];
}): TransactionImportPreviewRow[] => {
  const importRows = rows
    .filter((row) => row.include)
    .map((row) => ({
      type: row.type === "credit" ? "income" : "expense",
      amount: row.amount,
      transactionDate: row.date,
      transactionTime: "00:00",
      account: accountId,
      category: row.categoryId,
      subcategory: row.subcategoryId,
      note: row.description,
    }));

  return buildImportPreviewRows({
    rows: importRows,
    accounts,
    categories,
    existingTransactions,
  });
};

export const statementRowToTransactionInput = ({
  row,
  accountId,
}: {
  row: BankStatementRow;
  accountId: string;
}): TransactionInput => ({
  type: row.type === "credit" ? "income" : "expense",
  amount: row.amount,
  account: accountId,
  note: row.description,
  categoryId: row.categoryId,
  subcategoryId: row.subcategoryId,
  transactionDate: row.date,
  transactionTime: "00:00",
  entryDate: row.date,
  entryTime: "00:00",
});
