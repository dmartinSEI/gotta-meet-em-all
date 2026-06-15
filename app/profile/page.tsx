import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/profile");
  }

  const { rows } = await sql<{
    first_name: string;
    last_name: string;
    title: string;
    office: string;
    bio: string;
    skills: string;
  }>`
    SELECT first_name, last_name, title, office, bio, skills
    FROM consultants
    WHERE email = ${session.user.email}
  `;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </a>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      {rows.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800">
          <p className="font-semibold mb-1">Your email isn&apos;t in the consultant roster yet.</p>
          <p>Ask an admin to upload the roster with your email address included.</p>
        </div>
      ) : (
        <>
          <div className="mb-8 pb-8 border-b">
            <p className="text-xl font-semibold text-gray-900">
              {rows[0].first_name} {rows[0].last_name}
            </p>
            {rows[0].title && <p className="text-gray-500 mt-0.5">{rows[0].title}</p>}
            {rows[0].office && <p className="text-sm text-gray-400">{rows[0].office}</p>}
          </div>

          <ProfileForm initialBio={rows[0].bio ?? ""} initialSkills={rows[0].skills ?? ""} />
        </>
      )}
    </main>
  );
}
