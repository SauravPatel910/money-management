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
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-primary-700">
              Report Filters
            </h3>
            <FeatureGate feature="exports">
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm font-medium text-primary-700">
                File type
                <select
                  value={exportFormat}
                  onChange={(event) =>
                    setExportFormat(event.target.value as ExportFormat)
                  }
                  className="mt-1 block rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </label>
              <button
                type="button"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
                onClick={downloadTransactionsReport}
              >
                Download Transactions
              </button>
              <button
                type="button"
                className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm"
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
            <FilterSelect
              label="Type"
              value={filters.type || "all"}
              onChange={(value) => updateFilter("type", value)}
              options={transactionTypes.map((type) => ({
                value: type,
                label: type === "all" ? "All types" : type,
              }))}
            />
            <FilterSelect
              label="Account"
              value={filters.accountId || ""}
              onChange={(value) => updateFilter("accountId", value)}
              options={[
                { value: "", label: "All accounts" },
                ...accounts.map((account) => ({
                  value: account.id,
                  label: account.name,
                })),
              ]}
            />
            <FilterSelect
              label="Category"
              value={filters.categoryId || ""}
              onChange={(value) => updateFilter("categoryId", value)}
              options={[
                { value: "", label: "All categories" },
                ...categoryOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
            <FilterSelect
              label="Subcategory"
              value={filters.subcategoryId || ""}
              onChange={(value) => updateFilter("subcategoryId", value)}
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
        <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-primary-700">
                Import Transactions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload CSV, XLSX, or XLS files using existing account and category names.
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm"
              onClick={() =>
                downloadTextFile("transaction-import-template.csv", buildImportTemplateCsv())
              }
            >
              Download Template
            </button>
          </div>

          <label className="block rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-5 text-sm font-medium text-primary-700">
            Upload file
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="mt-3 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              onChange={handleFileChange}
            />
          </label>

          {importMessage && (
            <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
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
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isImporting || importCounts.included === 0}
                  onClick={handleImport}
                >
                  {isImporting ? "Importing..." : "Import Selected"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-primary-100">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-primary-50 text-left text-xs uppercase text-primary-700">
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
                  <tbody className="divide-y divide-primary-100">
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
                        <td className="max-w-md px-3 py-2 text-gray-600">
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
  <label className="text-sm font-medium text-primary-700">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
    />
  </label>
);

const FilterSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) => (
  <label className="text-sm font-medium text-primary-700">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-primary-300 px-3 py-2 text-sm capitalize shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option.value || "all"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const Metric = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl border border-primary-100 bg-white/90 p-5 shadow-card">
    <div className="text-sm font-medium text-gray-500">{title}</div>
    <div className="mt-2 text-2xl font-bold text-primary-700">{value}</div>
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
  <div className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
    <h3 className="mb-4 text-xl font-semibold text-primary-700">{title}</h3>
    {rows.length === 0 ? (
      <p className="text-sm text-gray-500">{emptyText}</p>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-primary-100">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-primary-50 text-left text-xs uppercase text-primary-700">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
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
