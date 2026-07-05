import { api } from "./api";

export interface Goal {
  id: string;
  childId: string;
  title: string;
  description: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "ARCHIVED";
  createdById: string;
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string; role: string };
}

export const goalsApi = {
  list: (childId: string) =>
    api.get<{ goals: Goal[] }>(`/goals/child/${childId}`).then((r) => r.data),

  create: (childId: string, data: { title: string; description: string }) =>
    api.post<{ goal: Goal }>(`/goals/child/${childId}`, data).then((r) => r.data),

  update: (id: string, data: { title?: string; description?: string; status?: string }) =>
    api.patch<{ goal: Goal }>(`/goals/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/goals/${id}`).then((r) => r.data),
};
