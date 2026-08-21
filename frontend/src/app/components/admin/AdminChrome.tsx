"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function AdminBackLink({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-[#111827] hover:text-[#0078d4]">
      <span aria-hidden="true">{"<-"}</span>
      Go Back
    </Link>
  );
}

export function AdminTitle({
  action,
  backHref = "/dashboard",
  children,
}: {
  action?: ReactNode;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <AdminBackLink href={backHref} />
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div />
        <h1 className="text-center text-3xl font-bold tracking-normal text-[#111111] sm:text-4xl">{children}</h1>
        <div className="flex justify-start md:justify-end">{action}</div>
      </div>
    </div>
  );
}

export function AdminControls({
  children,
  search,
  setSearch,
  verb = "Filter by",
}: {
  children?: ReactNode;
  search: string;
  setSearch: (value: string) => void;
  verb?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-end gap-4">
      <label className="relative block w-full sm:w-[360px]">
        <span className="sr-only">Search</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your item..."
          className="h-12 w-full rounded-xl border border-[#b5d3ee] bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-[#757575] focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/15"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#536471]" aria-hidden="true">
          O
        </span>
      </label>
      <div className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
        <span>{verb}</span>
        {children || (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#b5d3ee] text-[#0071d4]">
            =
          </span>
        )}
      </div>
    </div>
  );
}

export function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "gold" | "red" | "blue";
}) {
  const classes = {
    green: "bg-[#cfead2] text-[#2e7d32]",
    gold: "bg-[#fff0c7] text-[#ff8500]",
    red: "bg-[#ffd7de] text-[#ff3b3b]",
    blue: "bg-[#eaf6fb] text-[#073f63]",
  };

  return (
    <span className={`inline-flex min-w-16 justify-center rounded-lg px-3 py-1 text-xs font-medium ${classes[tone]}`}>
      {children}
    </span>
  );
}

export function AdminTable({ children, minWidth = "1000px" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className="overflow-hidden border border-[#b5d3ee] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function SelectCell({ checked = false }: { checked?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded border-2 ${
        checked ? "border-[#0078d4] bg-[#0078d4] text-white" : "border-[#7b7b7b] bg-white"
      }`}
      aria-hidden="true"
    >
      {checked ? <span className="h-2.5 w-2.5 rounded-sm bg-white" /> : null}
    </span>
  );
}

export function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#008080] text-sm font-semibold text-white">
      {initials}
    </span>
  );
}

export function IconButton({
  children,
  label,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-[#0071d7]/30 ${
        tone === "danger" ? "text-[#ff7a7a] hover:bg-[#fff0f0]" : "text-[#707070] hover:bg-[#eaf6fb]"
      }`}
    >
      {children}
    </button>
  );
}

export function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.9 4.3 19.7 7.1M4 20h4.5L20 8.5 15.5 4 4 15.5V20Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
    </svg>
  );
}

export function ViewIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}
