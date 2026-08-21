import type { ReactNode } from "react";

interface StatCardProps {
  action?: ReactNode;
  accent?: "blue" | "teal" | "green" | "gold";
  label: string;
  trend?: string;
  value: string | number;
}

const accentClasses = {
  blue: "text-[#0078d4]",
  teal: "text-[#0da8b8]",
  green: "text-[#2e7d32]",
  gold: "text-[#d49a24]",
};

export function StatCard({
  action,
  accent = "blue",
  label,
  trend,
  value,
}: StatCardProps) {
  const displayValue = typeof value === "number" && !Number.isFinite(value) ? "0" : value;

  return (
    <div className="rounded-md border border-[#b7d8f5] bg-white p-6 shadow-sm">
      <p className={`text-4xl font-bold tracking-normal ${accentClasses[accent]}`}>{displayValue}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-base font-semibold text-[#1f2933]">{label}</p>
        {trend && <span className="text-sm font-semibold text-[#2e7d32]">{trend}</span>}
      </div>
      {action && <div className="mt-5 text-sm font-semibold text-[#0078d4]">{action}</div>}
    </div>
  );
}

interface PanelProps {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
}

interface ScreenHeaderProps {
  action?: ReactNode;
  eyebrow?: string;
  description?: string;
  title: string;
}

export function ScreenHeader({ action, description, eyebrow, title }: ScreenHeaderProps) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase text-[#0078d4]">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-bold tracking-normal text-[#111827] sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-sm leading-6 text-[#536471]">{description}</p>}
      </div>
      {action}
    </section>
  );
}

export function DashboardPanel({
  action,
  children,
  className = "",
  description,
  title,
}: PanelProps) {
  return (
    <section className={className}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#111827] sm:text-3xl">{title}</h2>
          {description && <p className="mt-2 text-sm text-[#44515c]">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FilterPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-[#d7e6f2] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0078d4] border-t-transparent" />
    </div>
  );
}

const badgeClasses: Record<string, string> = {
  blue: "bg-[#eaf6fb] text-[#073f63]",
  green: "bg-[#eaf8ee] text-[#2e7d32]",
  gold: "bg-[#fff5dc] text-[#946200]",
  red: "bg-[#ffe8e8] text-[#bd302d]",
  teal: "bg-[#dcfbfd] text-[#097685]",
};

export function StatusBadge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeClasses;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badgeClasses[tone]}`}>
      {children}
    </span>
  );
}

interface EmptyStateProps {
  action?: ReactNode;
  message: string;
  title: string;
}

export function EmptyState({ action, message, title }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-[#d7e6f2] bg-white px-6 py-10 text-center shadow-sm">
      <h3 className="text-lg font-bold text-[#123c55]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#536471]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
