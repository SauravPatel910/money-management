import { memo } from "react";

const Button = memo(
  ({
    htmlType = "button",
    onClick,
    children, // Button text
    className = "",
    icon, // JSX element for the icon
    disabled = false,
    variant, // 'action', 'income', 'expense', 'transfer', 'person'
    isActive = false, // Relevant for 'income', 'expense', 'transfer', 'person' variants
  }) => {
    let baseClasses =
      "flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50";
    let variantClasses = "";

    if (variant === "action") {
      baseClasses +=
        " w-full px-6 py-3 text-center shadow-md transform hover:-translate-y-0.5 hover:shadow-lg";
      variantClasses =
        "bg-gradient-to-r from-primary-500 to-primary-600 text-white focus:ring-primary-500";
      if (disabled) {
        variantClasses = "bg-gray-400 text-gray-200 cursor-not-allowed";
        baseClasses += " shadow-none transform-none";
      }
    } else if (["income", "expense", "transfer", "person"].includes(variant)) {
      baseClasses += " px-4 py-3 text-center text-sm";
      if (isActive) {
        variantClasses = "text-white shadow-md";
        if (variant === "income") {
          variantClasses +=
            " bg-gradient-to-r from-income to-income-dark focus:ring-income";
        } else if (variant === "expense") {
          variantClasses +=
            " bg-gradient-to-r from-expense to-expense-dark focus:ring-expense";
        } else if (variant === "transfer") {
          variantClasses +=
            " bg-gradient-to-r from-primary-500 to-primary-600 focus:ring-primary-500";
        } else if (variant === "person") {
          variantClasses +=
            " bg-gradient-to-r from-accent-purple to-accent-pink focus:ring-accent-purple";
        }
      } else {
        variantClasses =
          "bg-gray-100 text-gray-500 hover:bg-gray-200 focus:ring-primary-300";
      }
    }

    const combinedClassName = `${baseClasses} ${variantClasses} ${className}`;

    return (
      <button
        type={htmlType}
        onClick={onClick}
        className={combinedClassName.trim()}
        disabled={disabled}
      >
        {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
        {children}
      </button>
    );
  },
);

export default Button;
