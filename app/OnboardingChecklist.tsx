import { sql } from "@/lib/db";
import Link from "next/link";

const STEPS = [
  { key: "add_photo",          label: "Add Profile Picture",     href: "/profile" },
  { key: "add_card_bg",        label: "Add Card Background",     href: "/profile" },
  { key: "update_card_info",   label: "Update your card info",   href: "/profile" },
  { key: "first_meet",         label: "Log your first Meet",     href: "/" },
  { key: "visit_leaderboard",  label: "Visit the Leaderboard",   href: "/leaderboard" },
] as const;

type StepKey = typeof STEPS[number]["key"];

export default async function OnboardingChecklist({ email }: { email: string }) {
  const { rows } = await sql<{
    user_id: number;
    add_photo: boolean;
    add_card_bg: boolean;
    update_card_info: boolean;
    first_meet: boolean;
    completed_keys: string[];
  }>`
    SELECT
      u.id AS user_id,
      (c.photo_url IS NOT NULL) AS add_photo,
      (c.card_bg_url IS NOT NULL) AS add_card_bg,
      (
        (c.bio IS NOT NULL AND c.bio != '')
        OR (c.skills IS NOT NULL AND c.skills != '')
        OR c.preferred_comm IS NOT NULL
      ) AS update_card_info,
      EXISTS (SELECT 1 FROM catches ca WHERE ca.user_id = u.id) AS first_meet,
      COALESCE(
        ARRAY(SELECT step_key FROM onboarding_steps WHERE user_id = u.id),
        ARRAY[]::text[]
      ) AS completed_keys
    FROM users u
    LEFT JOIN consultants c ON c.email = u.email
    WHERE u.email = ${email}
  `;

  if (rows.length === 0) return null;

  const row = rows[0];
  const completedSet = new Set(row.completed_keys);

  const derived: Record<string, boolean> = {
    add_photo:         row.add_photo,
    add_card_bg:       row.add_card_bg,
    update_card_info:  row.update_card_info,
    first_meet:        row.first_meet,
    visit_leaderboard: completedSet.has("visit_leaderboard"),
  };

  // Award newly completed auto-derived steps (visit_leaderboard is set by the leaderboard page)
  for (const step of STEPS) {
    if (step.key === "visit_leaderboard") continue;
    if (derived[step.key] && !completedSet.has(step.key)) {
      await sql`
        INSERT INTO onboarding_steps (user_id, step_key)
        VALUES (${row.user_id}, ${step.key})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  const status: Record<StepKey, boolean> = {
    add_photo:         derived.add_photo        || completedSet.has("add_photo"),
    add_card_bg:       derived.add_card_bg       || completedSet.has("add_card_bg"),
    update_card_info:  derived.update_card_info  || completedSet.has("update_card_info"),
    first_meet:        derived.first_meet        || completedSet.has("first_meet"),
    visit_leaderboard: completedSet.has("visit_leaderboard"),
  };

  const doneCount = Object.values(status).filter(Boolean).length;
  if (doneCount === STEPS.length) return null;

  return (
    <div className="mb-6 rounded-2xl overflow-hidden bg-white" style={{
      border: "1.5px solid rgba(45,27,78,0.10)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3.5" style={{ borderBottom: "1px solid rgba(45,27,78,0.07)" }}>
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-0.5" style={{ color: "rgba(45,27,78,0.38)" }}>
              Getting Started
            </p>
            <p className="text-sm font-black text-[#2D1B4E]">
              Complete your profile · earn {STEPS.length * 5} pts
            </p>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: "rgba(45,27,78,0.38)" }}>
            {doneCount}/{STEPS.length}
          </span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(45,27,78,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(doneCount / STEPS.length) * 100}%`,
              background: doneCount === STEPS.length ? "#22c55e" : "#C8102E",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 py-1">
        {STEPS.map((step, i) => {
          const done = status[step.key as StepKey];
          return (
            <div
              key={step.key}
              className="flex items-center gap-3 py-2.5"
              style={i < STEPS.length - 1 ? { borderBottom: "1px solid rgba(45,27,78,0.05)" } : undefined}
            >
              {/* Check circle */}
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...(done
                  ? { background: "#22c55e" }
                  : { border: "2px solid rgba(45,27,78,0.18)" }
                ),
              }}>
                {done && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Label */}
              <p className="flex-1 text-sm font-medium" style={{
                color: done ? "rgba(45,27,78,0.35)" : "#2D1B4E",
                textDecoration: done ? "line-through" : "none",
              }}>
                {step.label}
              </p>

              {/* Right side */}
              {done ? (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#16a34a",
                  background: "rgba(34,197,94,0.10)",
                  padding: "2px 8px", borderRadius: 99,
                }}>
                  +5 pts
                </span>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(45,27,78,0.28)" }}>
                    +5 pts
                  </span>
                  <Link
                    href={step.href}
                    className="text-xs font-semibold transition-colors hover:opacity-70"
                    style={{ color: "#C8102E" }}
                  >
                    Go →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
