// Upload API service — file attachment management via Cloudinary
// Handles uploading (multipart/form-data), listing, and deleting files.
// Files can be associated with a child and/or session for organisational context.
import { api } from "./api";

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
