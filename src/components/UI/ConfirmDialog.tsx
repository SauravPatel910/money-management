"use client";

import { memo } from "react";
import { createPortal } from "react-dom";

type ConfirmTone = "danger" | "warning";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  const confirmClass =
    tone === "danger"
      ? "bg-[#ff4b4a] text-white hover:bg-[#e03d3c]"
      : "bg-[#1814f3] text-white hover:bg-[#2d60ff]";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#343c6a]/35 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md rounded-[25px] bg-white p-6 shadow-[0_28px_80px_rgba(52,60,106,0.22)]"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff5d9] text-[#ff4b4a]">
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-xl font-semibold text-[#343c6a]"
            >
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#718ebf]">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="h-[46px] rounded-[15px] border border-[#dfeaf2] bg-white px-4 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`h-[46px] rounded-[15px] px-4 text-sm font-medium transition-colors ${confirmClass}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default memo(ConfirmDialog);
