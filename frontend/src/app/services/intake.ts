import { api } from "./api";

export interface IntakeForm {
  id: string;
  childId: string;
  developmentalHistory: string;
  behaviourConcerns: string;
  parentGoals: string;
}

export const intakeApi = {
  get: (childId: string) =>
    api.get<{ intake: IntakeForm | null }>(`/intake/${childId}`).then((r) => r.data),

  upsert: (childId: string, data: { developmentalHistory: string; behaviourConcerns: string; parentGoals: string }) =>
    api.put<{ intake: IntakeForm }>(`/intake/${childId}`, data).then((r) => r.data),
};
