const { z } = require("zod"); // Reuse the backend's installed validator.
const statusSchema = z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]); // Keep API states aligned with Prisma.
exports.contactSchema = z.object({
  // Accept the public contact form contract.
  fullName: z.string().trim().min(1).max(100), // Require a bounded sender name.
  email: z.string().trim().toLowerCase().email().max(254), // Normalize the reply address without looking up accounts.
  phone: z.string().trim().max(30).optional(), // Permit an omitted or empty optional phone field.
  subject: z.string().trim().max(200).optional(), // Permit the Figma form without a subject input.
  message: z.string().trim().min(1).max(2000), // Bound stored content and remain below the JSON body limit.
}); // Strip unknown keys so clients cannot set inquiry status.
exports.inquiryListSchema = z.object({
  // Validate admin filters and pagination.
  status: statusSchema.optional(), // Omission includes all inquiry states.
  page: z.coerce.number().int().min(1).max(100000).default(1), // Bound the pagination offset.
  limit: z.coerce.number().int().min(1).max(100).default(25), // Bound personal data returned per request.
}); // Finish list filters.
exports.inquiryUpdateSchema = z
  .object({
    // Permit only workflow status changes.
    status: statusSchema, // Reject unknown statuses.
  })
  .strict(); // Reject attempts to change sender content through this endpoint.
exports.inquiryIdSchema = z.string().uuid(); // Reject malformed record identifiers before querying Prisma.
