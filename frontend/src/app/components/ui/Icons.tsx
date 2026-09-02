import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, className = "h-5 w-5", ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={2} d="M19 12H5" />
      <path strokeWidth={2} d="m12 19-7-7 7-7" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
    </IconBase>
  );
}

export function CediIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={1.9} d="M16.5 6.5A6.5 6.5 0 1 0 18 15" />
      <path strokeWidth={1.9} d="M7 9.5h7.5" />
      <path strokeWidth={1.9} d="M7 14.5h7.5" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={2} d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={1.9} d="M4 6h16" />
      <path strokeWidth={1.9} d="M7 12h10" />
      <path strokeWidth={1.9} d="M10 18h4" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={2} d="M4 6h16" />
      <path strokeWidth={2} d="M4 12h16" />
      <path strokeWidth={2} d="M4 18h16" />
    </IconBase>
  );
}

export function MessageCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={1.8} d="M21 12a8 8 0 1 1-15.7-2.4A8 8 0 0 1 21 12Z" />
      <path strokeWidth={1.8} d="M8 10h8" />
      <path strokeWidth={1.8} d="M8 14h5" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={2} d="M12 5v14" />
      <path strokeWidth={2} d="M5 12h14" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" strokeWidth={1.9} />
      <path strokeWidth={1.9} d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function TableIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={1.9} d="M4 5h16v14H4z" />
      <path strokeWidth={1.9} d="M4 10h16" />
      <path strokeWidth={1.9} d="M4 15h16" />
      <path strokeWidth={1.9} d="M10 5v14" />
      <path strokeWidth={1.9} d="M16 5v14" />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path strokeWidth={2} d="M6 6l12 12" />
      <path strokeWidth={2} d="M18 6 6 18" />
    </IconBase>
  );
}
