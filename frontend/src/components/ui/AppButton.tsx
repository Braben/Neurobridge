// Use Next links for navigation while keeping native buttons for commands.
import Link from "next/link";
// Keep anchor and button handlers correctly typed for their actual elements.
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
// Scope the verified Figma component styles without global button selectors.
import styles from "./AppButton.module.css";

// Preserve existing variants while recording compatibility-only variants in the design docs.
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
// Match the three Figma button widths; content is an explicit compact compatibility option.
export type ButtonSize = "sm" | "md" | "lg" | "content";
// Share presentation props between action and navigation buttons.
type SharedProps = {
  children: ReactNode; // Accessible visible button label.
  className?: string; // Allow screen-specific positioning through utility classes.
  fullWidth?: boolean; // Fill a form column instead of the reference width.
  leftIcon?: ReactNode; // Supply an existing or exported icon, never a substitute glyph.
  rightIcon?: ReactNode; // Support the right-icon component family.
  size?: ButtonSize; // Select a verified control width.
  variant?: ButtonVariant; // Select the semantic visual state family.
  disabled?: boolean; // Disable both action and link variants consistently.
  loading?: boolean; // Prevent duplicate actions while a request is pending.
};
// A discriminated union prevents button-only props from leaking onto anchors.
export type AppButtonProps = SharedProps & (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: never }) // Native command behavior.
  | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string }) // Native link behavior.
);

// Render one implementation for every screen, with no authentication or business dependencies.
export default function AppButton({ children, className = "", fullWidth = false, leftIcon, rightIcon, size = "md", variant = "primary", disabled = false, loading = false, ...elementProps }: AppButtonProps) {
  const unavailable = disabled || loading; // Pending actions cannot be activated twice.
  const classes = [styles.button, className].filter(Boolean).join(" "); // Preserve caller layout utilities.
  const presentation = { className: classes, "data-size": size, "data-variant": variant, "data-full-width": fullWidth, "aria-busy": loading || undefined }; // Keep variant selectors identical for links and buttons.
  const content = <>{leftIcon}<span className={styles.label}>{children}</span>{rightIcon}</>; // Keep the label and icons stable during pending states.
  if (elementProps.href !== undefined) { // Narrow the native props to the link branch.
    const { href, ...anchorProps } = elementProps; // Do not forward href to disabled elements.
    if (unavailable) return <span {...presentation} id={anchorProps.id} title={anchorProps.title} aria-label={anchorProps["aria-label"]} role="link" aria-disabled="true" tabIndex={-1}>{content}</span>; // A disabled link has no URL or activation handler.
    return <Link {...anchorProps} {...presentation} href={href}>{content}</Link>; // Preserve target, download, accessible labels, and anchor handlers.
  }
  return <button {...elementProps} {...presentation} type={elementProps.type ?? "button"} disabled={unavailable}>{content}</button>; // Default to a non-submitting command unless a form explicitly opts in.
}
