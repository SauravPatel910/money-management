"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { importTransactionsThunk } from "../store/transactionsSlice";
import BudgetSummary from "../components/budgets/BudgetSummary";
import BankStatementImport from "../components/transactions/BankStatementImport";
import FeatureDisabled from "../components/common/FeatureDisabled";
import FeatureGate from "../components/common/FeatureGate";
import { getNavigationLinks } from "../components/common/getNavigationLinks";
import Failed from "../components/UI/Failed";
import Loading from "../components/UI/Loading";
import PageLayout from "../components/UI/PageLayout";
import DatePicker from "../components/forms/DatePicker";
import Select from "../components/forms/Select";
import { useAppData } from "../hooks/useAppData";
import {
  buildCategoryBreakdown,
  buildImportPreviewRows,
  buildImportTemplateCsv,
  buildMonthlyCashflow,
  buildReportSummary,
  filterTransactionsForReport,
  reportSummaryToCsv,
  transactionsToCsv,
} from "../lib/moneyAnalytics";
import { getCurrentBudgetMonth } from "../lib/budgetAnalytics";
import { summarizeRecurringBills } from "../lib/recurringBills";
import {
  exportSummaryWorkbook,
  exportTransactionsWorkbook,
} from "../lib/reportExportFile";
import type {
  ReportFilters,
  TransactionImportPreviewRow,
} from "../lib/moneyAnalytics";
import { parseTransactionImportFile } from "../lib/transactionImportFile";
import type { TransactionType } from "../types/money";
import { formatCurrency } from "../utils/formatters";

type ExportFormat = "xlsx" | "csv";

const transactionTypes: Array<TransactionType | "all"> = [
  "all",
  "income",
  "expense",
  "transfer",
  "person",
];

const downloadTextFile = (fileName: string, content: string, type = "text/csv") => {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const {
    transactions,
    accounts,
    categories,
    budgets,
    recurringBills,
    dispatch,
    transactionsStatus,
    transactionsError,
    accountsStatus,
    accountsError,
    categoriesStatus,
    categoriesError,
    budgetsStatus,
    budgetsError,
    recurringBillsStatus,
    recurringBillsError,
  } = useAppData();
  const [filters, setFilters] = useState<ReportFilters>({ type: "all" });
  const [previewRows, setPreviewRows] = useState<TransactionImportPreviewRow[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");

  const filteredTransactions = useMemo(
    () => filterTransactionsForReport(transactions, filters),
    [filters, transactions],
  );
  const summary = useMemo(
    () => buildReportSummary(filteredTransactions, accounts),
    [accounts, filteredTransactions],
  );
  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(filteredTransactions),
    [filteredTransactions],
  );
  const monthlyCashflow = useMemo(
    () => buildMonthlyCashflow(filteredTransactions),
    [filteredTransactions],
  );
  const categoryOptions = useMemo(
    () =>
      categories
        .filter(
          (category) =>
            !category.parentId &&
            (!filters.type || filters.type === "all" || category.type === filters.type),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, filters.type],
  );
  const subcategoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === filters.categoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, filters.categoryId],
  );
  const importCounts = useMemo(
    () => ({
      valid: previewRows.filter((row) => row.status === "valid").length,
      duplicate: previewRows.filter((row) => row.status === "duplicate").length,
      error: previewRows.filter((row) => row.status === "error").length,
      included: previewRows.filter((row) => row.include && row.transaction).length,
    }),
    [previewRows],
  );
  const billSummary = useMemo(
    () => summarizeRecurringBills(recurringBills),
    [recurringBills],
  );

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
      ...(key === "type" && { categoryId: undefined, subcategoryId: undefined }),
      ...(key === "categoryId" && { subcategoryId: undefined }),
    }));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportMessage(null);
    try {
      const rows = await parseTransactionImportFile(file);
      setPreviewRows(
        buildImportPreviewRows({
          rows,
          accounts,
          categories,
          existingTransactions: transactions,
        }),
      );
      if (rows.length === 0) {
        setImportMessage("No rows were found in the uploaded file.");
      }
    } catch (error) {
      setPreviewRows([]);
      setImportMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      event.target.value = "";
    }
  };

  const togglePreviewRow = (rowNumber: number) => {
    setPreviewRows((rows) =>
      rows.map((row) =>
        row.rowNumber === rowNumber && row.transaction
          ? { ...row, include: !row.include }
          : row,
      ),
    );
  };

  const handleImport = async () => {
    const acceptedTransactions = previewRows
      .filter((row) => row.include && row.transaction)
      .map((row) => row.transaction!);

    if (acceptedTransactions.length === 0) {
      setImportMessage("Select at least one valid row to import.");
      return;
    }

    setIsImporting(true);
    setImportMessage(null);
    try {
      await dispatch(importTransactionsThunk(acceptedTransactions)).unwrap();
      setPreviewRows([]);
      setImportMessage(`${acceptedTransactions.length} transactions imported.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTransactionsReport = () => {
    if (exportFormat === "xlsx") {
      exportTransactionsWorkbook(
        "transactions-report.xlsx",
        filteredTransactions,
        accounts,
      );
      return;
    }

    downloadTextFile(
      "transactions-report.csv",
      transactionsToCsv(filteredTransactions, accounts),
    );
  };

  const downloadSummaryReport = () => {
    if (exportFormat === "xlsx") {
      exportSummaryWorkbook(
        "summary-report.xlsx",
        summary,
        categoryBreakdown,
        monthlyCashflow,
      );
      return;
    }

    downloadTextFile(
      "summary-report.csv",
      reportSummaryToCsv(summary, categoryBreakdown, monthlyCashflow),
    );
  };

  if (
    transactionsStatus === "idle" ||
    accountsStatus === "idle" ||
    categoriesStatus === "idle" ||
    budgetsStatus === "idle" ||
    recurringBillsStatus === "idle" ||
    transactionsStatus === "loading" ||
    accountsStatus === "loading" ||
    categoriesStatus === "loading" ||
    budgetsStatus === "loading" ||
    recurringBillsStatus === "loading"
  ) {
    return <Loading text="Loading reports..." />;
  }

  if (
    transactionsStatus === "failed" ||
    accountsStatus === "failed" ||
    categoriesStatus === "failed" ||
    budgetsStatus === "failed" ||
    recurringBillsStatus === "failed"
  ) {
    return (
      <Failed
        error={
          transactionsError ||
          accountsError ||
          categoriesError ||
          budgetsError ||
          recurringBillsError
        }
        text="Failed to load reports. Please try again later."
      />
    );
  }

  return (
    <FeatureGate feature="reports" fallback={<FeatureDisabled title="Reports disabled" />}>
    <PageLayout
      title="Reports"
      headerLinks={getNavigationLinks("reports")}
      loadingText="Loading reports..."
    >
      <div className="space-y-8">
        <section className="rounded-[25px] bg-white p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-[22px] font-semibold text-[#343c6a]">
              Report Filters
            </h3>
            <FeatureGate feature="exports">
            <div className="flex flex-wrap items-end gap-2">
              <Select
                label="File type"
                name="exportFormat"
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as ExportFormat)}
                options={[
                  { value: "xlsx", label: "Excel (.xlsx)" },
                  { value: "csv", label: "CSV (.csv)" },
                ]}
                buttonClassName="h-[44px] px-4 text-sm"
                containerClassName="min-w-[150px]"
              />
              <button
                type="button"
                className="h-[44px] rounded-[15px] bg-[#1814f3] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff]"
                onClick={downloadTransactionsReport}
              >
                Download Transactions
              </button>
              <button
                type="button"
                className="h-[44px] rounded-[15px] border border-[#dfeaf2] bg-white px-4 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
                onClick={downloadSummaryReport}
              >
                Download Summary
              </button>
            </div>
            </FeatureGate>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FilterInput
              label="From"
              type="date"
              value={filters.dateFrom || ""}
              onChange={(value) => updateFilter("dateFrom", value)}
            />
            <FilterInput
              label="To"
              type="date"
              value={filters.dateTo || ""}
              onChange={(value) => updateFilter("dateTo", value)}
            />
            <Select
              label="Type"
              name="type"
              value={filters.type || "all"}
              onValueChange={(value) => updateFilter("type", value)}
              buttonClassName="h-[44px] px-4 text-sm"
              options={transactionTypes.map((type) => ({
                value: type,
                label: type === "all" ? "All types" : type,
              }))}
            />
            <Select
              label="Account"
              name="accountId"
              value={filters.accountId || ""}
              onValueChange={(value) => updateFilter("accountId", value)}
              buttonClassName="h-[44px] px-4 text-sm"
              options={[
                { value: "", label: "All accounts" },
                ...accounts.map((account) => ({
                  value: account.id,
                  label: account.name,
                })),
              ]}
            />
            <Select
              label="Category"
              name="categoryId"
              value={filters.categoryId || ""}
              onValueChange={(value) => updateFilter("categoryId", value)}
              buttonClassName="h-[44px] px-4 text-sm"
              options={[
                { value: "", label: "All categories" },
                ...categoryOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
            <Select
              label="Subcategory"
              name="subcategoryId"
              value={filters.subcategoryId || ""}
              onValueChange={(value) => updateFilter("subcategoryId", value)}
              buttonClassName="h-[44px] px-4 text-sm"
              options={[
                { value: "", label: "All subcategories" },
                ...subcategoryOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <Metric title="Income" value={formatCurrency(summary.totalIncome)} />
          <Metric title="Expense" value={formatCurrency(summary.totalExpense)} />
          <Metric title="Net" value={formatCurrency(summary.netCashflow)} />
          <Metric title="Current Balance" value={formatCurrency(summary.totalBalance)} />
          <Metric title="Rows" value={String(summary.transactionCount)} />
        </section>

        <FeatureGate feature="budgets">
          <BudgetSummary
            budgets={budgets}
            transactions={transactions}
            month={filters.dateFrom?.slice(0, 7) || getCurrentBudgetMonth()}
          />
        </FeatureGate>

        <FeatureGate feature="recurringBills">
          <section className="grid gap-4 md:grid-cols-4">
            <Metric title="Bills" value={String(billSummary.total)} />
            <Metric title="Due Today" value={String(billSummary.dueToday)} />
            <Metric title="Overdue Bills" value={String(billSummary.overdue)} />
            <Metric
              title="Overdue Amount"
              value={formatCurrency(billSummary.overdueAmount)}
            />
          </section>
        </FeatureGate>

        <FeatureGate feature="bankStatementOcr">
          <BankStatementImport
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            dispatch={dispatch}
          />
        </FeatureGate>

        <section className="grid gap-6 lg:grid-cols-2">
          <ReportTable
            title="Top Categories"
            emptyText="No category activity for these filters."
            headers={["Category", "Income", "Expense", "Net"]}
            rows={categoryBreakdown.slice(0, 8).map((item) => [
              item.categoryName,
              formatCurrency(item.income),
              formatCurrency(item.expense),
              formatCurrency(item.income - item.expense),
            ])}
          />
          <ReportTable
            title="Monthly Cashflow"
            emptyText="No monthly activity for these filters."
            headers={["Month", "Income", "Expense", "Net"]}
            rows={monthlyCashflow.map((item) => [
              item.month,
              formatCurrency(item.income),
              formatCurrency(item.expense),
              formatCurrency(item.net),
            ])}
          />
        </section>

        <FeatureGate feature="spreadsheetImport">
        <section className="rounded-[25px] bg-white p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[22px] font-semibold text-[#343c6a]">
                Import Transactions
              </h3>
              <p className="mt-1 text-sm text-[#718ebf]">
                Upload CSV, XLSX, or XLS files using existing account and category names.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-[#dfeaf2] bg-white px-4 py-2 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
              onClick={() =>
                downloadTextFile("transaction-import-template.csv", buildImportTemplateCsv())
              }
            >
              Download Template
            </button>
          </div>

          <label className="block rounded-[18px] border border-dashed border-[#dfeaf2] bg-[#f5f7fa] p-5 text-sm font-medium text-[#343c6a]">
            Upload file
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="mt-3 block w-full text-sm text-[#718ebf] file:mr-4 file:rounded-full file:border-0 file:bg-[#1814f3] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              onChange={handleFileChange}
            />
          </label>

          {importMessage && (
            <div className="mt-4 rounded-[15px] border border-[#dfeaf2] bg-[#f5f7fa] px-4 py-3 text-sm font-medium text-[#343c6a]">
              {importMessage}
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-gray-600">
                  {importCounts.included} selected, {importCounts.valid} valid,{" "}
                  {importCounts.duplicate} duplicates, {importCounts.error} errors
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#1814f3] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isImporting || importCounts.included === 0}
                  onClick={handleImport}
                >
                  {isImporting ? "Importing..." : "Import Selected"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-[18px] border border-[#e6eff5]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#f5f7fa] text-left text-xs text-[#718ebf]">
                    <tr>
                      <th className="px-3 py-2">Import</th>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Issue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f4f7]">
                    {previewRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={row.include}
                            disabled={!row.transaction}
                            onChange={() => togglePreviewRow(row.rowNumber)}
                          />
                        </td>
                        <td className="px-3 py-2">{row.rowNumber}</td>
                        <td className="px-3 py-2 capitalize">{row.status}</td>
                        <td className="px-3 py-2">{row.transaction?.type || "-"}</td>
                        <td className="px-3 py-2">
                          {row.transaction?.transactionDate || "-"}
                        </td>
                        <td className="px-3 py-2">
                          {row.transaction
                            ? formatCurrency(Number(row.transaction.amount))
                            : "-"}
                        </td>
                        <td className="max-w-md px-3 py-2 text-[#718ebf]">
                          {row.errors.join(", ") ||
                            (row.status === "duplicate"
                              ? "Looks like an existing transaction"
                              : "-")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        </FeatureGate>
      </div>
    </PageLayout>
    </FeatureGate>
  );
}

const FilterInput = ({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  type === "date" ? (
    <DatePicker
      label={label}
      name={`report-${label.toLowerCase()}`}
      value={value}
      onValueChange={onChange}
      buttonClassName="h-[44px] px-4 text-sm"
    />
  ) : (
    <label className="text-sm font-medium text-[#343c6a]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-[44px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-4 text-sm text-[#343c6a] outline-none focus:border-[#2d60ff]"
      />
    </label>
  )
);

const Metric = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-[25px] bg-white p-5">
    <div className="text-sm font-medium text-[#718ebf]">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-[#343c6a]">{value}</div>
  </div>
);

const ReportTable = ({
  title,
  emptyText,
  headers,
  rows,
}: {
  title: string;
  emptyText: string;
  headers: string[];
  rows: string[][];
}) => (
  <div className="rounded-[25px] bg-white p-6">
    <h3 className="mb-4 text-[22px] font-semibold text-[#343c6a]">{title}</h3>
    {rows.length === 0 ? (
      <p className="text-sm text-[#718ebf]">{emptyText}</p>
    ) : (
      <div className="overflow-x-auto rounded-[18px] border border-[#e6eff5]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f5f7fa] text-left text-xs text-[#718ebf]">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f4f7]">
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
