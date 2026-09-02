"use client";

import { useEffect, useMemo, useState } from "react";
import AppButton from "../../../components/ui/AppButton";
import { AdminBackLink, AdminControls, AdminFilterSelect, EditIcon, IconButton, TrashIcon } from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import { FormField, SelectField, TextAreaField } from "../../../components/ui/FormField";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { Resource, resourcesApi } from "../../../services/resources";
import { XIcon } from "../../../components/ui/Icons";

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
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isAdding, setIsAdding] = useState(false);
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

  const cards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) =>
      (typeFilter === "ALL" || resource.type === typeFilter) &&
      (!query || [resource.title, resource.description, resource.type, resource.uploadedBy.firstName, resource.uploadedBy.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)),
    );
  }, [resources, search, typeFilter]);

  const openEdit = (resource: Resource) => {
    setIsAdding(false);
    setEditing(resource);
    setForm({
      title: resource.title,
      type: resource.type,
      url: resource.url,
      thumbnailUrl: resource.thumbnailUrl || "",
      description: resource.description || "",
    });
  };

  const openAdd = () => {
    setEditing(null);
    setIsAdding(true);
    setForm({ title: "", type: "ARTICLE", url: "", thumbnailUrl: "", description: "" });
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditing(null);
    setForm({ title: "", type: "ARTICLE", url: "", thumbnailUrl: "", description: "" });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing && !isAdding) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        url: form.url,
        thumbnailUrl: form.thumbnailUrl || null,
        description: form.description || undefined,
      };
      if (editing) {
        await resourcesApi.update(editing.id, payload);
        setMessage({ variant: "success", text: "Content updated." });
      } else {
        await resourcesApi.create({
          ...payload,
          thumbnailUrl: form.thumbnailUrl || undefined,
        });
        setMessage({ variant: "success", text: "Content uploaded." });
      }
      closeModal();
      loadResources();
    } catch {
      setMessage({ variant: "error", text: `Unable to ${editing ? "update" : "upload"} this content.` });
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
          <AppButton onClick={openAdd} variant="secondary">
            Upload New Content
          </AppButton>
        </div>
      </div>

      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}

      <AdminControls search={search} setSearch={setSearch} verb="Filter by">
        <AdminFilterSelect
          label="Filter content by type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { label: "All Content", value: "ALL" },
            { label: "Articles", value: "ARTICLE" },
            { label: "Videos", value: "VIDEO" },
            { label: "PDFs", value: "PDF" },
          ]}
        />
      </AdminControls>

      {(isAdding || editing) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0f2636]/45 px-4 py-8">
          <form onSubmit={handleSave} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-dashed border-[#b5d3ee] pb-5">
              <h2 className="text-3xl font-bold tracking-normal text-[#0a3d62]">
                {editing ? "Edit Content" : "Add New Content"}
              </h2>
              <button
                type="button"
                aria-label="Close content modal"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#ffb4b4] text-[#ff7a7a] hover:bg-[#fff0f0]"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.85fr)_1fr]">
              <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-[#b5d3ee] bg-[#f8fbfd] p-5 text-center">
                <svg aria-hidden="true" className="h-9 w-9 text-[#0a3d62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14" />
                </svg>
                <p className="mt-4 max-w-48 text-xs leading-5 text-[#707070]">Upload or paste the image of the content here</p>
                <FormField
                  label="Thumbnail URL"
                  name="thumbnailUrl"
                  type="url"
                  value={form.thumbnailUrl}
                  onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })}
                  placeholder="https://..."
                  className="mt-4"
                />
              </div>

              <div className="grid gap-5">
                <FormField label="Content Title" name="title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What's the title of the new content you want to upload" />
                <SelectField label="Choose Content Category" name="type" required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option value="ARTICLE">Article</option>
                  <option value="VIDEO">Video</option>
                  <option value="PDF">PDF</option>
                </SelectField>
                <FormField label="Content URL" name="url" type="url" required value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." />
                <TextAreaField label="Description" name="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short summary for parents and therapists" />
                <div>
                  <AppButton type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save Content" : "Upload Content"}</AppButton>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : cards.length === 0 ? (
        <div className="border border-[#b5d3ee] bg-white px-6 py-12 text-center text-sm font-medium text-[#536471]">
          No content found.
        </div>
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
