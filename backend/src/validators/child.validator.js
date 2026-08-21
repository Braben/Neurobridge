// Zod validation schemas for child endpoints
const { z } = require("zod");

// Generic validation middleware - handles both body and params
const makeValidate = (schema) => {
  return (req, res, next) => {
    const data = { body: req.body, params: req.params, query: req.query };
    const result = schema.safeParse(data);
    if (!result.success) {
      const messages = result.error.issues.map((e) => e.message);
      return res.status(400).json({ message: messages.join("; ") });
    }
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;
    next();
  };
};

exports.validate = makeValidate;

// Create child schema
exports.createChildSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    dateOfBirth: z.string().datetime({ offset: true }, "Invalid date format, use ISO 8601"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
      errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHER" }),
    }),
    diagnosis: z.string().max(500).optional().nullable(),
    coExistingConditions: z.string().max(500).optional().nullable(),
    currentMedications: z.string().max(500).optional().nullable(),
    school: z.string().max(100).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

// Update child schema (all fields optional)
exports.updateChildSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    dateOfBirth: z.string().datetime({ offset: true }).optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    diagnosis: z.string().max(500).optional().nullable(),
    coExistingConditions: z.string().max(500).optional().nullable(),
    currentMedications: z.string().max(500).optional().nullable(),
    school: z.string().max(100).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});

// Child ID param schema
exports.childIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid child ID format"),
  }),
});

// Assign therapist schema
exports.assignTherapistSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid child ID format"),
  }),
  body: z.object({
    therapistId: z.string().uuid("Invalid therapist ID format"),
  }),
});
