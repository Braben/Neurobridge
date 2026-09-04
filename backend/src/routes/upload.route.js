// File upload routes — multipart upload, list, and delete for attachments
// All endpoints require JWT authentication (verifyToken applied to the entire router).
// The POST route accepts multipart data, streams the file to Cloudinary, then
// lets the controller persist metadata.
const express = require("express");
const { uploadFile, listAttachments, deleteAttachment } = require("../modules/upload/upload.controller");
const { verifyToken } = require("../middleware/auth");
const { handleUploadError, upload, uploadToCloudinary } = require("../config/cloudinary");

const router = express.Router();

// Every route below requires a valid JWT
router.use(verifyToken);

// POST accepts multipart form-data with a single file field named "file".
// Multer parses the upload, Cloudinary stores it, then the controller saves the result.
router.post("/", upload.single("file"), handleUploadError, uploadToCloudinary, uploadFile);

// GET lists attachments filtered by query params (childId, sessionId)
router.get("/", listAttachments);

// DELETE removes a file from both Cloudinary and the database
router.delete("/:id", deleteAttachment);

module.exports = router;
