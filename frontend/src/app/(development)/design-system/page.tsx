// Keep a server-render guard in addition to the production 404 enforced by proxy.ts.
import { notFound } from "next/navigation";
// Keep the interactive showcase outside the route directory.
import DesignSystemShowcase from "@/features/design-system/DesignSystemShowcase";
// Share the exact preview predicate with the client layout wrappers.
import { isDesignSystemPreview } from "@/lib/design-system-preview";

// This route is a local review surface and is never linked from the production product.
export default function DesignSystemPage() {
  if (!isDesignSystemPreview("/design-system")) notFound(); // Production requests must not expose the review surface.
  return <DesignSystemShowcase />; // Compose the page from the canonical shared controls.
}
