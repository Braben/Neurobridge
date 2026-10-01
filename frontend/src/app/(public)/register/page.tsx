import RegisterPage from "@/features/auth/RegisterPage";

type RegisterRole = "PARENT" | "THERAPIST";

export default async function Register({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const allowedRoles: RegisterRole[] = ["PARENT", "THERAPIST"];
  const initialRole = allowedRoles.includes(params?.role as RegisterRole)
    ? (params?.role as RegisterRole)
    : "PARENT";

  return <RegisterPage key={initialRole} initialRole={initialRole} />; // Reset audience-specific fields when the role query changes.
}
