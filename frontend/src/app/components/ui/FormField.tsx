import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldStatus = "default" | "error" | "success";

interface FormFieldProps {
  error?: string;
  helpText?: string;
  label: string;
  name: string;
  rightIcon?: ReactNode;
  status?: FieldStatus;
}

type InputProps = FormFieldProps & InputHTMLAttributes<HTMLInputElement>;
type SelectProps = FormFieldProps & SelectHTMLAttributes<HTMLSelectElement>;
type TextAreaProps = FormFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

const statusClasses: Record<FieldStatus, string> = {
  default: "border-[#c7dce9] focus:border-[#0078d4] focus:ring-[#0078d4]/20",
  error: "border-[#ef4444] text-[#d92d20] focus:border-[#ef4444] focus:ring-[#ef4444]/20",
  success: "border-[#59b36a] focus:border-[#2e7d32] focus:ring-[#2e7d32]/20",
};

const baseControl =
  "mt-1 min-h-11 w-full rounded-md border bg-white px-3 text-sm text-[#111827] shadow-sm outline-none transition focus:ring-4 disabled:bg-[#f3f7fa]";

function FieldChrome({
  children,
  error,
  helpText,
  label,
  name,
  required,
}: {
  children: ReactNode;
  error?: string;
  helpText?: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-semibold text-[#1d2b36]">
        {label}
        {required && <span className="text-[#e94545]"> *</span>}
      </label>
      {children}
      {(error || helpText) && (
        <p className={`mt-1 text-[11px] ${error ? "text-[#e94545]" : "text-[#3b647a]"}`}>
          {error || helpText}
        </p>
      )}
    </div>
  );
}

export function FormField({
  error,
  helpText,
  label,
  name,
  rightIcon,
  status = error ? "error" : "default",
  className = "",
  required,
  ...props
}: InputProps) {
  return (
    <FieldChrome error={error} helpText={helpText} label={label} name={name} required={required}>
      <div className="relative">
        <input
          id={name}
          name={name}
          required={required}
          className={[baseControl, statusClasses[status], rightIcon ? "pr-10" : "", className]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4e7b93]">{rightIcon}</span>
        )}
      </div>
    </FieldChrome>
  );
}

export function SelectField({
  error,
  helpText,
  label,
  name,
  status = error ? "error" : "default",
  className = "",
  required,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldChrome error={error} helpText={helpText} label={label} name={name} required={required}>
      <select
        id={name}
        name={name}
        required={required}
        className={[baseControl, statusClasses[status], "appearance-none", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </select>
    </FieldChrome>
  );
}

export function TextAreaField({
  error,
  helpText,
  label,
  name,
  status = error ? "error" : "default",
  className = "",
  required,
  ...props
}: TextAreaProps) {
  return (
    <FieldChrome error={error} helpText={helpText} label={label} name={name} required={required}>
      <textarea
        id={name}
        name={name}
        required={required}
        className={[baseControl, "min-h-28 py-3", statusClasses[status], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </FieldChrome>
  );
}
