"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeftIcon, FilterIcon, SearchIcon } from "../ui/Icons";

export function AdminBackLink({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-[#111827] hover:text-[#0078d4]">
      <ArrowLeftIcon className="h-4 w-4" />
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
    <div className="relative flex min-h-12 flex-col justify-center gap-4 sm:min-h-[48px]">
      <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2">
        <AdminBackLink href={backHref} />
      </div>
      <h1 className="mx-auto max-w-[min(100%,760px)] text-center text-3xl font-bold tracking-normal text-[#111111] sm:text-[40px] sm:leading-[48px]">
        {children}
      </h1>
      {action && (
        <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2">
          {action}
        </div>
      )}
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <label className="relative block w-full sm:w-[360px]">
        <span className="sr-only">Search</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your item ..."
          className="h-12 w-full rounded-xl border border-[#b5d3ee] bg-white px-4 pr-11 text-sm outline-none transition placeholder:text-[#757575] focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/15"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#536471]" aria-hidden="true">
          <SearchIcon className="h-5 w-5" />
        </span>
      </label>
      <div className="relative">
        <button
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex h-12 items-center gap-2 text-lg font-semibold text-[#111827] hover:text-[#0071d4] focus:outline-none focus:ring-2 focus:ring-[#0071d7]/25"
        >
          <span>{verb}</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#b5d3ee] text-[#0071d4]">
            <FilterIcon className="h-5 w-5" />
          </span>
        </button>
        {children && filtersOpen && (
          <div className="absolute right-0 z-30 mt-2 flex min-w-60 flex-col gap-3 border border-[#b5d3ee] bg-white p-3 shadow-lg">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminFilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="relative inline-flex h-10 min-w-52 items-center rounded-md border border-[#b5d3ee] bg-white text-sm font-semibold text-[#0a3d62]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 outline-none focus:ring-4 focus:ring-[#0071d7]/15"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-[#0071d4]" aria-hidden="true">
        <FilterIcon className="h-4 w-4" />
      </span>
    </label>
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
        <table
          className="admin-data-table w-full table-fixed border-collapse text-left text-sm"
          style={{ minWidth }}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function AdminModal({
  children,
  label,
  onClose,
  maxWidth = "max-w-[520px]",
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#152c47]/40 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={label}>
      <div className={`w-full ${maxWidth} border border-[#b5d3ee] bg-white p-6 shadow-2xl sm:p-8`}>
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${label}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e57373] text-[#e53935] hover:bg-[#fff0f0] focus:outline-none focus:ring-2 focus:ring-[#e53935]/20"
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminDetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#d7e6f2] py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-[#0a3d62]">{label}</dt>
      <dd className="text-sm text-[#111827]">{value}</dd>
    </div>
  );
}

export function AdminFooter() {
  return (
    <footer className="-mx-4 mt-10 bg-[#0a3d62] px-4 py-8 text-white sm:-mx-8 sm:px-8 lg:-mx-14 lg:px-14">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-3xl font-bold tracking-normal sm:text-4xl">Neuro Bridge Africa</p>
        <div className="flex flex-wrap items-center gap-7 text-sm font-medium">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/about" className="hover:underline">About Us</Link>
          <span>&copy; 2026 Neuro Bridge Africa</span>
        </div>
      </div>
    </footer>
  );
}

export function SelectCell({
  checked = false,
  indeterminate = false,
  label = "Select row",
  onChange,
}: {
  checked?: boolean;
  indeterminate?: boolean;
  label?: string;
  onChange?: (checked: boolean) => void;
}) {
  const active = checked || indeterminate;
  const content = (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded border-2 transition ${
        active ? "border-[#0078d4] bg-[#0078d4] text-white" : "border-[#7b7b7b] bg-white"
      }`}
      aria-hidden="true"
    >
      {indeterminate ? <span className="h-0.5 w-3 rounded bg-white" /> : checked ? <span className="h-2.5 w-2.5 rounded-sm bg-white" /> : null}
    </span>
  );

  if (!onChange) return content;

  return (
    <button
      type="button"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      role="checkbox"
      onClick={() => onChange(!checked || indeterminate)}
      className="inline-flex rounded focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30"
    >
      {content}
    </button>
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
