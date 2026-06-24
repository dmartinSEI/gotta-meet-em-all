"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetUserProgress, removeUser } from "./actions";

export interface PlayerRow {
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  catch_count: number;
  total_xp: number;
  badge_count: number;
}

export default function PlayerManager({ players }: { players: PlayerRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [confirmReset, setConfirmReset] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    return name.includes(q) || p.email.toLowerCase().includes(q);
  });

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleReset(userId: number) {
    setError(null);
    const result = await resetUserProgress(userId);
    if (!result.success) { setError(result.error ?? "Failed"); return; }
    setConfirmReset(null);
    refresh();
  }

  async function handleRemove(userId: number) {
    setError(null);
    const result = await removeUser(userId);
    if (!result.success) { setError(result.error ?? "Failed"); return; }
    setConfirmRemove(null);
    refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm border rounded-lg px-3 py-2 text-[#2D1B4E] bg-white focus:outline-none focus:border-[#C8102E]"
          style={{ borderColor: "rgba(45,27,78,0.2)" }}
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-3 font-medium">{error}</p>}

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(45,27,78,0.12)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(45,27,78,0.04)", borderBottom: "1px solid rgba(45,27,78,0.1)" }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "rgba(45,27,78,0.45)" }}>
                Player
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "rgba(45,27,78,0.45)" }}>
                Catches
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "rgba(45,27,78,0.45)" }}>
                XP
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: "rgba(45,27,78,0.45)" }}>
                Badges
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: "rgba(45,27,78,0.3)" }}>
                  {search ? "No matches" : "No players yet"}
                </td>
              </tr>
            )}

            {filtered.map((p) => {
              const name =
                p.first_name || p.last_name
                  ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()
                  : null;

              return (
                <tr
                  key={p.user_id}
                  style={{ borderBottom: "1px solid rgba(45,27,78,0.07)" }}
                  className="transition-colors hover:bg-[rgba(45,27,78,0.015)]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#2D1B4E]">
                      {name ?? <span style={{ color: "rgba(45,27,78,0.3)", fontStyle: "italic" }}>No card</span>}
                    </p>
                    <p className="font-mono text-xs" style={{ color: "rgba(45,27,78,0.5)" }}>
                      {p.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ color: "rgba(45,27,78,0.65)" }}>
                    {p.catch_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ color: "rgba(45,27,78,0.65)" }}>
                    {p.total_xp.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums" style={{ color: "rgba(45,27,78,0.65)" }}>
                    {p.badge_count}
                  </td>
                  <td className="px-4 py-3">
                    {confirmReset === p.user_id ? (
                      <span className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-medium text-amber-600">Wipe progress?</span>
                        <button
                          onClick={() => handleReset(p.user_id)}
                          disabled={isPending}
                          className="text-xs font-semibold px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmReset(null)}
                          className="text-xs transition-colors hover:text-[#2D1B4E]"
                          style={{ color: "rgba(45,27,78,0.45)" }}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : confirmRemove === p.user_id ? (
                      <span className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-medium text-red-600">Remove login?</span>
                        <button
                          onClick={() => handleRemove(p.user_id)}
                          disabled={isPending}
                          className="text-xs font-semibold px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="text-xs transition-colors hover:text-[#2D1B4E]"
                          style={{ color: "rgba(45,27,78,0.45)" }}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => { setConfirmReset(p.user_id); setConfirmRemove(null); }}
                          className="text-xs font-medium text-amber-500 hover:text-amber-700 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => { setConfirmRemove(p.user_id); setConfirmReset(null); }}
                          className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-2" style={{ color: "rgba(45,27,78,0.3)" }}>
        {filtered.length} of {players.length} players
      </p>
    </div>
  );
}
