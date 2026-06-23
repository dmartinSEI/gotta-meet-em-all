import Image from "next/image";
import Link from "next/link";
import { CATCH_LEVEL_ICONS, CATCH_LEVEL_LABELS } from "@/lib/xp";

export interface CatcherRow {
  id: number;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  level: 1 | 2 | 3;
}

const LEVEL_COLOR: Record<1 | 2 | 3, string> = {
  1: "#94a3b8",
  2: "#0ea5e9",
  3: "#f59e0b",
};

const LEVEL_BG: Record<1 | 2 | 3, string> = {
  1: "rgba(148,163,184,0.12)",
  2: "rgba(14,165,233,0.12)",
  3: "rgba(245,158,11,0.12)",
};

const DISPLAY_LIMIT = 24;

export default function CaughtBySection({ catchers }: { catchers: CatcherRow[] }) {
  const total = catchers.length;
  const shown = catchers.slice(0, DISPLAY_LIMIT);
  const overflow = total - DISPLAY_LIMIT;

  const byLevel = catchers.reduce<Record<1 | 2 | 3, number>>(
    (acc, c) => { acc[c.level]++; return acc; },
    { 1: 0, 2: 0, 3: 0 },
  );

  return (
    <div className="mb-8 pb-8 border-b" style={{ borderColor: "rgba(45,27,78,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40">
          Recognized by
        </p>
        {total > 0 && (
          <span className="text-xs tabular-nums" style={{ color: "rgba(45,27,78,0.40)" }}>
            {total} colleague{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm" style={{ color: "rgba(45,27,78,0.40)" }}>
          No one has caught your card yet. Once colleagues catch you, they&apos;ll appear here.
        </p>
      ) : (
        <>
          {/* Level breakdown */}
          <div className="flex flex-wrap gap-2 mb-5">
            {([1, 2, 3] as const).map((lvl) => byLevel[lvl] > 0 && (
              <span
                key={lvl}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: LEVEL_BG[lvl], color: LEVEL_COLOR[lvl] }}
              >
                <span>{CATCH_LEVEL_ICONS[lvl]}</span>
                <span>{byLevel[lvl]} {CATCH_LEVEL_LABELS[lvl]}</span>
              </span>
            ))}
          </div>

          {/* Avatar grid */}
          <div className="flex flex-wrap gap-2.5">
            {shown.map((catcher) => {
              const fullName = `${catcher.first_name} ${catcher.last_name}`;
              const initials = fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
              const ringColor = LEVEL_COLOR[catcher.level];

              return (
                <Link
                  key={catcher.id}
                  href={`/consultant/${catcher.id}`}
                  title={`${fullName} — ${CATCH_LEVEL_ICONS[catcher.level]} ${CATCH_LEVEL_LABELS[catcher.level]}`}
                  className="group relative shrink-0"
                  style={{ width: 44, height: 44 }}
                >
                  {/* Avatar circle */}
                  <div
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{
                      border: `2px solid ${ringColor}`,
                      boxShadow: `0 0 0 1px rgba(0,0,0,0.08)`,
                      position: "relative",
                      background: "#e2e8f0",
                    }}
                  >
                    {catcher.photo_url ? (
                      <Image
                        src={catcher.photo_url}
                        alt={fullName}
                        fill
                        sizes="44px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold"
                        style={{ fontSize: 14, background: "#2D1B4E" }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Level dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full text-[9px]"
                    style={{
                      width: 16, height: 16,
                      background: ringColor,
                      border: "1.5px solid white",
                      lineHeight: 1,
                    }}
                  >
                    {catcher.level}
                  </span>

                  {/* Hover tooltip */}
                  <span
                    className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                    style={{ fontSize: 10, fontWeight: 600, background: "rgba(15,23,42,0.88)", zIndex: 10 }}
                  >
                    {fullName}
                  </span>
                </Link>
              );
            })}

            {overflow > 0 && (
              <div
                className="shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  width: 44, height: 44,
                  background: "rgba(45,27,78,0.06)",
                  border: "2px solid rgba(45,27,78,0.12)",
                  color: "rgba(45,27,78,0.50)",
                }}
              >
                +{overflow}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
