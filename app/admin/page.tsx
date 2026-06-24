import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../auth";
import { sql } from "@/lib/db";
import UploadForm from "./UploadForm";
import PhotoUploadForm from "./PhotoUploadForm";
import SurveyUploadForm from "./SurveyUploadForm";
import ConsultantManager, { type ConsultantRow } from "./ConsultantManager";
import PlayerManager, { type PlayerRow } from "./PlayerManager";

const TABS = [
  { id: "import",      label: "Import" },
  { id: "consultants", label: "Consultants" },
  { id: "players",     label: "Players" },
  { id: "export",      label: "Export" },
] as const;

type TabId = typeof TABS[number]["id"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin?callbackUrl=/admin");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email.toLowerCase())) redirect("/");

  const { tab: tabParam = "import" } = await searchParams;
  const tab: TabId = (["import", "consultants", "players", "export"] as string[]).includes(tabParam)
    ? (tabParam as TabId)
    : "import";

  let consultants: ConsultantRow[] = [];
  let players: PlayerRow[] = [];

  if (tab === "consultants") {
    const { rows } = await sql<ConsultantRow>`
      SELECT id, email, first_name, last_name,
             COALESCE(title,  '') AS title,
             COALESCE(office, '') AS office
      FROM consultants
      ORDER BY last_name, first_name
    `;
    consultants = rows;
  }

  if (tab === "players") {
    const { rows } = await sql<PlayerRow>`
      SELECT
        u.id::int                                                                                        AS user_id,
        u.email,
        c.first_name,
        c.last_name,
        COUNT(DISTINCT ca.id)::int                                                                       AS catch_count,
        COALESCE(SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END), 0)::int  AS total_xp,
        COUNT(DISTINCT ub.badge_id)::int                                                                AS badge_count
      FROM users u
      LEFT JOIN consultants c  ON c.email = u.email
      LEFT JOIN catches ca     ON ca.user_id = u.id
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      GROUP BY u.id, u.email, c.first_name, c.last_name
      ORDER BY total_xp DESC, u.email
    `;
    players = rows;
  }

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-[#2D1B4E]" style={{ color: "rgba(45,27,78,0.4)" }}>
            ← Home
          </Link>
        </div>
        <h1 className="text-2xl font-black text-[#2D1B4E]">Admin</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(45,27,78,0.45)" }}>
          God mode dashboard
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid rgba(45,27,78,0.1)" }}>
        {TABS.map(({ id, label }) => (
          <Link
            key={id}
            href={`/admin?tab=${id}`}
            className={`px-4 py-2 text-sm font-semibold rounded-t transition-colors ${
              tab === id
                ? "text-[#C8102E] -mb-px border-b-2 border-[#C8102E]"
                : "hover:text-[#2D1B4E]"
            }`}
            style={tab === id ? {} : { color: "rgba(45,27,78,0.45)" }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Import tab ── */}
      {tab === "import" && (
        <div className="flex flex-col gap-10 max-w-2xl">
          <section>
            <h2 className="text-base font-semibold text-[#2D1B4E] mb-1">Roster import</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(45,27,78,0.45)" }}>
              Upload an Excel file to import or update consultants. Existing records are updated by
              email; new ones are added.
            </p>
            <UploadForm />
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D1B4E] mb-1">Photo import</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(45,27,78,0.45)" }}>
              Name each file after the consultant&apos;s email address and upload them all at once —
              photos are matched automatically.
            </p>
            <PhotoUploadForm />
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#2D1B4E] mb-1">Survey import</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(45,27,78,0.45)" }}>
              Export from Microsoft Forms → Excel, then upload here. Data merges into each
              consultant&apos;s profile by email.
            </p>
            <SurveyUploadForm />
          </section>
        </div>
      )}

      {/* ── Consultants tab ── */}
      {tab === "consultants" && (
        <div>
          <p className="text-sm mb-4" style={{ color: "rgba(45,27,78,0.45)" }}>
            Add, edit, or delete consultant cards. Deleting a card also removes all incoming
            catches pointing to it.
          </p>
          <ConsultantManager consultants={consultants} />
        </div>
      )}

      {/* ── Players tab ── */}
      {tab === "players" && (
        <div>
          <p className="text-sm mb-4" style={{ color: "rgba(45,27,78,0.45)" }}>
            <strong className="font-semibold text-[#2D1B4E]">Reset</strong> wipes a player&apos;s
            catches, XP, and badges but keeps their login.{" "}
            <strong className="font-semibold text-[#2D1B4E]">Remove</strong> deletes their account
            entirely — their consultant card stays on the roster.
          </p>
          <PlayerManager players={players} />
        </div>
      )}

      {/* ── Export tab ── */}
      {tab === "export" && (
        <div className="max-w-2xl">
          <p className="text-sm mb-8" style={{ color: "rgba(45,27,78,0.45)" }}>
            Downloads a single Excel workbook with five sheets of leadership-ready data. No
            formatting needed — open and share as-is.
          </p>

          {/* Sheet previews */}
          <div className="flex flex-col gap-3 mb-8">
            {[
              {
                sheet: "Summary",
                desc: "High-level adoption, activity, and achievement KPIs at a glance — participation rate, total meets, cross-office connections, and badge totals.",
              },
              {
                sheet: "Player Rankings",
                desc: "Every signed-in employee ranked by XP, with their office, title, meet breakdown (Delivered / Hung Out / Connected), badge count, and last active date.",
              },
              {
                sheet: "By Office",
                desc: "Office-level participation rate, meet volume, average meets per player, delivered relationships, and cross-office connection count.",
              },
              {
                sheet: "Monthly Trends",
                desc: "Last 12 months of activity: meets logged and unique active players per month. Paste into a chart for an engagement trend line.",
              },
              {
                sheet: "Badge Stats",
                desc: "Every badge with earner count, percentage of active players who hold it, and first / most recent award dates.",
              },
            ].map(({ sheet, desc }) => (
              <div
                key={sheet}
                className="flex gap-4 rounded-xl p-4"
                style={{ border: "1px solid rgba(45,27,78,0.08)", background: "#fff" }}
              >
                <div
                  className="shrink-0 w-2 rounded-full self-stretch"
                  style={{ background: "#C8102E", opacity: 0.7 }}
                />
                <div>
                  <p className="text-sm font-semibold text-[#2D1B4E]">{sheet}</p>
                  <p className="text-sm mt-0.5" style={{ color: "rgba(45,27,78,0.5)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href="/api/admin/export"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm bg-[#2D1B4E] hover:bg-[#1a0f2e] transition-colors"
          >
            ↓ Download Leadership Report
          </a>
          <p className="text-xs mt-3" style={{ color: "rgba(45,27,78,0.35)" }}>
            Generates a fresh snapshot each time. Filename includes today&apos;s date.
          </p>
        </div>
      )}
    </main>
  );
}
