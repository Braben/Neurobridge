import { api } from "./api"; // Reuse the configured API prefix and deployment transport.
export type ContactRequest = { fullName: string; email: string; message: string; phone?: string; subject?: string }; // Match the validated public endpoint contract.
export const contactApi = { // Keep request transport separate from form state.
  async submit(payload: ContactRequest) { // Save one inquiry without implying email delivery.
    const { data } = await api.post<{ message: string; inquiry: { id: string; createdAt: string } }>("/contact", payload); // Await durable backend acceptance.
    return data; // Expose only the server receipt to the feature.
  }, // Finish inquiry submission.
}; // Finish the public contact client.
