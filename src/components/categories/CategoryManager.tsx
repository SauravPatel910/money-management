"use client";

import { memo, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AppDispatch } from "../../config/reduxStore";
import {
  addCategoryThunk,
  deleteCategoryThunk,
  editCategoryThunk,
} from "../../store/transactionsSlice";
import type {
  TransactionCategory,
  TransactionCategoryInput,
  TransactionType,
} from "../../types/money";

const transactionTypes: TransactionType[] = [
  "income",
  "expense",
  "transfer",
  "person",
];

type CategoryManagerProps = {
  categories: TransactionCategory[];
  dispatch: AppDispatch;
};

type CategoryFormState = {
  type: TransactionType;
  name: string;
  parentId: string;
};

const initialForm: CategoryFormState = {
  type: "expense",
  name: "",
  parentId: "",
};

const CategoryManager = ({ categories, dispatch }: CategoryManagerProps) => {
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const parentOptions = useMemo(
    () =>
      categories
        .filter((category) => category.type === form.type && !category.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categories, form.type],
  );

  const groupedCategories = useMemo(
    () =>
      transactionTypes.map((type) => ({
        type,
        parents: categories
          .filter((category) => category.type === type && !category.parentId)
          .sort(
            (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
          ),
      })),
    [categories],
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: TransactionCategoryInput = {
      type: form.type,
      name: form.name.trim(),
      parentId: form.parentId || null,
    };

    try {
      if (editingId) {
        await dispatch(editCategoryThunk({ id: editingId, ...payload })).unwrap();
        setMessage("Category updated.");
      } else {
        await dispatch(addCategoryThunk(payload)).unwrap();
        setMessage("Category added.");
      }
      resetForm();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Category action failed.",
      );
    }
  };

  const startEdit = (category: TransactionCategory) => {
    setEditingId(category.id);
    setForm({
      type: category.type,
      name: category.name,
      parentId: category.parentId || "",
    });
    setMessage(null);
  };

  const removeCategory = async (category: TransactionCategory) => {
    try {
      await dispatch(deleteCategoryThunk(category.id)).unwrap();
      setMessage("Category deleted.");
      if (editingId === category.id) {
        resetForm();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete category.",
      );
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border-l-4 border-primary-500 bg-white/90 p-6 shadow-card">
        <h3 className="mb-6 border-b border-primary-100 pb-3 text-xl font-semibold text-primary-700">
          {editingId ? "Edit Category" : "Add Category"}
        </h3>
        {message && (
          <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-primary-700">
            Type
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as TransactionType,
                  parentId: "",
                }))
              }
              className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm capitalize shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
            >
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-primary-700">
            Name
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-primary-700">
            Parent Category
            <select
              value={form.parentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  parentId: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
            >
              <option value="">Top-level category</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              className="rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border-t-4 border-primary-500 bg-white/90 p-6 shadow-card">
        <h3 className="mb-6 border-b border-primary-100 pb-3 text-xl font-semibold text-primary-700">
          Categories
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {groupedCategories.map(({ type, parents }) => (
            <div key={type} className="rounded-xl border border-primary-100 p-4">
              <h4 className="mb-3 text-sm font-semibold text-primary-700 capitalize">
                {type}
              </h4>
              <div className="space-y-3">
                {parents.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    childrenCategories={categories.filter(
                      (child) => child.parentId === category.id,
                    )}
                    startEdit={startEdit}
                    removeCategory={removeCategory}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategoryTreeItem = ({
  category,
  childrenCategories,
  startEdit,
  removeCategory,
}: {
  category: TransactionCategory;
  childrenCategories: TransactionCategory[];
  startEdit: (category: TransactionCategory) => void;
  removeCategory: (category: TransactionCategory) => void;
}) => (
  <div className="rounded-lg bg-primary-50/50 p-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium text-primary-800">{category.name}</div>
        {category.isSystem && (
          <div className="text-xs font-medium text-gray-500">System fallback</div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-primary-700"
          onClick={() => startEdit(category)}
        >
          Edit
        </button>
        {!category.isSystem && (
          <button
            type="button"
            className="rounded-lg bg-expense px-3 py-1 text-xs font-medium text-white"
            onClick={() => removeCategory(category)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
    {childrenCategories.length > 0 && (
      <div className="mt-3 space-y-2 border-l border-primary-200 pl-3">
        {childrenCategories
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
          .map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2"
            >
              <span className="text-sm text-primary-800">{child.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-primary-200 bg-white px-3 py-1 text-xs font-medium text-primary-700"
                  onClick={() => startEdit(child)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-expense px-3 py-1 text-xs font-medium text-white"
                  onClick={() => removeCategory(child)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
);

export default memo(CategoryManager);
