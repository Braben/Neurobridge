import RegisterPage from "../features/auth/RegisterPage";

type RegisterRole = "ADMIN" | "PARENT" | "THERAPIST";

export default async function Register({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const allowedRoles: RegisterRole[] = ["ADMIN", "PARENT", "THERAPIST"];
  const initialRole = allowedRoles.includes(params?.role as RegisterRole)
    ? (params?.role as RegisterRole)
    : "PARENT";

  return <RegisterPage initialRole={initialRole} />;
}
