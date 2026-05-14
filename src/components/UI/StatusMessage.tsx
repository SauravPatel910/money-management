import { memo } from "react";

type StatusTone = "success" | "warning" | "error" | "info";

type StatusMessageProps = {
  children: string;
  tone?: StatusTone;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  success: "border-[#dcfaf8] bg-[#f4fffe] text-[#16a99f]",
  warning: "border-[#fff0c2] bg-[#fffaf0] text-[#c48600]",
  error: "border-[#ffe0eb] bg-[#fff5f8] text-[#ff4b4a]",
  info: "border-[#dfeaf2] bg-white text-[#343c6a]",
};

const iconClasses: Record<StatusTone, string> = {
  success: "bg-[#dcfaf8] text-[#16a99f]",
  warning: "bg-[#fff5d9] text-[#c48600]",
  error: "bg-[#ffe0eb] text-[#ff4b4a]",
  info: "bg-[#eef3ff] text-[#2d60ff]",
};

const StatusMessage = ({
  children,
  tone = "info",
  className = "",
}: StatusMessageProps) => (
  <div
    className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium shadow-[0_10px_30px_rgba(52,60,106,0.08)] ${toneClasses[tone]} ${className}`}
  >
    <span
      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg ${iconClasses[tone]}`}
    >
      {tone === "success" ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.25 7.25a1 1 0 0 1-1.4 0L3.3 9.2a1 1 0 1 1 1.4-1.4l4.05 4.04L15.3 5.3a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
    <span className="leading-6">{children}</span>
  </div>
);

export default memo(StatusMessage);
