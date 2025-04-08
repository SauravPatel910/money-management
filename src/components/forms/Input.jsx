import { memo } from "react";

const Input = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required,
  step,
}) => {
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
        className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
      />
    </>
  );
};

export default memo(Input);
