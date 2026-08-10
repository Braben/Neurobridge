import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface BaseButtonProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  href?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

type AppButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLButtonElement>;

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0078d4] text-white hover:bg-[#005a9e] focus-visible:ring-[#0078d4] disabled:bg-[#b9dcf8]",
  secondary:
    "bg-[#073f63] text-white hover:bg-[#052f4a] focus-visible:ring-[#073f63] disabled:bg-[#a9c2d2]",
  outline:
    "border border-[#d7e6f2] bg-transparent text-[#073f63] hover:border-[#0078d4] hover:text-[#0078d4] focus-visible:ring-[#0078d4]",
  ghost:
    "bg-transparent text-[#073f63] hover:bg-[#eaf6fb] focus-visible:ring-[#0078d4]",
  danger:
    "bg-[#e94545] text-white hover:bg-[#c93333] focus-visible:ring-[#e94545] disabled:bg-[#f4aaaa]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export default function AppButton({
  children,
  className = "",
  fullWidth = false,
  href,
  leftIcon,
  rightIcon,
  size = "md",
  variant = "primary",
  type = "button",
  ...props
}: AppButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-80",
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}
