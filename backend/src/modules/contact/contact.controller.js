const prisma = require("../../config/prisma"); // Use the shared database client.
const { inquiryListSchema, inquiryIdSchema } = require("../../validators/contact.validator"); // Validate Express query and path input.
exports.createInquiry = async (req, res, next) => { // Persist public submissions before reporting success.
  try { // Forward database failures through the shared error handler.
    const { fullName, email, phone, subject, message } = req.body; // Read the validated public contract.
    const inquiry = await prisma.contactInquiry.create({ // Await the durable write rather than relying on email delivery.
      data: { fullName, email, phone: phone || null, subject: subject || null, message }, // Leave status and timestamps server-owned.
      select: { id: true, createdAt: true }, // Do not echo personal message content publicly.
    }); // Complete persistence.
    return res.status(201).json({ message: "Your message has been received.", inquiry }); // Confirm only after database success.
  } catch (error) { // Catch persistence failures.
    next(error); // Preserve the shared sanitized error response.
  } // End error handling.
}; // End public submission handler.
exports.listInquiries = async (req, res, next) => { // List inquiries behind the existing admin authorization middleware.
  try { // Keep validation and database failures explicit.
    const result = inquiryListSchema.safeParse(req.query); // Express 5 query is read-only, so use parsed local data.
    if (!result.success) return res.status(400).json({ message: "Invalid inquiry filters or pagination" }); // Reject invalid filters.
    const { status, page, limit } = result.data; // Use normalized numeric pagination.
    const where = status ? { status } : {}; // Omit filtering when all states are requested.
    const [inquiries, total] = await prisma.$transaction([ // Read rows and their pagination count together.
      prisma.contactInquiry.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit }), // Keep pages ordered and bounded.
      prisma.contactInquiry.count({ where }), // Count only matching inquiries.
    ]); // Complete the list read.
    return res.status(200).json({ inquiries, pagination: { page, limit, total } }); // Return the documented admin envelope.
  } catch (error) { // Catch list failures.
    next(error); // Delegate operational errors.
  } // End error handling.
}; // End admin listing handler.
exports.updateInquiryStatus = async (req, res, next) => { // Update inquiry workflow without editing original submissions.
  try { // Preserve missing-record and database errors separately.
    const id = inquiryIdSchema.safeParse(req.params.id); // Validate the path independently of the body middleware.
    if (!id.success) return res.status(400).json({ message: "Invalid inquiry identifier" }); // Reject malformed IDs.
    const inquiry = await prisma.contactInquiry.update({ // Atomically update the identified inquiry.
      where: { id: id.data }, // Address only the validated record.
      data: { status: req.body.status }, // Prisma maintains updatedAt automatically.
    }); // Complete the status write.
    return res.status(200).json({ message: "Inquiry status updated", inquiry }); // Return the saved state.
  } catch (error) { // Distinguish a missing inquiry from an operational failure.
    if (error.code === "P2025") return res.status(404).json({ message: "Inquiry not found" }); // Map Prisma's missing-row error.
    next(error); // Delegate other failures.
  } // End error handling.
}; // End admin status handler.
