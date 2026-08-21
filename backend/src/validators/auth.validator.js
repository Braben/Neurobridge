// Zod validation schemas for authentication flows
const { z } = require("zod");

// Validates user registration payload
// areaofexpertise is required only when role === "THERAPIST" (enforced in controller)
// adminInviteCode is required only when role === "ADMIN" (enforced in controller)
exports.registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  identifier: z.string().min(5, "Email or phone number is too short").max(100).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().min(5, "Phone number is too short").max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

// Validates send-OTP request
exports.sendOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
});

exports.requestPasswordResetSchema = z.object({
  identifier: z.string().min(5, "Email or phone number is too short").max(100),
});

exports.resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "Reset code must be exactly 6 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Validates verify-OTP request
exports.verifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "OTP code must be exactly 6 characters"),
});

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
