"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type DatePickerMode = "date" | "month";

type DatePickerProps = {
  label: string;
  name: string;
  value: string;
  onValueChange?: (value: string) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  mode?: DatePickerMode;
  required?: boolean;
  disabled?: boolean;
  buttonClassName?: string;
  containerClassName?: string;
  labelClassName?: string;
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatMonthValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const parseValue = (value: string, mode: DatePickerMode) => {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (mode === "month" && parts.length >= 2) {
    return new Date(parts[0], parts[1] - 1, 1);
  }
  if (mode === "date" && parts.length >= 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
};

const displayValue = (value: string, mode: DatePickerMode) => {
  const parsed = parseValue(value, mode);
  if (!parsed) return mode === "date" ? "Select date" : "Select month";

  if (mode === "month") {
    return `${monthNames[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  return `${monthNames[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}`;
};

const sameDate = (date: Date, value: string) => formatDateValue(date) === value;
const sameMonth = (date: Date, value: string) => formatMonthValue(date) === value;

const DatePicker = ({
  label,
  name,
  value,
  onValueChange,
  onChange,
  mode = "date",
  required,
  disabled = false,
  buttonClassName = "",
  containerClassName = "",
  labelClassName = "",
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = useMemo(() => parseValue(value, mode), [mode, value]);
  const [visibleDate, setVisibleDate] = useState(selectedDate || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

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

  const commitValue = (nextValue: string) => {
    onValueChange?.(nextValue);
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    } as ChangeEvent<HTMLInputElement>);
    setIsOpen(false);
  };

  const togglePicker = () => {
    setIsOpen((current) => {
      if (!current) {
        setVisibleDate(selectedDate || new Date());
      }
      return !current;
    });
  };

  const dateCells = useMemo(() => {
    const firstDay = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
    const daysInMonth = new Date(
      visibleDate.getFullYear(),
      visibleDate.getMonth() + 1,
      0,
    ).getDate();
    const cells: Array<Date | null> = Array(firstDay.getDay()).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day));
    }
    return cells;
  }, [visibleDate]);

  const moveVisibleDate = (amount: number) => {
    setVisibleDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + (mode === "date" ? amount : amount * 12),
          1,
        ),
    );
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
        id={name}
        name={name}
        value={value}
        onChange={() => undefined}
        disabled={disabled}
        tabIndex={-1}
        className="sr-only"
      />
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`flex h-[50px] w-full items-center justify-between gap-3 rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-left text-[15px] text-[#343c6a] outline-none transition-colors hover:border-[#2d60ff] focus:border-[#2d60ff] disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#718ebf] ${buttonClassName}`}
        onClick={togglePicker}
      >
        <span className={value ? "truncate" : "truncate text-[#8ba3cb]"}>
          {displayValue(value, mode)}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-[#718ebf]"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1.5A1.5 1.5 0 0 1 18 5.5v11A1.5 1.5 0 0 1 16.5 18h-13A1.5 1.5 0 0 1 2 16.5v-11A1.5 1.5 0 0 1 3.5 4H5V3a1 1 0 0 1 1-1Zm10 7H4v7.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V9Z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-[22px] border border-[#dfeaf2] bg-white p-4 shadow-[0_18px_45px_rgba(52,60,106,0.14)]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#dfeaf2] text-[#718ebf] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
              onClick={() => moveVisibleDate(-1)}
              aria-label="Previous"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.8 4.2a1 1 0 0 1 0 1.4L8.4 10l4.4 4.4a1 1 0 1 1-1.4 1.4l-5.1-5.1a1 1 0 0 1 0-1.4l5.1-5.1a1 1 0 0 1 1.4 0Z" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-[#343c6a]">
                {mode === "date"
                  ? `${monthNames[visibleDate.getMonth()]} ${visibleDate.getFullYear()}`
                  : String(visibleDate.getFullYear())}
              </div>
              <button
                type="button"
                className="mt-1 text-xs font-medium text-[#718ebf] hover:text-[#2d60ff]"
                onClick={() => commitValue(mode === "date" ? formatDateValue(new Date()) : formatMonthValue(new Date()))}
              >
                Today
              </button>
            </div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#dfeaf2] text-[#718ebf] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
              onClick={() => moveVisibleDate(1)}
              aria-label="Next"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7.2 15.8a1 1 0 0 1 0-1.4l4.4-4.4-4.4-4.4a1 1 0 1 1 1.4-1.4l5.1 5.1a1 1 0 0 1 0 1.4l-5.1 5.1a1 1 0 0 1-1.4 0Z" />
              </svg>
            </button>
          </div>

          {mode === "date" ? (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#718ebf]">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {dateCells.map((date, index) =>
                  date ? (
                    <button
                      type="button"
                      key={formatDateValue(date)}
                      className={`h-9 rounded-full text-sm font-medium transition-colors ${
                        sameDate(date, value)
                          ? "bg-[#1814f3] text-white"
                          : "text-[#343c6a] hover:bg-[#f5f7fa]"
                      }`}
                      onClick={() => commitValue(formatDateValue(date))}
                    >
                      {date.getDate()}
                    </button>
                  ) : (
                    <span key={`empty-${index}`} />
                  ),
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, monthIndex) => {
                const monthDate = new Date(visibleDate.getFullYear(), monthIndex, 1);
                return (
                  <button
                    type="button"
                    key={month}
                    className={`rounded-[14px] px-3 py-2 text-sm font-medium transition-colors ${
                      sameMonth(monthDate, value)
                        ? "bg-[#1814f3] text-white"
                        : "text-[#343c6a] hover:bg-[#f5f7fa]"
                    }`}
                    onClick={() => commitValue(formatMonthValue(monthDate))}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(DatePicker);
