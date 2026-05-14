"use client";

import { memo, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AppDispatch } from "../../config/reduxStore";
import {
  addCategoryThunk,
  deleteCategoryThunk,
  editCategoryThunk,
} from "../../store/transactionsSlice";
import Select from "../forms/Select";
import StatusMessage from "../UI/StatusMessage";
import ConfirmDialog from "../UI/ConfirmDialog";
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
  const [pendingDeleteCategory, setPendingDeleteCategory] =
    useState<TransactionCategory | null>(null);

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

  const removeCategory = (category: TransactionCategory) => {
    setPendingDeleteCategory(category);
    setMessage(null);
  };

  const confirmRemoveCategory = async () => {
    if (!pendingDeleteCategory) return;

    try {
      await dispatch(deleteCategoryThunk(pendingDeleteCategory.id)).unwrap();
      setMessage("Category deleted.");
      if (editingId === pendingDeleteCategory.id) {
        resetForm();
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete category.",
      );
    } finally {
      setPendingDeleteCategory(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
      <div className="rounded-[25px] bg-white p-6">
        <h3 className="mb-6 border-b border-[#ebeef2] pb-4 text-[22px] font-semibold text-[#343c6a]">
          {editingId ? "Edit Category" : "Add Category"}
        </h3>
        {message && (
          <StatusMessage
            className="mb-4"
            tone={
              message.includes("failed") || message.includes("Could not")
                ? "error"
                : "success"
            }
          >
            {message}
          </StatusMessage>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            name="categoryType"
            value={form.type}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                type: value as TransactionType,
                parentId: "",
              }))
            }
            options={transactionTypes.map((type) => ({
              value: type,
              label: type,
            }))}
          />
          <label className="block text-sm font-medium text-[#343c6a]">
            Name
            <span className="ml-1 text-[#ff4b4a]">*</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              className="mt-2 h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors focus:border-[#2d60ff]"
            />
          </label>
          <Select
            label="Parent Category"
            name="parentId"
            value={form.parentId}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                parentId: value,
              }))
            }
            options={parentOptions.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            placeholder="Top-level category"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              className="h-[50px] rounded-[15px] bg-[#1814f3] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2d60ff]"
            >
              {editingId ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="h-[50px] rounded-[15px] border border-[#dfeaf2] bg-white px-4 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[25px] bg-white p-6">
        <h3 className="mb-6 border-b border-[#ebeef2] pb-4 text-[22px] font-semibold text-[#343c6a]">
          Categories
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {groupedCategories.map(({ type, parents }) => (
            <div key={type} className="rounded-[18px] border border-[#e6eff5] p-4">
              <h4 className="mb-3 text-sm font-semibold text-[#343c6a] capitalize">
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
      <ConfirmDialog
        open={Boolean(pendingDeleteCategory)}
        title="Delete category?"
        description={`Delete "${pendingDeleteCategory?.name || "this category"}"? Categories with subcategories, transactions, budgets, or recurring bills cannot be deleted.`}
        confirmLabel="Delete"
        onConfirm={confirmRemoveCategory}
        onCancel={() => setPendingDeleteCategory(null)}
      />
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
  <div className="rounded-[15px] bg-[#f5f7fa] p-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium text-[#343c6a]">{category.name}</div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-full border border-[#123288] bg-white px-3 py-1 text-xs font-medium text-[#123288]"
          onClick={() => startEdit(category)}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-full bg-[#ff4b4a] px-3 py-1 text-xs font-medium text-white"
          onClick={() => removeCategory(category)}
        >
          Delete
        </button>
      </div>
    </div>
    {childrenCategories.length > 0 && (
      <div className="mt-3 space-y-2 border-l border-[#dfeaf2] pl-3">
        {childrenCategories
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
          .map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between gap-3 rounded-[12px] bg-white px-3 py-2"
            >
              <span className="text-sm text-[#343c6a]">{child.name}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[#123288] bg-white px-3 py-1 text-xs font-medium text-[#123288]"
                  onClick={() => startEdit(child)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#ff4b4a] px-3 py-1 text-xs font-medium text-white"
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
