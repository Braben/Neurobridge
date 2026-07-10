"use client";

// Resource Library Page — browse, search, and filter curated resources
// Resources are articles, videos, and PDFs uploaded by therapists and admins.
// The page provides a search input (free-text against title) and a type filter
// dropdown. Resources open in a new tab via target="_blank".
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import { resourcesApi, Resource } from "../services/resources";

// Tailwind colour classes mapped to each resource type for visual distinction
const TYPE_COLORS: Record<string, string> = {
  ARTICLE: "bg-blue-100 text-blue-700",
  VIDEO: "bg-purple-100 text-purple-700",
  PDF: "bg-green-100 text-green-700",
};

export default function ResourcesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  // Fetch resources on mount and whenever the type filter changes.
  // Search is triggered manually via the form submit to avoid excessive API calls.
  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    loadResources();
  }, [isAuthenticated, router, filter]);

  const loadResources = () => {
    setLoading(true);
    resourcesApi.list({ type: filter || undefined, search: search || undefined }).then((d) => {
      setResources(d.resources);
    }).finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadResources();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Resource Library</h1>

      {/* Search bar + type filter in a responsive row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Search
          </button>
        </form>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="ARTICLE">Articles</option>
          <option value="VIDEO">Videos</option>
          <option value="PDF">PDFs</option>
        </select>
      </div>

      {/* Loading spinner */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : resources.length === 0 ? (
        // Empty state
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-500">No resources found.</p>
        </div>
      ) : (
        // Resource grid — responsive: 1 col mobile, 2 tablet, 3 desktop
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[r.type]}`}>
                {r.type}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-gray-900 line-clamp-2">{r.title}</h3>
              {r.description && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-3">{r.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                by {r.uploadedBy.firstName} {r.uploadedBy.lastName} &middot; {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
