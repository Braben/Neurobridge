// Resources API service — CRUD operations for the resource library
// Resources are curated articles, videos, and PDFs that therapists and admins
// share with parents. All authenticated users can read; only ADMIN/THERAPIST
// can write (enforced server-side).
import { api } from "./api";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: "ARTICLE" | "VIDEO" | "PDF";
  url: string;
  thumbnailUrl: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: { id: string; firstName: string; lastName: string };
}

export const resourcesApi = {
  // GET /resources — list with optional type filter and title search
  list: (params?: { type?: string; search?: string }) =>
    api.get<{ resources: Resource[] }>("/resources", { params }).then((r) => r.data),

  // GET /resources/:id — single resource detail
  get: (id: string) =>
    api.get<{ resource: Resource }>(`/resources/${id}`).then((r) => r.data),

  // POST /resources — create new resource (ADMIN / THERAPIST only)
  create: (data: { title: string; description?: string; type: string; url: string; thumbnailUrl?: string }) =>
    api.post<{ message: string; resource: Resource }>("/resources", data).then((r) => r.data),

  // PUT /resources/:id — update existing resource (ADMIN / THERAPIST only)
  update: (id: string, data: { title?: string; description?: string; type?: string; url?: string; thumbnailUrl?: string | null }) =>
    api.put<{ message: string; resource: Resource }>(`/resources/${id}`, data).then((r) => r.data),

  // DELETE /resources/:id — permanently remove resource (ADMIN only)
  delete: (id: string) =>
    api.delete<{ message: string }>(`/resources/${id}`).then((r) => r.data),
};
