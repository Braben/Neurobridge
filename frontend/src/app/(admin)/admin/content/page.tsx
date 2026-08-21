"use client";

import { useEffect, useMemo, useState } from "react";
import AppButton from "../../../components/ui/AppButton";
import { AdminBackLink, EditIcon, IconButton, TrashIcon } from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import { FormField, SelectField, TextAreaField } from "../../../components/ui/FormField";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { Resource, resourcesApi } from "../../../services/resources";

const fallbackImages = [
  "/design-assets/children-classroom.jpg",
  "/design-assets/therapy-room.jpg",
  "/design-assets/child-portrait.jpg",
];

function PlayIcon() {
  return (
    <span className="inline-flex h-12 w-16 items-center justify-center rounded-xl bg-white text-[#111111] shadow-sm">
      <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7-11-7Z" />
      </svg>
    </span>
  );
}

export default function AdminContentPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "ARTICLE",
    url: "",
    thumbnailUrl: "",
    description: "",
  });

  const loadResources = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    resourcesApi
      .list()
      .then((data) => setResources(data.resources))
      .catch(() => setMessage({ variant: "error", text: "Unable to load content." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    resourcesApi
      .list()
      .then((data) => {
        if (active) setResources(data.resources);
      })
      .catch(() => {
        if (active) setMessage({ variant: "error", text: "Unable to load content." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => resources, [resources]);

  const openEdit = (resource: Resource) => {
    setEditing(resource);
    setForm({
      title: resource.title,
      type: resource.type,
      url: resource.url,
      thumbnailUrl: resource.thumbnailUrl || "",
      description: resource.description || "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm({ title: "", type: "ARTICLE", url: "", thumbnailUrl: "", description: "" });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await resourcesApi.update(editing.id, {
        title: form.title,
        type: form.type,
        url: form.url,
        thumbnailUrl: form.thumbnailUrl || null,
        description: form.description || undefined,
      });
      setMessage({ variant: "success", text: "Content updated." });
      closeEdit();
      loadResources();
    } catch {
      setMessage({ variant: "error", text: "Unable to update this content." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;
    try {
      await resourcesApi.delete(resource.id);
      setResources((items) => items.filter((item) => item.id !== resource.id));
      setMessage({ variant: "success", text: "Content deleted." });
    } catch {
      setMessage({ variant: "error", text: "Unable to delete this content." });
    }
  };

  return (
    <div className="space-y-8">
      <AdminBackLink />
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div />
        <h1 className="text-center text-3xl font-bold tracking-normal text-[#111111] sm:text-4xl">Content Management</h1>
        <div className="flex justify-start md:justify-end">
          <AppButton href="/admin/content/new" variant="secondary">
            Upload New Content
          </AppButton>
        </div>
      </div>

      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}

      {editing && (
        <form onSubmit={handleSave} className="grid gap-5 rounded-md border border-[#b5d3ee] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#073f63]">Edit Content</h2>
            <AppButton variant="ghost" onClick={closeEdit}>Close</AppButton>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label="Content Title" name="title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <SelectField label="Choose Content Category" name="type" required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="ARTICLE">Article</option>
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF</option>
            </SelectField>
            <FormField label="Content URL" name="url" type="url" required value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
            <FormField label="Thumbnail URL" name="thumbnailUrl" type="url" value={form.thumbnailUrl} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} />
          </div>
          <TextAreaField label="Description" name="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div>
            <AppButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Content"}</AppButton>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((resource, index) => {
            const image = resource.thumbnailUrl || fallbackImages[index % fallbackImages.length];
            return (
              <article key={resource.id} className="overflow-hidden rounded-md border border-[#b5d3ee] bg-white shadow-sm">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex aspect-[16/8.4] items-center justify-center bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.42)), url('${image}')` }}
                >
                  {resource.type === "VIDEO" && <PlayIcon />}
                </a>
                <div className="flex min-h-24 items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-lg font-medium leading-7 text-[#111111]">{resource.title}</p>
                    <p className="mt-1 text-xs font-semibold text-[#0078d4]">{resource.type}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconButton label={`Edit ${resource.title}`} onClick={() => openEdit(resource)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton label={`Delete ${resource.title}`} tone="danger" onClick={() => handleDelete(resource)}>
                      <TrashIcon />
                    </IconButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
