// Cloudinary configuration for file uploads
// Provides both the configured Cloudinary SDK instance and a multer middleware
// wired to Cloudinary storage so route handlers can accept multipart file uploads
// and have them automatically stored in the cloud.
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

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
    allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "mp4", "webm"],
    resource_type: "auto",
  },
});

// Multer instance with Cloudinary storage and a 10 MB file-size cap.
// Route handlers can use upload.single("file") to accept a single file under
// the "file" field name.
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, upload };
