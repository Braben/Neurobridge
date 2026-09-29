// Compatibility exports keep existing forms working during the folder migration.
export { FormField, SelectField, TextAreaField } from "@/components/ui/FormField";
// Expose the same native-control prop types to migrated feature modules.
export type { FieldStatus, InputProps, SelectProps, TextAreaProps } from "@/components/ui/FormField";
