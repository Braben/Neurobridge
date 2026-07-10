"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { fetchChild, deleteChild } from "../../store/slices/childSlice";
import { uploadApi, FileAttachment } from "../../services/upload";

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { currentChild: child, isLoading, error } = useAppSelector((state) => state.child);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    dispatch(fetchChild(id));
  }, [isAuthenticated, id, router, dispatch]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this child? This cannot be undone.")) return;
    await dispatch(deleteChild(id));
    router.push("/children");
  };

  if (!user || !child) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-red-600">{error}</p>
          <Link href="/children" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-500">&larr; Back to Children</Link>
        </div>
      </div>
    );
  }

  // Phase 2: file attachment state — list of uploaded files, upload progress,
  // and a ref to the hidden file input element
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch existing attachments for this child on mount
  useEffect(() => {
    uploadApi.list({ childId: id }).then((d) => setAttachments(d.attachments)).catch(() => {});
  }, [id]);

  // Handle file upload: read the selected file from the input, upload via API,
  // then prepend the result to the local list for immediate UI feedback
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file, id);
      setAttachments((prev) => [res.attachment, ...prev]);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      // File upload failed silently — the user can retry
    } finally {
      setUploading(false);
    }
  };

  // Handle file deletion: remove from Cloudinary + DB, then update local state
  const handleDeleteFile = async (attachmentId: string) => {
    await uploadApi.delete(attachmentId);
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  // Navigation tabs — now includes Progress (charts) and Files (attachments)
  const navLinks = [
    { href: `/children/${id}/sessions`, label: "Sessions", count: child.sessions.length },
    { href: `/children/${id}/intake`, label: "Intake Form", active: !!child.intakeForm },
    { href: `/children/${id}#goals`, label: "Goals", count: child.goals.length },
    { href: `/children/${id}#behaviours`, label: "Behaviours", count: child.behaviours.length },
    { href: `/progress/${id}`, label: "Progress" },
    { href: `/children/${id}#files`, label: "Files", count: attachments.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/children" className="text-sm text-blue-600 hover:text-blue-500">&larr; Children</Link>
            <h1 className="text-xl font-bold text-gray-900">{child.firstName} {child.lastName}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/children/${child.id}/edit`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Edit</Link>
            <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
          </div>
        </div>
        {/* Feature Navigation */}
        <div className="border-t border-gray-200">
          <div className="mx-auto flex max-w-7xl gap-1 px-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  typeof link.active === "boolean" && link.active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}>
                {link.label}
                {"count" in link && link.count !== undefined && (
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{link.count}</span>
                )}
                {typeof link.active === "boolean" && (
                  <span className={`h-2 w-2 rounded-full ${link.active ? "bg-green-500" : "bg-gray-300"}`} />
                )}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Profile Card */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Profile</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs font-medium text-gray-500">Date of Birth</dt><dd className="text-sm text-gray-900">{new Date(child.dateOfBirth).toLocaleDateString()}</dd></div>
            <div><dt className="text-xs font-medium text-gray-500">Gender</dt><dd className="text-sm text-gray-900 capitalize">{child.gender.toLowerCase()}</dd></div>
            {child.diagnosis && <div><dt className="text-xs font-medium text-gray-500">Diagnosis</dt><dd className="text-sm text-gray-900">{child.diagnosis}</dd></div>}
            {child.school && <div><dt className="text-xs font-medium text-gray-500">School</dt><dd className="text-sm text-gray-900">{child.school}</dd></div>}
            {child.notes && <div className="sm:col-span-2"><dt className="text-xs font-medium text-gray-500">Notes</dt><dd className="text-sm text-gray-900">{child.notes}</dd></div>}
          </dl>
        </div>

        {/* Parents */}
        {child.parents.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Parents</h2>
            <div className="space-y-2">
              {child.parents.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.parent.firstName} {p.parent.lastName}</p>
                    <p className="text-xs text-gray-500">{p.parent.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{p.relationship || "Parent"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Therapists */}
        {child.therapists.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Therapists</h2>
            <div className="space-y-2">
              {child.therapists.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.therapist.firstName} {t.therapist.lastName}</p>
                    {t.therapist.areaofexpertise && <p className="text-xs text-gray-500">{t.therapist.areaofexpertise}</p>}
                  </div>
                  <span className="text-xs text-gray-400">Assigned {new Date(t.assignedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Section */}
        <div id="goals" className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
            <span className="text-xs text-gray-500">{child.goals.filter((g) => g.status === "ACHIEVED").length}/{child.goals.length} achieved</span>
          </div>
          {child.goals.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No goals set yet.</p>
          ) : (
            <div className="space-y-2">
              {child.goals.map((g) => (
                <div key={g.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-gray-900">{g.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      g.status === "ACHIEVED" ? "bg-green-100 text-green-700" :
                      g.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      g.status === "ARCHIVED" ? "bg-gray-100 text-gray-600" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{g.status.replace(/_/g, " ")}</span>
                  </div>
                  {g.description && <p className="mt-1 text-xs text-gray-500">{g.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <Link href={`/children/${id}/sessions`} className="text-sm text-blue-600 hover:text-blue-500">View all &rarr;</Link>
          </div>
          {child.sessions.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {child.sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-900">{new Date(s.sessionDate).toLocaleDateString()}</p>
                  {s.duration && <span className="text-xs text-gray-500">{s.duration} min</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Uploads Section — Phase 2: upload, list, and delete files */}
        <div id="files" className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Files</h2>
          {/* File picker + upload button */}
          <div className="flex items-center gap-2 mb-4">
            <input ref={fileRef} type="file" className="block text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
            <button onClick={handleUpload} disabled={uploading}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          {/* Attachment list — each entry is a clickable link + delete button */}
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No files uploaded.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div className="min-w-0 flex-1">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-500 truncate block">
                      {a.fileName}
                    </a>
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()} &middot; {a.mimeType}</p>
                  </div>
                  <button onClick={() => handleDeleteFile(a.id)} className="ml-2 text-xs text-red-600 hover:text-red-500">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Behaviours Section */}
        <div id="behaviours" className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Behaviours</h2>
          </div>
          {child.behaviours.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No behaviours tracked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {child.behaviours.map((b) => (
                <span key={b.id} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  {b.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
