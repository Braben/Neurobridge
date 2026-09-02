import { redirect } from "next/navigation";

export default function AddAdminPage() {
  redirect("/admin/users?invite=admin");
}
