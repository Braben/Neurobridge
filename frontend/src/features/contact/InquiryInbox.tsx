"use client"; // Keep admin inquiry filters and status updates interactive.
import { useEffect, useRef, useState } from "react"; // Discard stale page responses and lock updates.
import { api } from "@/app/services/api"; // Reuse authenticated requests and refresh handling.
import { apiErrorMessage } from "@/app/utils/apiError"; // Surface genuine backend failures.
import { AdminTable } from "@/app/components/admin/AdminChrome"; // Reuse the existing administrator table design.
type Status = "NEW" | "IN_PROGRESS" | "RESOLVED"; // Match the backend workflow enum.
type Inquiry = { id: string; fullName: string; email: string; phone: string | null; subject: string | null; message: string; status: Status; createdAt: string }; // Do not invent an authenticated platform role for public senders.
const statusLabels: Record<Status, string> = { NEW: "New", IN_PROGRESS: "In progress", RESOLVED: "Resolved" }; // Present readable labels for persisted states.
export default function InquiryInbox() { // List only the admin-authorized public inquiries.
  const [rows, setRows] = useState<Inquiry[]>([]); // Preserve the latest successfully fetched page.
  const [status, setStatus] = useState<Status | "">(""); // Filter on the server rather than across a partial page.
  const [page, setPage] = useState(1); // Request bounded pages of personal data.
  const [total, setTotal] = useState(0); // Determine whether another server page exists.
  const [loading, setLoading] = useState(true); // Distinguish pending reads from empty results.
  const [error, setError] = useState(""); // Preserve actionable read and write failures.
  const [updating, setUpdating] = useState<string | null>(null); // Lock writes while a status update is pending.
  const [revision, setRevision] = useState(0); // Refresh the current filter after a successful update or retry.
  const [expanded, setExpanded] = useState<string | null>(null); // Reveal complete messages without truncating stored content.
  const mutationLock = useRef(false); // Prevent two rapid status updates before React renders.
  useEffect(() => { // Fetch each filter/page with stale-response protection.
    let active = true; // Ignore a response after navigation or filter changes.
    api.get<{ inquiries: Inquiry[]; pagination: { total: number } }>("/admin/inquiries", { params: { page, limit: 25, ...(status ? { status } : {}) } }).then(({ data }) => { // Use the new admin-only contract.
      if (!active) return; // Ignore obsolete pages.
      setRows(data.inquiries); // Render the exact server records.
      setTotal(data.pagination.total); // Retain the server's filtered count.
      setError(""); // Clear an earlier read failure only after a successful response.
    }).catch((requestError) => { if (active) setError(apiErrorMessage(requestError, "Unable to load contact inquiries.")); }).finally(() => { if (active) setLoading(false); }); // Show failure instead of an empty-state lie.
    return () => { active = false; }; // Stop obsolete requests from mutating the displayed page.
  }, [page, status, revision]); // Refetch only when the requested dataset changes.
  async function update(inquiry: Inquiry, nextStatus: Status) { // Persist workflow status rather than changing only the table.
    if (mutationLock.current) return; // Reject overlapping edits.
    mutationLock.current = true; // Acquire the synchronous update lock.
    setUpdating(inquiry.id); // Disable selectors while the request is pending.
    setError(""); // Start an explicit update with clear feedback.
    try { // Keep the old persisted value after rejection.
      await api.patch(`/admin/inquiries/${inquiry.id}/status`, { status: nextStatus }); // Send only the allowed field.
      setLoading(true); // Refresh counts and filtered membership from the backend.
      setPage(1); // Avoid stranding the user on a now-empty later filtered page.
      setRevision((value) => value + 1); // Refetch even when the current page was already one.
    } catch (requestError) { // Preserve the old row on failed persistence.
      setError(apiErrorMessage(requestError, "Unable to update this inquiry.")); // Display the real rejection for a deliberate retry.
    } finally { // Always unlock status controls.
      mutationLock.current = false; // Release the synchronous guard.
      setUpdating(null); // Restore selectors after the write settles.
    } // Finish the write transaction.
  } // Finish inquiry status management.
  return <section className="space-y-5" aria-label="Contact inquiries"> {/* Keep public inquiries separate from private platform conversations. */}
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-medium">Contact Inquiries</h2><label className="flex items-center gap-3">Status<select aria-label="Filter inquiry status" disabled={Boolean(updating)} value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value as Status | ""); setPage(1); }} className="h-10 rounded-md border border-[#b5d3ee] bg-white px-3"><option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div> {/* Apply bounded server-side filtering. */}
    {error && <div role="alert" className="flex flex-wrap items-center gap-4 text-[#e53935]">{error}<button type="button" onClick={() => { setLoading(true); setRevision((value) => value + 1); }} className="underline">Retry</button></div>} {/* Keep failures recoverable without a page reload. */}
    {loading ? <p role="status">Loading inquiries...</p> : <AdminTable minWidth="1000px"><thead><tr><th className="px-4 py-4">Full Name</th><th className="px-4 py-4">Sender Email</th><th className="px-4 py-4">Subject</th><th className="px-4 py-4">Message</th><th className="px-4 py-4">Status</th></tr></thead><tbody>{rows.map((inquiry) => <tr key={inquiry.id}><td className="px-4 py-4 break-words">{inquiry.fullName}</td><td className="px-4 py-4 break-words"><a href={`mailto:${encodeURIComponent(inquiry.email)}`} className="text-[#008080] underline">{inquiry.email}</a></td><td className="px-4 py-4 break-words">{inquiry.subject || "Account support"}</td><td className="px-4 py-4"><button type="button" aria-expanded={expanded === inquiry.id} onClick={() => setExpanded((value) => value === inquiry.id ? null : inquiry.id)} className="text-left"><span className={expanded === inquiry.id ? "whitespace-pre-wrap break-words" : "line-clamp-2 break-words"}>{inquiry.message}</span></button></td><td className="px-4 py-4"><select aria-label={`Status for ${inquiry.fullName}`} disabled={Boolean(updating)} value={inquiry.status} onChange={(event) => void update(inquiry, event.target.value as Status)} className="h-10 max-w-full rounded-md border border-[#b5d3ee] bg-white px-2">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}{!rows.length && !error && <tr><td colSpan={5} className="px-4 py-8 text-center">No contact inquiries found.</td></tr>}</tbody></AdminTable>} {/* Render actual inquiries without assigning unverified platform identities. */}
    <nav aria-label="Inquiry pages" className="flex items-center justify-end gap-4"><button type="button" disabled={page === 1 || loading || Boolean(updating)} onClick={() => { setLoading(true); setPage((value) => value - 1); }} className="disabled:opacity-40">Previous</button><span>Page {page}</span><button type="button" disabled={page * 25 >= total || loading || Boolean(updating)} onClick={() => { setLoading(true); setPage((value) => value + 1); }} className="disabled:opacity-40">Next</button></nav> {/* Keep pagination bounded by the actual filtered result count. */}
  </section>; // Finish the inquiry workspace.
} // Finish the admin-only feature.
