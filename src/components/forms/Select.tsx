import { memo, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ChangeEventHandler } from "react";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
  label: string;
  name: string;
  value: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  buttonClassName?: string;
  containerClassName?: string;
  labelClassName?: string;
  menuClassName?: string;
};

const Select = ({
  label,
  name,
  value,
  onChange,
  onValueChange,
  options = [],
  placeholder,
  required,
  disabled = false,
  buttonClassName = "",
  containerClassName = "",
  labelClassName = "",
  menuClassName = "",
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalizedOptions = [
    ...(placeholder
      ? [{ value: "", label: placeholder, disabled: Boolean(required) }]
      : []),
    ...options.map((option) =>
      typeof option === "object"
        ? { value: option.value, label: option.label, disabled: false }
        : { value: option, label: option, disabled: false },
    ),
  ];
  const selectedOption =
    normalizedOptions.find((option) => option.value === String(value)) ||
    normalizedOptions[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectValue = (nextValue: string) => {
    onValueChange?.(nextValue);
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      <label
        htmlFor={name}
        className={`mb-2 block text-sm font-medium text-[#343c6a] ${labelClassName}`}
      >
        {label}
        {required && <span className="ml-1 text-[#ff4b4a]">*</span>}
      </label>
      <input
        name={name}
        id={name}
        value={String(value)}
        onChange={() => undefined}
        disabled={disabled}
        tabIndex={-1}
        className="sr-only"
      />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={name}
        disabled={disabled}
        className={`flex h-[50px] w-full items-center justify-between gap-3 rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-left text-[15px] text-[#343c6a] outline-none transition-colors hover:border-[#2d60ff] focus:border-[#2d60ff] disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#718ebf] ${buttonClassName}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="truncate capitalize">{selectedOption?.label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#718ebf] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          className={`absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-[18px] border border-[#dfeaf2] bg-white p-1 shadow-[0_18px_45px_rgba(52,60,106,0.14)] ${menuClassName}`}
        >
          <ul role="listbox" className="max-h-60 overflow-y-auto">
            {normalizedOptions.map((option) => {
              const isSelected = option.value === String(value);
              return (
                <li
                  key={`${option.value}-${option.label}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    disabled={option.disabled}
                    className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-sm capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                      isSelected
                        ? "bg-[#f1f5ff] text-[#1814f3]"
                        : "text-[#343c6a] hover:bg-[#f5f7fa]"
                    }`}
                    onClick={() => selectValue(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.25 7.25a1 1 0 0 1-1.4 0L3.3 9.2a1 1 0 1 1 1.4-1.4l4.05 4.04L15.3 5.3a1 1 0 0 1 1.4 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default memo(Select);
