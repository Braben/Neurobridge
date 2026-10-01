import ContactPage from "@/features/contact/ContactPage"; // Keep presentation and request handling outside route files.
export default async function Contact({ searchParams }: { searchParams?: Promise<{ subject?: string }> }) { // Resolve Next's asynchronous query contract on the server.
  const params = await searchParams; // Read optional context from the recovery link.
  return <ContactPage subject={typeof params?.subject === "string" ? params.subject.slice(0, 200) : ""} />; // Bound untrusted query text to the API limit without rendering it as markup.
} // Finish the public route adapter.
