"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "../../../../components/ui/AppButton";
import { AdminBackLink } from "../../../../components/admin/AdminChrome";
import { DashboardPanel } from "../../../../components/ui/DashboardCards";
import { FormField, SelectField, TextAreaField } from "../../../../components/ui/FormField";
import GlobalMessage from "../../../../components/ui/GlobalMessage";
import { resourcesApi } from "../../../../services/resources";

export default function AdminNewContentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ARTICLE");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await resourcesApi.create({
        title,
        description: description || undefined,
        type,
        url,
        thumbnailUrl: thumbnailUrl || undefined,
      });
      router.push("/admin/content");
    } catch {
      setError("Unable to create this content item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminBackLink href="/admin/content" />
      <h1 className="text-center text-3xl font-bold tracking-normal text-[#111111] sm:text-4xl">Content Management</h1>

      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      <DashboardPanel title="Add New Content" description="Publish a caregiver article, video, or PDF into the Neuro Bridge library.">
        <form onSubmit={handleSubmit} className="grid gap-6 rounded-md border border-[#b5d3ee] bg-white p-6 shadow-sm lg:grid-cols-[280px_1fr]">
          <div className="flex min-h-80 flex-col items-center justify-center rounded-md border border-[#b5d3ee] bg-[#f8fbfd] p-5 text-center">
            <svg aria-hidden="true" className="h-8 w-8 text-[#073f63]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14" />
            </svg>
            <p className="mt-5 text-sm text-[#707070]">Upload or paste the image URL of the content here</p>
            <FormField
              label="Thumbnail URL"
              name="thumbnailUrl"
              type="url"
              value={thumbnailUrl}
              onChange={(event) => setThumbnailUrl(event.target.value)}
              placeholder="https://..."
              className="mt-4"
            />
          </div>

          <div className="grid gap-5">
            <FormField
              label="Content Title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What's the title of the new content you want to upload"
              required
            />
            <SelectField
              label="Choose Content Category"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              required
            >
              <option value="ARTICLE">Article</option>
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF</option>
            </SelectField>
            <FormField
              label="Content URL"
              name="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              required
              type="url"
            />
            <TextAreaField
              label="Description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short summary for parents and therapists"
            />
            <div>
              <AppButton type="submit" disabled={isSaving}>
                {isSaving ? "Publishing..." : "Publish Content"}
              </AppButton>
            </div>
          </div>
        </form>
      </DashboardPanel>
    </div>
  );
}
