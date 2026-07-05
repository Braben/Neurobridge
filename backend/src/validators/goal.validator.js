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

exports.createGoalSchema = z.object({
  params: z.object({ childId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
  }),
});

exports.updateGoalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "ARCHIVED"]).optional(),
  }).refine((d) => Object.keys(d).length > 0, { message: "At least one field required" }),
});

exports.goalIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
