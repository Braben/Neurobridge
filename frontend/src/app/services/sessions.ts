import { api } from "./api";

export interface Session {
  id: string;
  childId: string;
  therapistId: string;
  sessionDate: string;
  duration: number | null;
  createdAt: string;
  note: { id: string; goalsWorkedOn: string; observations: string; recommendations: string } | null;
  child: { id: string; firstName: string; lastName: string };
  therapist: { id: string; firstName: string; lastName: string };
}

export interface SessionNoteData {
  goalsWorkedOn: string;
  observations: string;
  recommendations: string;
}

export const sessionsApi = {
  list: (childId?: string) =>
    api.get<{ sessions: Session[] }>("/sessions", { params: { childId } }).then((r) => r.data),

  get: (id: string) =>
    api.get<{ session: Session }>(`/sessions/${id}`).then((r) => r.data),

  create: (data: { childId: string; sessionDate: string; duration?: number | null }) =>
    api.post<{ session: Session }>("/sessions", data).then((r) => r.data),

  update: (id: string, data: { sessionDate?: string; duration?: number | null }) =>
    api.patch<{ session: Session }>(`/sessions/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/sessions/${id}`).then((r) => r.data),

  upsertNote: (id: string, data: SessionNoteData) =>
    api.put<{ note: { id: string; goalsWorkedOn: string; observations: string; recommendations: string } }>(`/sessions/${id}/notes`, data).then((r) => r.data),
};
