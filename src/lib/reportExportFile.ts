import * as XLSX from "xlsx";
import type {
  Account,
  MoneyTransaction,
} from "@/types/money";
import type {
  CategoryBreakdownItem,
  MonthlyCashflowItem,
  ReportSummary,
} from "./moneyAnalytics";

const toWorkbookSafeSheetName = (name: string) =>
  name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Sheet";

const downloadWorkbook = (
  fileName: string,
  sheets: Array<{
    name: string;
    rows: Array<Record<string, string | number>>;
  }>,
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      toWorkbookSafeSheetName(sheet.name),
    );
  });

  XLSX.writeFile(workbook, fileName);
};

export const exportTransactionsWorkbook = (
  fileName: string,
  transactions: MoneyTransaction[],
  accounts: Account[],
) => {
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));

  downloadWorkbook(fileName, [
    {
      name: "Transactions",
      rows: transactions.map((transaction) => ({
        "Transaction Date": transaction.transactionDate,
        "Transaction Time": transaction.transactionTime || "",
        "Entry Date": transaction.entryDate,
        "Entry Time": transaction.entryTime || "",
        Type: transaction.type,
        Amount: transaction.amount,
        Account: transaction.account
          ? accountNames.get(transaction.account) || transaction.account
          : "",
        From: transaction.from
          ? accountNames.get(transaction.from) || transaction.from
          : "",
        To: transaction.to ? accountNames.get(transaction.to) || transaction.to : "",
        Direction: transaction.direction || "",
        Person: transaction.person || "",
        Category: transaction.category?.name || "",
        Subcategory: transaction.subcategory?.name || "",
        Note: transaction.note || "",
        "Total Balance": transaction.totalBalance || 0,
      })),
    },
  ]);
};

export const exportSummaryWorkbook = (
  fileName: string,
  summary: ReportSummary,
  categoryBreakdown: CategoryBreakdownItem[],
  monthlyCashflow: MonthlyCashflowItem[],
) => {
  downloadWorkbook(fileName, [
    {
      name: "Summary",
      rows: [
        { Metric: "Total income", Value: summary.totalIncome },
        { Metric: "Total expense", Value: summary.totalExpense },
        { Metric: "Net cashflow", Value: summary.netCashflow },
        { Metric: "Current balance", Value: summary.totalBalance },
        { Metric: "Transaction count", Value: summary.transactionCount },
      ],
    },
    {
      name: "Categories",
      rows: categoryBreakdown.map((item) => ({
        Category: item.categoryName,
        Income: item.income,
        Expense: item.expense,
        Net: item.income - item.expense,
      })),
    },
    {
      name: "Monthly Cashflow",
      rows: monthlyCashflow.map((item) => ({
        Month: item.month,
        Income: item.income,
        Expense: item.expense,
        Net: item.net,
      })),
    },
  ]);
};
