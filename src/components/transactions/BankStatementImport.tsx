"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { importTransactionsThunk } from "../../store/transactionsSlice";
import type { AppDispatch } from "../../config/reduxStore";
import {
  buildStatementPreviewRows,
  parseBankStatementText,
  type BankStatementRow,
} from "../../lib/bankStatementParser";
import { extractBankStatementText } from "../../lib/bankStatementOcr";
import type {
  Account,
  MoneyTransaction,
  TransactionCategory,
} from "../../types/money";
import { formatCurrency } from "../../utils/formatters";

type BankStatementImportProps = {
  accounts: Account[];
  categories: TransactionCategory[];
  transactions: MoneyTransaction[];
  dispatch: AppDispatch;
};

const supportedStatementExtensions = ".pdf,.png,.jpg,.jpeg";

export default function BankStatementImport({
  accounts,
  categories,
  transactions,
  dispatch,
}: BankStatementImportProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [rows, setRows] = useState<BankStatementRow[]>([]);
  const [rawText, setRawText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkSubcategoryId, setBulkSubcategoryId] = useState("");

  const expenseCategories = useMemo(
    () =>
      categories
        .filter((category) => category.type === "expense" && !category.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  );
  const incomeCategories = useMemo(
    () =>
      categories
        .filter((category) => category.type === "income" && !category.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories],
  );
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const bulkSubcategoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.parentId === bulkCategoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [bulkCategoryId, categories],
  );
  const previewRows = useMemo(
    () =>
      accountId
        ? buildStatementPreviewRows({
            rows: rows.map((row) => ({
              ...row,
              errors: row.categoryId ? row.errors : [...row.errors, "Category is required"],
            })),
            accountId,
            accounts,
            categories,
            existingTransactions: transactions,
          })
        : [],
    [accountId, accounts, categories, rows, transactions],
  );
  const selectedPreviewRows = previewRows.filter(
    (row) => row.include && row.transaction,
  );

  const setRow = (id: string, updates: Partial<BankStatementRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              ...updates,
              errors: updates.categoryId || row.categoryId ? [] : row.errors,
            }
          : row,
      ),
    );
  };

  const applyBulkCategory = () => {
    if (!bulkCategoryId) {
      setMessage("Choose a category before applying bulk changes.");
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.include
          ? {
              ...row,
              categoryId: bulkCategoryId,
              subcategoryId: bulkSubcategoryId,
              errors: [],
            }
          : row,
      ),
    );
    setMessage("Category applied to selected statement rows.");
  };

  const parseTextToRows = (text: string) => {
    const parsedRows = parseBankStatementText(text);
    setRows(parsedRows);
    setMessage(
      parsedRows.length > 0
        ? `${parsedRows.length} statement rows detected. Choose categories before importing.`
        : "No statement rows were detected.",
    );
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setMessage(null);
    setOcrStatus("Preparing OCR...");
    setOcrProgress(0);
    try {
      const text = await extractBankStatementText(file, (progress) => {
        setOcrStatus(progress.status);
        setOcrProgress(progress.progress);
      });
      setRawText(text);
      parseTextToRows(text);
    } catch (error) {
      setRows([]);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not extract statement text.",
      );
    } finally {
      setIsExtracting(false);
      event.target.value = "";
    }
  };

  const handleImport = async () => {
    if (!accountId) {
      setMessage("Choose the account this statement belongs to.");
      return;
    }

    const transactionsToImport = selectedPreviewRows.map((row) => row.transaction!);
    if (transactionsToImport.length === 0) {
      setMessage("Select at least one valid statement row to import.");
      return;
    }

    setIsImporting(true);
    setMessage(null);
    try {
      await dispatch(importTransactionsThunk(transactionsToImport)).unwrap();
      setRows([]);
      setRawText("");
      setMessage(`${transactionsToImport.length} statement rows imported.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Statement import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-primary-100 bg-white/90 p-6 shadow-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary-700">
            Bank Statement OCR Import
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload PDF or image statements, review OCR rows, choose categories, then import.
          </p>
        </div>
        <label className="text-sm font-medium text-primary-700">
          Statement account
          <select
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="mt-1 block rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-5 text-sm font-medium text-primary-700">
        Upload statement
        <input
          type="file"
          accept={supportedStatementExtensions}
          className="mt-3 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          onChange={handleFileChange}
          disabled={isExtracting}
        />
      </label>

      {isExtracting && (
        <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
          <div className="mb-2 flex justify-between text-sm font-medium text-primary-700">
            <span>{ocrStatus || "Reading statement..."}</span>
            <span>{Math.round(ocrProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-primary-100">
            <div
              className="h-full bg-primary-600"
              style={{ width: `${Math.min(ocrProgress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
          {message}
        </div>
      )}

      {rawText && (
        <details className="mt-4 rounded-xl border border-primary-100 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-primary-700">
            OCR text
          </summary>
          <textarea
            value={rawText}
            onChange={(event) => {
              setRawText(event.target.value);
              parseTextToRows(event.target.value);
            }}
            className="mt-3 h-40 w-full rounded-lg border border-primary-200 p-3 text-xs text-gray-700"
          />
        </details>
      )}

      {rows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-primary-100 bg-primary-50/40 p-4 md:flex-row md:items-end">
            <CategorySelect
              label="Bulk category"
              value={bulkCategoryId}
              onChange={(value) => {
                setBulkCategoryId(value);
                setBulkSubcategoryId("");
              }}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
            />
            <label className="text-sm font-medium text-primary-700">
              Bulk subcategory
              <select
                value={bulkSubcategoryId}
                onChange={(event) => setBulkSubcategoryId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
              >
                <option value="">No subcategory</option>
                {bulkSubcategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
              onClick={applyBulkCategory}
            >
              Apply to Selected
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-primary-100">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-primary-50 text-left text-xs uppercase text-primary-700">
                <tr>
                  <th className="px-3 py-2">Import</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Subcategory</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {rows.map((row) => {
                  const rowCategories =
                    row.type === "credit" ? incomeCategories : expenseCategories;
                  const rowSubcategories = categories.filter(
                    (category) => category.parentId === row.categoryId,
                  );
                  const preview = previewRows.find(
                    (previewRow) =>
                      previewRow.transaction?.transactionDate === row.date &&
                      previewRow.transaction?.note === row.description &&
                      Number(previewRow.transaction?.amount) === row.amount,
                  );

                  return (
                    <tr key={row.id}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={() =>
                            setRow(row.id, { include: !row.include })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(event) =>
                            setRow(row.id, { date: event.target.value })
                          }
                          className="w-36 rounded-lg border border-primary-200 px-2 py-1"
                        />
                      </td>
                      <td className="min-w-64 px-3 py-2">
                        <input
                          value={row.description}
                          onChange={(event) =>
                            setRow(row.id, { description: event.target.value })
                          }
                          className="w-full rounded-lg border border-primary-200 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 capitalize">{row.type}</td>
                      <td className="px-3 py-2">{formatCurrency(row.amount)}</td>
                      <td className="px-3 py-2">
                        <select
                          value={row.categoryId}
                          onChange={(event) =>
                            setRow(row.id, {
                              categoryId: event.target.value,
                              subcategoryId: "",
                            })
                          }
                          className="w-44 rounded-lg border border-primary-200 px-2 py-1"
                        >
                          <option value="">Choose category</option>
                          {rowCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.subcategoryId}
                          onChange={(event) =>
                            setRow(row.id, { subcategoryId: event.target.value })
                          }
                          className="w-44 rounded-lg border border-primary-200 px-2 py-1"
                        >
                          <option value="">No subcategory</option>
                          {rowSubcategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {row.categoryId ? (
                          <span className="text-primary-700">
                            {preview?.status === "duplicate"
                              ? "Duplicate"
                              : categoryNameById.get(row.categoryId) || "Ready"}
                          </span>
                        ) : (
                          <span className="text-expense-dark">
                            Category required
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-gray-600">
              {selectedPreviewRows.length} valid rows selected,{" "}
              {previewRows.filter((row) => row.status === "duplicate").length} duplicates
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isImporting || selectedPreviewRows.length === 0}
              onClick={handleImport}
            >
              {isImporting ? "Importing..." : "Import Statement Rows"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

const CategorySelect = ({
  label,
  value,
  onChange,
  incomeCategories,
  expenseCategories,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  incomeCategories: TransactionCategory[];
  expenseCategories: TransactionCategory[];
}) => (
  <label className="text-sm font-medium text-primary-700">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-lg border border-primary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
    >
      <option value="">Choose category</option>
      <optgroup label="Expenses">
        {expenseCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Income">
        {incomeCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </optgroup>
    </select>
  </label>
);
