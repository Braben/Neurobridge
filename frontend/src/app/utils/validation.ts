import { z } from "zod";

export const passwordRuleMessage =
  "Password must be 8-128 characters and include uppercase, lowercase, number, and special character";

export const passwordSchema = z
  .string()
  .min(8, passwordRuleMessage)
  .max(128, passwordRuleMessage)
  .regex(/[a-z]/, passwordRuleMessage)
  .regex(/[A-Z]/, passwordRuleMessage)
  .regex(/\d/, passwordRuleMessage)
  .regex(/[^A-Za-z0-9]/, passwordRuleMessage)
  .refine((value) => !/\s/.test(value), "Password must not contain spaces");

export function ageFromDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

export function validateAdultDateOfBirth(value: string) {
  const age = ageFromDateInput(value);
  if (age === null) return "Date of birth must be a valid date";
  if (age < 0) return "Date of birth cannot be in the future";
  if (age < 18) return "User must be at least 18 years old";
  if (age > 120) return "Date of birth is outside the allowed age range";
  return null;
}

export function validateChildDateOfBirth(value: string) {
  const age = ageFromDateInput(value);
  if (age === null) return "Date of birth must be a valid date";
  if (age < 0) return "Date of birth cannot be in the future";
  if (age > 25) return "Child age is outside the allowed range";
  return null;
}

export function passwordError(value: string) {
  const result = passwordSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message || passwordRuleMessage;
}
