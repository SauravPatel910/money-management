import { memo } from "react";
import type { ChangeEventHandler, HTMLInputTypeAttribute } from "react";
import DatePicker from "./DatePicker";

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
  if (type === "date" || type === "month") {
    return (
      <DatePicker
        label={label}
        name={name}
        value={String(value)}
        onChange={onChange}
        mode={type === "month" ? "month" : "date"}
        required={required}
        disabled={disabled}
      />
    );
  }

  return (
    <>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[#343c6a]"
      >
        {label}
        {required && <span className="ml-1 text-[#ff4b4a]">*</span>}
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
        className="h-[50px] w-full rounded-[15px] border border-[#dfeaf2] bg-white px-5 text-[15px] text-[#343c6a] outline-none transition-colors placeholder:text-[#8ba3cb] focus:border-[#2d60ff] disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#718ebf]"
      />
    </>
  );
};

export default memo(Input);
