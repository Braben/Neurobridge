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

exports.createSessionSchema = z.object({
  body: z.object({
    childId: z.string().uuid("Invalid child ID"),
    therapistId: z.string().uuid("Invalid therapist ID").optional(),
    bookingId: z.string().uuid("Invalid booking ID").optional().nullable(),
    sessionDate: z.string().datetime({ offset: true }, "Invalid date format"),
    duration: z.number().int().positive().optional().nullable(),
  }),
});

exports.updateSessionSchema = z.object({
  body: z.object({
    sessionDate: z.string().datetime({ offset: true }).optional(),
    duration: z.number().int().positive().optional().nullable(),
  }).refine((d) => Object.keys(d).length > 0, { message: "At least one field required" }),
});

exports.sessionNoteSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    goalsWorkedOn: z.string().min(1).max(2000),
    observations: z.string().min(1).max(5000),
    recommendations: z.string().min(1).max(2000),
    extraNotes: z.string().max(5000).optional().nullable(),
  }),
});

exports.sessionIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid session ID") }),
});

exports.childIdQuerySchema = z.object({
  query: z.object({ childId: z.string().uuid().optional() }),
});
