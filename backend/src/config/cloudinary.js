// Cloudinary configuration for file uploads
// Provides both the configured Cloudinary SDK instance and a multer middleware
// wired to Cloudinary storage so route handlers can accept multipart file uploads
// and have them automatically stored in the cloud.
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOADS = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
};

// Initialise the Cloudinary SDK with credentials from environment variables.
// These must be set in .env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary so uploaded files are stored under the
// "neurobridge" folder in Cloudinary. The resource_type is set to "auto" so
// Cloudinary automatically detects whether the file is an image, video, or raw.
// allowed_formats restricts what file types are accepted at the middleware level.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "neurobridge",
    allowed_formats: Object.values(ALLOWED_UPLOADS).flat(),
    resource_type: "auto",
  },
});

function fileFilter(_req, file, cb) {
  const allowedExtensions = ALLOWED_UPLOADS[file.mimetype];
  const extension = path.extname(file.originalname).replace(".", "").toLowerCase();

  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    const error = new Error("Unsupported file type. Upload an image, PDF, Word document, MP4, or WebM file.");
    error.statusCode = 400;
    return cb(error);
  }

  return cb(null, true);
}

function handleUploadError(error, _req, res, next) {
  if (!error) return next();

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File is too large. Maximum upload size is 10MB." });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
}

// Multer instance with MIME/extension checks and a 10 MB file-size cap.
// Route handlers can use upload.single("file") to accept a single file under
// the "file" field name.
const upload = multer({ fileFilter, storage, limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } });

module.exports = { cloudinary, handleUploadError, upload };
