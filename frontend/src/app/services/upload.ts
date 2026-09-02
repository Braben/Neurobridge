// Upload API service — file attachment management via Cloudinary
// Handles uploading (multipart/form-data), listing, and deleting files.
// Files can be associated with a child and/or session for organisational context.
import { api } from "./api";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
]);

export function validateUploadFile(file: File) {
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return "Unsupported file type. Upload an image, PDF, Word document, MP4, or WebM file.";
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "File is too large. Maximum upload size is 10MB.";
  }
  return null;
}

export interface FileAttachment {
  id: string;
  childId: string | null;
  sessionId: string | null;
  fileName: string;
  url: string;              // Cloudinary URL for viewing/downloading
  publicId: string;         // Cloudinary public ID (needed for deletion)
  mimeType: string;
  size: number | null;
  uploadedById: string;
  createdAt: string;
}

export const uploadApi = {
  // POST /upload — multipart upload (uses FormData; no Content-Type header needed)
  upload: (file: File, childId?: string, sessionId?: string) => {
    const validationError = validateUploadFile(file);
    if (validationError) return Promise.reject(new Error(validationError));

    const formData = new FormData();
    formData.append("file", file);
    if (childId) formData.append("childId", childId);
    if (sessionId) formData.append("sessionId", sessionId);
    return api.post<{ message: string; attachment: FileAttachment }>("/upload", formData).then((r) => r.data);
  },

  // GET /upload — list attachments, optionally filtered by childId / sessionId
  list: (params?: { childId?: string; sessionId?: string }) =>
    api.get<{ attachments: FileAttachment[] }>("/upload", { params }).then((r) => r.data),

  // DELETE /upload/:id — remove from Cloudinary and database (owner only)
  delete: (id: string) =>
    api.delete<{ message: string }>(`/upload/${id}`).then((r) => r.data),
};
