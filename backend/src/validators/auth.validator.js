// Zod validation schemas for authentication flows
const { z } = require("zod");
const { dateOfBirthSchema, passwordSchema } = require("../utils/validation");

const identifierFieldsSchema = {
  identifier: z.string().min(5, "Email or phone number is too short").max(100).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().min(5, "Phone number is too short").max(20).optional().nullable(),
  channel: z.enum(["EMAIL", "SMS"]).optional().nullable(),
};

const requireIdentifier = (data, ctx) => {
  if (!data.identifier && !data.email && !data.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email or phone number is required",
      path: ["identifier"],
    });
  }
};

// Validates user registration payload
// areaofexpertise is required only when role === "THERAPIST" (enforced in controller)
// adminInviteCode is required only when role === "ADMIN" (enforced in controller)
exports.registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  identifier: z.string().min(5, "Email or phone number is too short").max(100).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().min(5, "Phone number is too short").max(20).optional().nullable(),
  dateOfBirth: dateOfBirthSchema("Date of birth", { adult: true }).optional().nullable(),
  password: passwordSchema,
  role: z.enum(["ADMIN", "PARENT", "THERAPIST"], {
    errorMap: () => ({ message: "Role must be ADMIN, PARENT, or THERAPIST" }),
  }),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
  adminInviteCode: z.string().optional().nullable(),
  areaofexpertise: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (!data.identifier && !data.email && !data.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email or phone number is required",
      path: ["identifier"],
    });
  }
  if (data.role !== "ADMIN" && !data.dateOfBirth) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date of birth is required",
      path: ["dateOfBirth"],
    });
  }
  if (data.role === "THERAPIST" && !data.areaofexpertise) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Therapists must provide an area of expertise",
      path: ["areaofexpertise"],
    });
  }
  if (data.role === "ADMIN" && !data.adminInviteCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Administrators must provide an invite code",
      path: ["adminInviteCode"],
    });
  }
});

// Validates login payload — accepts email OR phone (at least one required)
exports.loginSchema = z
  .object({
    email: z.string().email("Invalid email format").optional().nullable(),
    phone: z.string().optional().nullable(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided",
  });

// Validates send-OTP request. The legacy { email } payload is still accepted.
exports.sendOtpSchema = z.object(identifierFieldsSchema).superRefine(requireIdentifier);

exports.requestPasswordResetSchema = z.object({
  identifier: z.string().min(5, "Email or phone number is too short").max(100),
});

exports.resetPasswordSchema = z.object({
  ...identifierFieldsSchema,
  code: z.string().length(6, "Reset code must be exactly 6 characters"),
  password: passwordSchema,
}).superRefine(requireIdentifier);

// Validates verify-OTP request
exports.verifyOtpSchema = z.object({
  ...identifierFieldsSchema,
  code: z.string().length(6, "OTP code must be exactly 6 characters"),
}).superRefine(requireIdentifier);

// Generic validation middleware — wraps a Zod schema and returns 400 on failure
// Uses result.error.issues for Zod v4 compatibility
exports.validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      return res.status(400).json({ message: messages.join("; ") });
    }
    // Replace req.body with parsed (and sanitised) data
    req.body = result.data;
    next();
  };
};
