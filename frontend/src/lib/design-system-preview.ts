// Keep the component review route available only in local development, on both server and client.
export function isDesignSystemPreview(pathname: string) {
  return process.env.NODE_ENV === "development" && pathname === "/design-system"; // Never exempt this URL from authentication in a production build.
}
