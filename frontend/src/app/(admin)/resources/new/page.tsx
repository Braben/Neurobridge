"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../hooks/useRedux";
import AppButton from "../../../components/ui/AppButton";
import { DashboardPanel, ScreenHeader } from "../../../components/ui/DashboardCards";
import { FormField, SelectField, TextAreaField } from "../../../components/ui/FormField";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { resourcesApi } from "../../../services/resources";

export default function NewResourcePage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("ARTICLE");
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const canManage = user?.role === "ADMIN" || user?.role === "THERAPIST";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage) return;

    setIsSaving(true);
    setError("");
    try {
      await resourcesApi.create({
        title,
        description: description || undefined,
        type,
        url,
      });
      router.push("/resources");
    } catch {
      setError("Unable to create this content item.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return <div className="text-sm text-[#536471]">Access denied.</div>;
  }

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Content management"
        title="Add New Content"
        description="Publish a caregiver resource into the Neuro Bridge library."
        action={
          <AppButton href="/resources" variant="ghost">
            Back
          </AppButton>
        }
      />

      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      <DashboardPanel title="Content Details" description="The item is saved through the backend resources API.">
        <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border border-[#d7e6f2] bg-white p-6 shadow-sm">
          <FormField
            label="Title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Daily communication practice"
            required
          />
          <SelectField
            label="Type"
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
            label="Resource URL"
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
        </form>
      </DashboardPanel>
    </div>
  );
}
