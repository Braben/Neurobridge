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

exports.createBehaviourSchema = z.object({
  params: z.object({ childId: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional().nullable(),
  }),
});

exports.updateBehaviourSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
  }),
});

exports.behaviourIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

exports.createBehaviourLogSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    frequency: z.number().int().positive("Frequency must be positive"),
    notes: z.string().max(500).optional().nullable(),
    recordedAt: z.string().datetime({ offset: true }, "Invalid date format"),
  }),
});
