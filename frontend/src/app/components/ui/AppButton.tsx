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
    "bg-[#0a3d62] text-[#fafafa] hover:bg-[#0071d7] focus-visible:ring-[#0071d7] disabled:bg-[#b5d3ee]",
  secondary:
    "border border-[#0a3d62] bg-transparent text-[#0a3d62] hover:border-[#0071d7] hover:text-[#0071d7] focus-visible:ring-[#0071d7] disabled:border-[#b5d3ee] disabled:text-[#b5d3ee]",
  outline:
    "border border-[#b5d3ee] bg-[#f5f5f5] text-[#0a3d62] hover:border-[#0071d7] hover:text-[#0071d7] focus-visible:ring-[#0071d7]",
  ghost:
    "bg-transparent text-[#0a3d62] hover:bg-[#e0f4ff] focus-visible:ring-[#0071d7]",
  danger:
    "bg-[#e53935] text-white hover:bg-[#bd302d] focus-visible:ring-[#e53935] disabled:bg-[#ffb4b4]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-[60px] px-8 text-lg",
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
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-colors",
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
