import { memo } from "react";

const Select = ({ label, name, value, onChange, options, required }) => {
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
        className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm capitalize shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option} className="capitalize">
            {option}
          </option>
        ))}
      </select>
    </>
  );
};

export default memo(Select);
