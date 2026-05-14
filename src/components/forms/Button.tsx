import { memo } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "action" | "income" | "expense" | "transfer" | "person";

type ButtonProps = {
  htmlType?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: ButtonVariant;
  isActive?: boolean;
};

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
  }: ButtonProps) => {
    let baseClasses =
      "flex items-center justify-center rounded-[15px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50";
    let variantClasses = "";

    if (variant === "action") {
      baseClasses +=
        " h-[50px] w-full px-6 text-center";
      variantClasses = "bg-[#1814f3] text-white focus:ring-[#2d60ff]";
      if (disabled) {
        variantClasses = "bg-gray-400 text-gray-200 cursor-not-allowed";
        baseClasses += " shadow-none transform-none";
      }
    } else if (
      variant &&
      ["income", "expense", "transfer", "person"].includes(variant)
    ) {
      baseClasses += " px-4 py-3 text-center text-sm";
      if (isActive) {
        variantClasses = "text-white shadow-md";
        if (variant === "income") {
          variantClasses += " bg-[#16dbcc] focus:ring-[#16dbcc]";
        } else if (variant === "expense") {
          variantClasses += " bg-[#ff4b4a] focus:ring-[#ff4b4a]";
        } else if (variant === "transfer") {
          variantClasses += " bg-[#1814f3] focus:ring-[#2d60ff]";
        } else if (variant === "person") {
          variantClasses += " bg-[#343c6a] focus:ring-[#343c6a]";
        }
      } else {
        variantClasses =
          "border border-[#dfeaf2] bg-white text-[#718ebf] hover:border-[#2d60ff] hover:text-[#2d60ff] focus:ring-[#dfe7ff]";
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
