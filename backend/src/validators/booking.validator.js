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

exports.bookingIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid booking ID") }),
});

exports.createBookingSchema = z.object({
  body: z.object({
    slotId: z.string().uuid("Invalid availability slot ID"),
    childId: z.string().uuid("Invalid child ID"),
    therapistId: z.string().uuid("Invalid therapist ID"),
    notes: z.string().max(1000).optional().nullable(),
  }),
});

exports.updateBookingStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid booking ID") }),
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
  }),
});
