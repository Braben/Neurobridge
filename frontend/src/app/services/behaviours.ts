import { api } from "./api";

export interface Behaviour {
  id: string;
  childId: string;
  name: string;
  description: string | null;
  _count: { logs: number };
}

export interface BehaviourLog {
  id: string;
  behaviourId: string;
  frequency: number;
  notes: string | null;
  recordedAt: string;
}

export const behavioursApi = {
  list: (childId: string) =>
    api.get<{ behaviours: Behaviour[] }>(`/behaviours/child/${childId}`).then((r) => r.data),

  create: (childId: string, data: { name: string; description?: string }) =>
    api.post<{ behaviour: Behaviour }>(`/behaviours/child/${childId}`, data).then((r) => r.data),

  update: (id: string, data: { name?: string; description?: string | null }) =>
    api.patch<{ behaviour: Behaviour }>(`/behaviours/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/behaviours/${id}`).then((r) => r.data),

  listLogs: (id: string) =>
    api.get<{ logs: BehaviourLog[] }>(`/behaviours/${id}/logs`).then((r) => r.data),

  createLog: (id: string, data: { frequency: number; notes?: string; recordedAt: string }) =>
    api.post<{ log: BehaviourLog }>(`/behaviours/${id}/logs`, data).then((r) => r.data),
};
