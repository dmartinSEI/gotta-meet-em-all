import { redirect } from "next/navigation";
import { auth } from "../../auth";
import UploadForm from "./UploadForm";
import PhotoUploadForm from "./PhotoUploadForm";
import SurveyUploadForm from "./SurveyUploadForm";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin?callbackUrl=/admin");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email)) redirect("/");

  return (
    <main className="p-8 max-w-2xl flex flex-col gap-12">
      <div>
        <h1 className="text-2xl font-bold mb-1">Admin</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Manage the consultant roster and photos.
        </p>

        <h2 className="text-lg font-semibold mb-1">Roster import</h2>
        <p className="text-gray-500 mb-4 text-sm">
          Upload an Excel file to import or update consultants. Existing records are updated by
          email; new ones are added.
        </p>
        <UploadForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Photo import</h2>
        <p className="text-gray-500 mb-4 text-sm">
          Upload photos in bulk. Name each file after the consultant&apos;s email address and select
          them all at once — photos are matched to consultants automatically.
        </p>
        <PhotoUploadForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Survey import</h2>
        <p className="text-gray-500 mb-4 text-sm">
          Export responses from the Microsoft Forms survey to Excel (Forms → ⋯ → Export to Excel),
          then upload the file here. Data is merged into each consultant&apos;s profile by email —
          existing fields are updated, missing ones are left untouched.
        </p>
        <SurveyUploadForm />
      </div>
    </main>
  );
}
