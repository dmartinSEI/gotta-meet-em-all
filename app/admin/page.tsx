import { redirect } from "next/navigation";
import { auth } from "../../auth";
import UploadForm from "./UploadForm";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin?callbackUrl=/admin");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email)) redirect("/");

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Admin</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Upload an Excel file to import or update the consultant roster. Existing consultants are
        updated by email; new ones are added.
      </p>
      <UploadForm />
    </main>
  );
}
