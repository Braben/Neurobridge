// Progress API service — fetches aggregated child progress data for charts
// The backend returns a comprehensive snapshot including sessions, goals,
// behaviour trends, and summary statistics, all in a single request.
import { api } from "./api";

// Reuses the Goal shape defined by the backend for goal-status breakdowns
export interface Goal {
  id: string;
  childId: string;
  title: string;
  description: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "ARCHIVED";
  createdById: string;
  createdAt: string;
}

// A single behaviour's time-series frequency data for line charts
export interface BehaviourTrend {
  name: string;
  logs: { date: string; frequency: number }[];
}

// Top-level response shape returned by GET /api/v1/progress/:childId
export interface ChildProgress {
  child: { id: string; firstName: string; lastName: string };
  summary: {
    totalSessions: number;
    totalDuration: number;
    goalCounts: Record<string, number>;
  };
  sessions: { id: string; date: string; duration: number | null }[];
  goals: Goal[];
  behaviourTrends: BehaviourTrend[];
}

export const progressApi = {
  getChildProgress: (childId: string) =>
    api.get<ChildProgress>(`/progress/${childId}`).then((r) => r.data),
};
