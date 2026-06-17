import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import ProfileForm from "./ProfileForm";
import { ALL_BADGES } from "@/lib/badges";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/profile");
  }

  const [{ rows: consultantRows }, { rows: badgeRows }] = await Promise.all([
    sql<{
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
    `,
    sql<{ badge_id: string; earned_at: string }>`
      SELECT ub.badge_id, ub.earned_at
      FROM user_badges ub
      JOIN users u ON u.id = ub.user_id
      WHERE u.email = ${session.user.email}
      ORDER BY ub.earned_at ASC
    `,
  ]);

  const earnedMap = new Map(badgeRows.map((r) => [r.badge_id, r.earned_at]));

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </a>
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      {consultantRows.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800 mb-8">
          <p className="font-semibold mb-1">Your email isn&apos;t in the consultant roster yet.</p>
          <p>Ask an admin to upload the roster with your email address included.</p>
        </div>
      ) : (
        <>
          <div className="mb-8 pb-8 border-b">
            <p className="text-xl font-semibold text-gray-900">
              {consultantRows[0].first_name} {consultantRows[0].last_name}
            </p>
            {consultantRows[0].title && <p className="text-gray-500 mt-0.5">{consultantRows[0].title}</p>}
            {consultantRows[0].office && <p className="text-sm text-gray-400">{consultantRows[0].office}</p>}
          </div>

          <ProfileForm initialBio={consultantRows[0].bio ?? ""} initialSkills={consultantRows[0].skills ?? ""} />
        </>
      )}

      {/* Badges */}
      <div className="mt-10 pt-8 border-t">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Achievements</h2>
          <span className="text-sm text-gray-400">
            {earnedMap.size} / {ALL_BADGES.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ALL_BADGES.map((badge) => {
            const earnedAt = earnedMap.get(badge.id);
            const earned = earnedAt !== undefined;
            return (
              <div
                key={badge.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  earned
                    ? "bg-amber-50 border-amber-200"
                    : "bg-gray-50 border-gray-100 opacity-50"
                }`}
              >
                <span className={`text-2xl leading-none mt-0.5 ${earned ? "" : "grayscale"}`}>
                  {badge.icon}
                </span>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm leading-tight ${earned ? "text-gray-900" : "text-gray-400"}`}>
                    {badge.name}
                  </p>
                  <p className={`text-xs mt-0.5 leading-snug ${earned ? "text-amber-700" : "text-gray-400"}`}>
                    {badge.description}
                  </p>
                  {earned && earnedAt && (
                    <p className="text-[10px] text-amber-500 mt-1">
                      Earned {new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
