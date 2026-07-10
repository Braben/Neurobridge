// File upload routes — multipart upload, list, and delete for attachments
// All endpoints require JWT authentication (verifyToken applied to the entire router).
// The POST route uses the multer middleware (upload.single("file")) to accept and
// store the file in Cloudinary before the controller persists metadata.
const express = require("express");
const { uploadFile, listAttachments, deleteAttachment } = require("../modules/upload/upload.controller");
const { verifyToken } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Every route below requires a valid JWT
router.use(verifyToken);

// POST accepts multipart form-data with a single file field named "file".
// Multer processes the upload to Cloudinary; the controller saves the result.
router.post("/", upload.single("file"), uploadFile);

// GET lists attachments filtered by query params (childId, sessionId)
router.get("/", listAttachments);

// DELETE removes a file from both Cloudinary and the database
router.delete("/:id", deleteAttachment);

module.exports = router;
