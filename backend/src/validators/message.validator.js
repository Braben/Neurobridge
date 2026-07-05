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

exports.createConversationSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string().uuid()).min(1, "At least one participant required"),
  }),
});

exports.sendMessageSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    content: z.string().min(1, "Message cannot be empty").max(5000),
  }),
});

exports.conversationIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
