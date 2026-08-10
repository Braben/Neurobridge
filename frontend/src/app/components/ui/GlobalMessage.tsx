import type { ReactNode } from "react";

type MessageVariant = "error" | "success" | "warning" | "info";

interface GlobalMessageProps {
  children: ReactNode;
  className?: string;
  fixed?: boolean;
  variant?: MessageVariant;
}

const styles: Record<MessageVariant, string> = {
  error: "border-[#f5b7b7] bg-[#ef4444] text-white",
  success: "border-[#9fd49f] bg-[#2e7d32] text-white",
  warning: "border-[#f1d48a] bg-[#fff7d6] text-[#7a4f00]",
  info: "border-[#9ed0f7] bg-[#e8f5ff] text-[#073f63]",
};

const icons: Record<MessageVariant, string> = {
  error:
    "M12 9v4m0 4h.01M10.29 3.86 1.82 14A2 2 0 0 0 3.64 17h16.72a2 2 0 0 0 1.82-3.14l-8.47-10.14a2 2 0 0 0-3.42 0Z",
  success:
    "m9 12 2 2 4-5m6 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  warning:
    "M12 9v4m0 4h.01M10.29 3.86 1.82 14A2 2 0 0 0 3.64 17h16.72a2 2 0 0 0 1.82-3.14l-8.47-10.14a2 2 0 0 0-3.42 0Z",
  info:
    "M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

export default function GlobalMessage({
  children,
  className = "",
  fixed = true,
  variant = "error",
}: GlobalMessageProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={[
        fixed ? "fixed right-4 top-4 z-50" : "",
        "flex max-w-[calc(100vw-2rem)] items-start gap-2 rounded-md border px-4 py-3 text-xs font-semibold shadow-lg sm:max-w-md",
        styles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[variant]} />
      </svg>
      <span className="leading-5">{children}</span>
    </div>
  );
}
