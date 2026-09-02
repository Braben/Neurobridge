"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../hooks/useRedux";
import { resourcesApi, Resource } from "../../services/resources";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, FilterPanel, LoadingState, ScreenHeader, StatusBadge } from "../../components/ui/DashboardCards";
import { FormField, SelectField } from "../../components/ui/FormField";

const TYPE_TONES: Record<Resource["type"], "blue" | "green" | "teal"> = {
  ARTICLE: "blue",
  VIDEO: "teal",
  PDF: "green",
};

export default function ResourcesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    resourcesApi
      .list({ type: filter || undefined, search: submittedSearch || undefined })
      .then((d) => setResources(d.resources))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router, filter, submittedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmittedSearch(search);
  };

  if (!user) return null;

  const canManage = user.role === "ADMIN" || user.role === "THERAPIST";

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Resource library"
        title="Content Management"
        description="Browse caregiver articles, videos, and downloadable guides. Admins and therapists can curate the library through the backend resources API."
        action={
          canManage && (
            <AppButton href="/resources/new" variant="secondary">
              Add Content
            </AppButton>
          )
        }
      />

      <FilterPanel>
        <form onSubmit={handleSearch} className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto]">
          <FormField
            label="Search"
            name="resourceSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or topic"
            className="h-12 rounded-xl"
          />
          <AppButton type="submit" className="self-end" size="md">
            Search
          </AppButton>
        </form>
        <div className="w-full sm:w-48">
          <SelectField
            label="Type"
            name="resourceType"
            value={filter}
            onChange={(e) => {
              setLoading(true);
              setFilter(e.target.value);
            }}
            className="h-12 rounded-xl"
          >
            <option value="">All Types</option>
            <option value="ARTICLE">Articles</option>
            <option value="VIDEO">Videos</option>
            <option value="PDF">PDFs</option>
          </SelectField>
        </div>
      </FilterPanel>

      <DashboardPanel title="Published Resources" description={`${resources.length} item${resources.length === 1 ? "" : "s"} available`}>
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <LoadingState />
          ) : resources.length === 0 ? (
            <EmptyState title="No resources found" message="Published content will appear here once it is added." />
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-data-table w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Uploaded By</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f8]">
                  {resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-[#f8fbfd]">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#111827]">{resource.title}</p>
                        {resource.description && (
                          <p className="mt-1 line-clamp-2 max-w-xl text-xs text-[#536471]">{resource.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={TYPE_TONES[resource.type]}>{resource.type}</StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-[#536471]">
                        {resource.uploadedBy.firstName} {resource.uploadedBy.lastName}
                      </td>
                      <td className="px-6 py-4 text-[#536471]">{new Date(resource.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0078d4] hover:underline">
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
