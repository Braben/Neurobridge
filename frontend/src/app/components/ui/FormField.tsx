import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldStatus = "default" | "error" | "success";

interface FormFieldProps {
  error?: string;
  helpText?: string;
  label: string;
  name: string;
  onRightIconClick?: () => void;
  rightIcon?: ReactNode;
  rightIconLabel?: string;
  status?: FieldStatus;
}

type InputProps = FormFieldProps & InputHTMLAttributes<HTMLInputElement>;
type SelectProps = FormFieldProps & SelectHTMLAttributes<HTMLSelectElement>;
type TextAreaProps = FormFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

const statusClasses: Record<FieldStatus, string> = {
  default: "border-[#b5d3ee] focus:border-[#0071d7] focus:ring-[#0071d7]/20",
  error: "border-[#ef4444] text-[#d92d20] focus:border-[#ef4444] focus:ring-[#ef4444]/20",
  success: "border-[#59b36a] focus:border-[#2e7d32] focus:ring-[#2e7d32]/20",
};

const baseControl =
  "mt-3 h-[60px] w-full rounded-2xl border bg-[#f5f5f5] px-4 text-base font-medium text-[#111111] outline-none transition placeholder:text-[#757575] focus:ring-4 disabled:bg-[#eeeeee]";

function FieldChrome({
  children,
  error,
  helpText,
  label,
  name,
  required,
  status = "default",
}: {
  children: ReactNode;
  error?: string;
  helpText?: string;
  label: string;
  name: string;
  required?: boolean;
  status?: FieldStatus;
}) {
  const messageColor = error
    ? "text-[#e53935]"
    : status === "success"
      ? "text-[#2e7d32]"
      : "text-[#616161]";

  return (
    <div>
      <label htmlFor={name} className="block text-base font-normal leading-6 text-[#111111]">
        {label}
        {required && <span className="text-[#e94545]"> *</span>}
      </label>
      {children}
      {(error || helpText) && (
        <p className={`mt-2 text-xs ${messageColor}`}>
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
  onRightIconClick,
  rightIcon,
  rightIconLabel,
  status = error ? "error" : "default",
  className = "",
  required,
  ...props
}: InputProps) {
  return (
    <FieldChrome error={error} helpText={helpText} label={label} name={name} required={required} status={status}>
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
          onRightIconClick ? (
            <button
              type="button"
              aria-label={rightIconLabel}
              onClick={onRightIconClick}
              className="absolute right-4 top-[calc(50%+6px)] -translate-y-1/2 text-[#0a4d78] transition hover:text-[#0071d7] focus:outline-none focus:ring-2 focus:ring-[#0071d7]/30"
            >
              {rightIcon}
            </button>
          ) : (
            <span className="absolute right-4 top-[calc(50%+6px)] -translate-y-1/2 text-[#8ec1e7]">{rightIcon}</span>
          )
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
    <FieldChrome error={error} helpText={helpText} label={label} name={name} required={required} status={status}>
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
    <FieldChrome error={error} helpText={helpText} label={label} name={name} required={required} status={status}>
      <textarea
        id={name}
        name={name}
        required={required}
        className={[baseControl, "h-auto min-h-36 py-4", statusClasses[status], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </FieldChrome>
  );
}
