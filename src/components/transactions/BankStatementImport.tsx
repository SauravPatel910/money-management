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
import DatePicker from "../forms/DatePicker";
import Select from "../forms/Select";
import StatusMessage from "../UI/StatusMessage";

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
    <section className="rounded-[25px] bg-white p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[22px] font-semibold text-[#343c6a]">
            Bank Statement OCR Import
          </h3>
          <p className="mt-1 text-sm text-[#718ebf]">
            Upload PDF or image statements, review OCR rows, choose categories, then import.
          </p>
        </div>
        <Select
          label="Statement account"
          name="statementAccountId"
          value={accountId}
          onValueChange={setAccountId}
          options={accounts.map((account) => ({
            value: account.id,
            label: account.name,
          }))}
          buttonClassName="h-[44px] px-4 text-sm"
          containerClassName="min-w-[180px]"
        />
      </div>

      <label className="block rounded-[18px] border border-dashed border-[#dfeaf2] bg-[#f5f7fa] p-5 text-sm font-medium text-[#343c6a]">
        Upload statement
        <input
          type="file"
          accept={supportedStatementExtensions}
          className="mt-3 block w-full text-sm text-[#718ebf] file:mr-4 file:rounded-full file:border-0 file:bg-[#1814f3] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          onChange={handleFileChange}
          disabled={isExtracting}
        />
      </label>

      {isExtracting && (
        <div className="mt-4 rounded-[18px] border border-[#dfeaf2] bg-[#f5f7fa] p-4">
          <div className="mb-2 flex justify-between text-sm font-medium text-[#343c6a]">
            <span>{ocrStatus || "Reading statement..."}</span>
            <span>{Math.round(ocrProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#dfeaf2]">
            <div
              className="h-full bg-[#1814f3]"
              style={{ width: `${Math.min(ocrProgress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {message && (
        <StatusMessage
          className="mt-4"
          tone={
            message.includes("failed") ||
            message.includes("Could not") ||
            message.includes("Choose") ||
            message.includes("Select")
              ? "warning"
              : "success"
          }
        >
          {message}
        </StatusMessage>
      )}

      {rawText && (
        <details className="mt-4 rounded-[18px] border border-[#e6eff5] bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#343c6a]">
            OCR text
          </summary>
          <textarea
            value={rawText}
            onChange={(event) => {
              setRawText(event.target.value);
              parseTextToRows(event.target.value);
            }}
            className="mt-3 h-40 w-full rounded-[15px] border border-[#dfeaf2] p-3 text-xs text-[#343c6a] outline-none"
          />
        </details>
      )}

      {rows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 rounded-[18px] border border-[#dfeaf2] bg-[#f5f7fa] p-4 md:flex-row md:items-end">
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
            <Select
              label="Bulk subcategory"
              name="bulkSubcategoryId"
              value={bulkSubcategoryId}
              onValueChange={setBulkSubcategoryId}
              options={[
                { value: "", label: "No subcategory" },
                ...bulkSubcategoryOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
              buttonClassName="h-[44px] px-4 text-sm"
            />
            <button
              type="button"
              className="h-[44px] rounded-[15px] bg-[#1814f3] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff]"
              onClick={applyBulkCategory}
            >
              Apply to Selected
            </button>
          </div>

          <div className="overflow-x-auto rounded-[18px] border border-[#e6eff5]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f5f7fa] text-left text-xs text-[#718ebf]">
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
              <tbody className="divide-y divide-[#f2f4f7]">
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
                        <DatePicker
                          label="Date"
                          name={`statement-row-date-${row.id}`}
                          value={row.date}
                          onValueChange={(value) => setRow(row.id, { date: value })}
                          buttonClassName="h-9 rounded-[12px] px-2 py-1 text-sm"
                          containerClassName="w-36"
                          labelClassName="sr-only"
                        />
                      </td>
                      <td className="min-w-64 px-3 py-2">
                        <input
                          value={row.description}
                          onChange={(event) =>
                            setRow(row.id, { description: event.target.value })
                          }
                          className="w-full rounded-[12px] border border-[#dfeaf2] px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2 capitalize">{row.type}</td>
                      <td className="px-3 py-2">{formatCurrency(row.amount)}</td>
                      <td className="px-3 py-2">
                        <Select
                          label="Category"
                          name={`row-category-${row.id}`}
                          value={row.categoryId}
                          onValueChange={(value) =>
                            setRow(row.id, {
                              categoryId: value,
                              subcategoryId: "",
                            })
                          }
                          options={[
                            { value: "", label: "Choose category" },
                            ...rowCategories.map((category) => ({
                              value: category.id,
                              label: category.name,
                            })),
                          ]}
                          buttonClassName="h-9 rounded-[12px] px-2 py-1 text-sm"
                          containerClassName="w-44"
                          labelClassName="sr-only"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          label="Subcategory"
                          name={`row-subcategory-${row.id}`}
                          value={row.subcategoryId}
                          onValueChange={(value) =>
                            setRow(row.id, { subcategoryId: value })
                          }
                          options={[
                            { value: "", label: "No subcategory" },
                            ...rowSubcategories.map((category) => ({
                              value: category.id,
                              label: category.name,
                            })),
                          ]}
                          buttonClassName="h-9 rounded-[12px] px-2 py-1 text-sm"
                          containerClassName="w-44"
                          labelClassName="sr-only"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {row.categoryId ? (
                            <span className="text-[#343c6a]">
                            {preview?.status === "duplicate"
                              ? "Duplicate"
                              : categoryNameById.get(row.categoryId) || "Ready"}
                          </span>
                        ) : (
                          <span className="text-[#ff4b4a]">
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
            <div className="text-sm font-medium text-[#718ebf]">
              {selectedPreviewRows.length} valid rows selected,{" "}
              {previewRows.filter((row) => row.status === "duplicate").length} duplicates
            </div>
            <button
              type="button"
              className="rounded-full bg-[#1814f3] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
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
  <Select
    label={label}
    name={label.toLowerCase().replace(/\s+/g, "-")}
    value={value}
    onValueChange={onChange}
    options={[
      { value: "", label: "Choose category" },
      ...expenseCategories.map((category) => ({
        value: category.id,
        label: `Expenses / ${category.name}`,
      })),
      ...incomeCategories.map((category) => ({
        value: category.id,
        label: `Income / ${category.name}`,
      })),
    ]}
    buttonClassName="h-[44px] px-4 text-sm"
  />
);
