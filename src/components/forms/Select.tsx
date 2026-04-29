import { memo } from "react";
import type { ChangeEventHandler } from "react";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
  label: string;
  name: string;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  options?: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required,
  disabled = false,
}: SelectProps) => {
  return (
    <>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-primary-700"
      >
        {label}
      </label>
      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm capitalize shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
      >
        {placeholder && (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          const optionValue =
            typeof option === "object" ? option.value : option;
          const optionLabel =
            typeof option === "object" ? option.label : option;

          return (
            <option
              key={optionValue}
              value={optionValue}
              className="capitalize"
            >
              {optionLabel}
            </option>
          );
        })}
      </select>
    </>
  );
};

export default memo(Select);
