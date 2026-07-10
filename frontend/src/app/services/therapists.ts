// Therapists API service — public directory and individual profiles
// These endpoints are intentionally unauthenticated so that parents and
// visitors can browse therapist information without logging in.
import { api } from "./api";

export interface TherapistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  areaofexpertise: string | null;
  avatar: string | null;
  isApproved: boolean;
  createdAt: string;
  childCount: number;     // Number of children currently assigned
  sessionCount: number;   // Total sessions logged by this therapist
}

export const therapistsApi = {
  // GET /therapists — list all approved therapists
  list: () =>
    api.get<{ therapists: TherapistProfile[] }>("/therapists").then((r) => r.data),

  // GET /therapists/:id — single therapist public profile
  get: (id: string) =>
    api.get<{ therapist: TherapistProfile }>(`/therapists/${id}`).then((r) => r.data),
};
