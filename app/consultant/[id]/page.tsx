import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { sql } from "@/lib/db";
import { getRarity, RARITY_LABELS, RARITY_HEADER, type Rarity } from "@/lib/xp";
import { pickPhoto, officeImageSrc } from "@/lib/cards";
import { DOSSIER_SECTIONS, type SurveyData } from "@/lib/survey-fields";
import CatchButton from "../../CatchButton";
import BackLink from "./BackLink";
import type { ConsultantRow } from "@/lib/types";

const HEADER_RARITY: Record<Rarity, string> = {
  common:    "bg-white/10 text-white/80 border border-white/20",
  uncommon:  "bg-green-400/20 text-green-300 border border-green-400/40",
  rare:      "bg-blue-400/20 text-blue-300 border border-blue-400/40",
  epic:      "bg-purple-400/20 text-purple-200 border border-purple-400/40",
  legendary: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
};

const RARITY_RING: Record<Rarity, string> = {
  common:    "rgba(200,200,200,0.8)",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

interface ConsultantRecord extends ConsultantRow {
  survey_data: Record<string, string> | null;
}

export default async function ConsultantDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const consultantId = parseInt(id, 10);
  if (isNaN(consultantId)) redirect("/");

  const [{ rows }, { rows: xpRows }, { rows: rosterRows }] = await Promise.all([
    sql<ConsultantRecord>`
      SELECT
        c.id, c.email, c.first_name, c.last_name, c.title, c.office, c.bio, c.skills,
        c.photo_url, c.photo_url_l1, c.photo_url_l2, c.photo_url_l3,
        c.current_client, c.past_clients, c.preferred_comm,
        c.survey_data,
        (c.email = ${session.user.email}) AS is_own_card,
        (
          SELECT ca.level FROM catches ca
          JOIN users u ON u.id = ca.user_id
          WHERE ca.consultant_id = c.id AND u.email = ${session.user.email}
        ) AS catch_level,
        COALESCE(
          (SELECT json_agg(ub.badge_id ORDER BY ub.earned_at)
           FROM user_badges ub JOIN users cu ON cu.id = ub.user_id
           WHERE cu.email = c.email),
          '[]'::json
        ) AS badge_ids,
        (
          COALESCE((
            SELECT SUM(CASE ca2.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
            FROM catches ca2 JOIN users cu ON cu.id = ca2.user_id WHERE cu.email = c.email
          ), 0)
          + COALESCE((
            SELECT SUM(b.bonus_xp) FROM bounties b JOIN users cu ON cu.id = b.user_id
            WHERE cu.email = c.email AND b.completed_at IS NOT NULL
          ), 0)
        )::int AS consultant_xp
      FROM consultants c
      WHERE c.id = ${consultantId}
    `,
    sql`
      SELECT
        COALESCE((
          SELECT SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
          FROM catches ca WHERE ca.user_id = u.id
        ), 0)::int
        + COALESCE((
          SELECT SUM(b.bonus_xp) FROM bounties b
          WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
        ), 0)::int AS total_xp
      FROM users u WHERE u.email = ${session.user.email}
    `,
    sql`SELECT COUNT(*)::int AS n FROM consultants`,
  ]);

  if (rows.length === 0) redirect("/");

  const consultant    = rows[0];
  const viewerXp      = (xpRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;
  const rosterSize    = (rosterRows[0] as { n: number } | undefined)?.n ?? 0;
  const viewerRarity  = getRarity(viewerXp, rosterSize);
  const subjectRarity = getRarity(consultant.consultant_xp, rosterSize);

  const fullName      = `${consultant.first_name} ${consultant.last_name}`;
  const photo         = pickPhoto(consultant);
  const ringColor     = RARITY_RING[subjectRarity];
  const surveyData    = consultant.survey_data as SurveyData | null;

  const officeImageUrl = officeImageSrc(consultant.office);

  const populatedSections = DOSSIER_SECTIONS
    .map(section => ({
      ...section,
      fields: section.fields.filter(f => surveyData?.[f.key]),
    }))
    .filter(s => s.fields.length > 0);

  return (
    <div className="min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="relative bg-[#2D1B4E] overflow-hidden">
        <svg className="absolute right-0 top-0 h-full w-80 opacity-[0.12]"
             viewBox="0 0 320 80" preserveAspectRatio="xMaxYMid meet" aria-hidden>
          {[35, 65, 95, 125, 155, 185, 215, 250].map(r => (
            <circle key={r} cx="320" cy="40" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
          ))}
        </svg>
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <Link href="/" className="text-white font-black text-lg leading-none tracking-tight whitespace-nowrap hover:text-white/80 transition-colors">
              SEI Gotta Meet Em&apos; All
            </Link>
          </div>
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{viewerXp} XP</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[viewerRarity]}`}>
                {RARITY_LABELS[viewerRarity]}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-4 bg-white/20" />
              <nav className="flex items-center gap-4 flex-wrap">
                <Link href="/" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">Offices</Link>
                <Link href="/leaderboard" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">Leaderboard</Link>
                <Link href="/collection" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">My Collection</Link>
                <Link href="/profile" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">My Profile</Link>
                <form action={async () => { "use server"; await signOut(); }}>
                  <button className="text-white/35 hover:text-white/65 text-sm transition-colors">Sign out</button>
                </form>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: RARITY_HEADER[subjectRarity],
          ...(officeImageUrl ? {
            backgroundImage: `url(${officeImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : {}),
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />
        <div className="relative max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">

          {/* Circle photo */}
          <div style={{
            width: 100, height: 100, flexShrink: 0,
            borderRadius: "50%", overflow: "hidden",
            border: `4px solid ${ringColor}`,
            boxShadow: "0 0 0 4px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.60)",
            position: "relative", background: "#2D1B4E",
          }}>
            {photo ? (
              <Image src={photo} alt={fullName} fill sizes="100px" className="object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl"
                   style={{ background: RARITY_HEADER[subjectRarity] }}>
                {fullName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-white font-black text-2xl md:text-3xl leading-tight">{fullName}</p>
            {consultant.title  && <p className="text-white/65 mt-1 text-sm">{consultant.title}</p>}
            {consultant.office && <p className="text-white/40 mt-0.5 text-xs">{consultant.office}</p>}
            <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
              <span className="text-white/50 text-xs tabular-nums">{consultant.consultant_xp} XP</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[subjectRarity]}`}>
                {RARITY_LABELS[subjectRarity]}
              </span>
            </div>
            {consultant.bio && (
              <p className="text-white/60 text-sm mt-3 leading-relaxed max-w-lg">{consultant.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Sub-bar: back + catch ───────────────────────────────────── */}
      <div className="bg-white border-b" style={{ borderColor: "rgba(45,27,78,0.08)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <BackLink />
          {!consultant.is_own_card && (
            <div style={{ width: 260 }}>
              <CatchButton
                consultantId={consultant.id}
                initialLevel={consultant.catch_level as 1 | 2 | 3 | null}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Survey sections ────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {populatedSections.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "rgba(45,27,78,0.40)" }}>
              {consultant.first_name} hasn&apos;t completed the interest survey yet.
            </p>
          </div>
        ) : (
          populatedSections.map(section => (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg leading-none">{section.icon}</span>
                <h2 className="text-[9px] font-black tracking-[0.2em] uppercase"
                    style={{ color: "rgba(45,27,78,0.40)" }}>
                  {section.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.fields.map(field => {
                  const value = surveyData?.[field.key];
                  if (!value) return null;
                  return (
                    <div
                      key={field.key}
                      className="rounded-xl p-4"
                      style={{ background: "rgba(45,27,78,0.03)", border: "1px solid rgba(45,27,78,0.07)" }}
                    >
                      <p className="text-[9px] font-black tracking-[0.14em] uppercase mb-1.5"
                         style={{ color: "rgba(45,27,78,0.35)" }}>
                        {field.label}
                      </p>
                      {field.badge ? (
                        <span
                          className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: "rgba(45,27,78,0.08)", color: "#2D1B4E" }}
                        >
                          {value}
                        </span>
                      ) : (
                        <p className="text-sm text-[#2D1B4E] leading-relaxed">{value}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
