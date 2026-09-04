// Upload controller — file attachment management with Cloudinary storage
// Handles uploading, listing, and deleting file attachments that are linked
// to children and/or therapy sessions. Files are stored in Cloudinary and their
// metadata is persisted in the FileAttachment table for audit and retrieval.
const prisma = require("../../config/prisma");
const { cloudinary } = require("../../config/cloudinary");
const { z } = require("zod");

const uuidSchema = z.string().uuid();

function validateOptionalUuid(value, label) {
  if (!value) return null;
  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    const error = new Error(`${label} must be a valid UUID`);
    error.statusCode = 400;
    throw error;
  }
  return result.data;
}

// POST /api/v1/upload
// Accepts a multipart file upload (field name: "file") along with optional
// childId and sessionId query params to associate the file with a child or
// session record. The upload middleware stores the file in Cloudinary; this
// controller persists the returned metadata.
// Returns 400 if no file is present in the request.
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const childId = validateOptionalUuid(req.body.childId, "Child ID");
    const sessionId = validateOptionalUuid(req.body.sessionId, "Session ID");

    const attachment = await prisma.fileAttachment.create({
      data: {
        childId,
        sessionId,
        fileName: req.file.originalname,
        url: req.file.path,
        publicId: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.user.id,
      },
    });

    return res.status(201).json({ message: "File uploaded", attachment });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/upload
// Lists file attachments uploaded by the authenticated user. Supports optional
// filtering by childId and/or sessionId via query parameters to scope results
// to a specific child or therapy session. Results are sorted newest-first.
exports.listAttachments = async (req, res, next) => {
  try {
    const childId = validateOptionalUuid(req.query.childId, "Child ID");
    const sessionId = validateOptionalUuid(req.query.sessionId, "Session ID");
    const where = { uploadedById: req.user.id };
    if (childId) where.childId = childId;
    if (sessionId) where.sessionId = sessionId;

    const attachments = await prisma.fileAttachment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ attachments });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/upload/:id
// Deletes a file attachment. First removes the file from Cloudinary using the
// stored publicId, then deletes the database record. Ownership is enforced:
// only the user who uploaded the file may delete it. Returns 404 if the
// attachment does not exist or belongs to another user.
exports.deleteAttachment = async (req, res, next) => {
  try {
    const attachmentId = validateOptionalUuid(req.params.id, "Attachment ID");
    const attachment = await prisma.fileAttachment.findFirst({
      where: { id: attachmentId, uploadedById: req.user.id },
    });
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    // Remove the file from Cloudinary first to avoid orphaned cloud assets
    await cloudinary.uploader.destroy(attachment.publicId);
    await prisma.fileAttachment.delete({ where: { id: attachmentId } });

    return res.status(200).json({ message: "Attachment deleted" });
  } catch (error) {
    next(error);
  }
};
