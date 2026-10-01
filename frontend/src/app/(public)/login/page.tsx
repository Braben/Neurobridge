import LoginPage from "@/features/auth/LoginPage"; // Keep the public route thin and the interaction in its feature.

export default async function Login({ searchParams }: { searchParams: Promise<{ role?: string | string[] }> }) { // Read Next's asynchronous query parameters on the server.
  const { role } = await searchParams; // Resolve presentation intent without reading browser globals during hydration.
  const audience = role === "PARENT" || role === "THERAPIST" || role === "ADMIN" ? role : undefined; // Ignore unknown or repeated role values; never treat the query as authorization.
  return <LoginPage audience={audience} />; // Preserve the neutral shared login and both role-specific Figma headings.
} // Finish the route adapter.
