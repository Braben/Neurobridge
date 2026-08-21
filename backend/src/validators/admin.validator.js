const { z } = require("zod");

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

exports.userIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

exports.updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(5).max(30).optional().nullable(),
    dateOfBirth: z.string().datetime({ offset: true }).optional().nullable(),
    areaofexpertise: z.string().max(100).optional().nullable(),
    isApproved: z.boolean().optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});

exports.bookingRescheduleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    specificDate: z.string().datetime({ offset: true }),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:mm"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:mm"),
  }),
});
