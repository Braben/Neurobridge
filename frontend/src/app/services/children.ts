import { api } from "./api";

interface ChildTherapistAssignment {
  id: string;
  therapistId: string;
  assignedAt: string;
  therapist: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    areaofexpertise: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  diagnosis: string | null;
  coExistingConditions: string | null;
  currentMedications: string | null;
  profileImage: string | null;
  school: string | null;
  notes: string | null;
  supportMessage: string | null;
  createdAt: string;
  updatedAt: string;
  therapists?: ChildTherapistAssignment[];
}

export interface ChildDetail extends Child {
  parents: {
    id: string;
    parentId: string;
    relationship: string | null;
    parent: { id: string; firstName: string; lastName: string; email: string };
  }[];
  therapists: ChildTherapistAssignment[];
  intakeForm: null | {
    id: string;
    developmentalHistory: string;
    behaviourConcerns: string;
    parentGoals: string;
  };
  goals: {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }[];
  sessions: {
    id: string;
    sessionDate: string;
    duration: number | null;
  }[];
  behaviours: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

export interface CreateChildData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  diagnosis?: string;
  coExistingConditions?: string;
  currentMedications?: string;
  profileImage?: string;
  school?: string;
  notes?: string;
  supportMessage?: string;
}

export interface UpdateChildData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  diagnosis?: string | null;
  coExistingConditions?: string | null;
  currentMedications?: string | null;
  profileImage?: string | null;
  school?: string | null;
  notes?: string | null;
  supportMessage?: string | null;
}

export const childrenApi = {
  list: () => api.get<{ children: Child[] }>("/children").then((r) => r.data),

  get: (id: string) =>
    api.get<{ child: ChildDetail }>(`/children/${id}`).then((r) => r.data),

  create: (data: CreateChildData) =>
    api.post<{ message: string; child: Child }>("/children", data).then((r) => r.data),

  update: (id: string, data: UpdateChildData) =>
    api.patch<{ message: string; child: Child }>(`/children/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/children/${id}`).then((r) => r.data),

  assignTherapist: (childId: string, therapistId: string) =>
    api.post(`/children/${childId}/assign`, { therapistId }).then((r) => r.data),
};
