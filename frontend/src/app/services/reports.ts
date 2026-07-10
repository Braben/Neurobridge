const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api/v1";

export const reportsApi = {
  downloadReport: async (childId: string): Promise<Blob> => {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${API_BASE_URL}/reports/${childId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to generate report");
    return res.blob();
  },
};
