const { z } = require("zod");

const PASSWORD_RULE_MESSAGE =
  "Password must be 8-128 characters and include uppercase, lowercase, number, and special character";

const passwordSchema = z
  .string()
  .min(8, PASSWORD_RULE_MESSAGE)
  .max(128, PASSWORD_RULE_MESSAGE)
  .regex(/[a-z]/, PASSWORD_RULE_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_RULE_MESSAGE)
  .regex(/\d/, PASSWORD_RULE_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_RULE_MESSAGE)
  .refine((value) => !/\s/.test(value), {
    message: "Password must not contain spaces",
  });

function ageFromDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - date.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < date.getUTCDate())) age -= 1;
  return age;
}

function dateOfBirthSchema(label = "Date of birth", options = {}) {
  const { adult = false, maxAge = 120 } = options;

  return z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: `${label} must be a valid date`,
    })
    .refine((value) => new Date(value).getTime() <= Date.now(), {
      message: `${label} cannot be in the future`,
    })
    .refine((value) => {
      const age = ageFromDate(value);
      return age !== null && age <= maxAge;
    }, {
      message: `${label} is outside the allowed age range`,
    })
    .refine((value) => {
      if (!adult) return true;
      const age = ageFromDate(value);
      return age !== null && age >= 18;
    }, {
      message: "User must be at least 18 years old",
    });
}

module.exports = {
  PASSWORD_RULE_MESSAGE,
  dateOfBirthSchema,
  passwordSchema,
};
