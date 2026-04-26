import { memo } from "react";
import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";

type InputProps = {
  label: string;
  name: string;
  type?: HTMLInputTypeAttribute;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
  placeholder?: string;
  required?: boolean;
  step?: string;
  disabled?: boolean;
};

const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  step,
  disabled = false,
}: InputProps) => {
  return (
    <>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-primary-700"
      >
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        disabled={disabled}
        className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      />
    </>
  );
};

export default memo(Input);
