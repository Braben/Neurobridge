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

const resourceBody = {
  title: z.string().min(1, "Title is required").max(160),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(["ARTICLE", "VIDEO", "PDF"]),
  url: z.string().url("Content URL must be valid").max(1000),
  thumbnailUrl: z.string().url("Thumbnail URL must be valid").max(1000).optional().nullable(),
};

exports.validate = makeValidate;

exports.resourceListSchema = z.object({
  query: z.object({
    type: z.enum(["ARTICLE", "VIDEO", "PDF"]).optional(),
    search: z.string().max(100).optional(),
  }),
});

exports.resourceIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid resource ID") }),
});

exports.createResourceSchema = z.object({
  body: z.object(resourceBody),
});

exports.updateResourceSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid resource ID") }),
  body: z.object(resourceBody).partial().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
});
