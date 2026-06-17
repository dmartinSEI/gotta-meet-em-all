import Image from "next/image";
import type { BountyRow } from "@/lib/bounty";
import { daysLeftInMonth } from "@/lib/bounty";

interface Props {
  bounty: BountyRow;
}

export default function BountyCard({ bounty }: Props) {
  const daysLeft = daysLeftInMonth();
  const fullName = `${bounty.first_name} ${bounty.last_name}`;
  const isComplete = bounty.completed_at !== null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 mb-8 flex gap-5 items-center ${
        isComplete
          ? "bg-emerald-50 border-emerald-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      {/* Decorative background text */}
      <span
        className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 text-8xl font-black opacity-5"
        aria-hidden
      >
        {isComplete ? "✓" : "?"}
      </span>

      {/* Photo */}
      <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-offset-2 ring-offset-transparent">
        <div
          className={`absolute inset-0 rounded-full ring-2 ${
            isComplete ? "ring-emerald-400" : "ring-amber-400"
          }`}
        />
        {isComplete ? (
          bounty.photo_url ? (
            <Image src={bounty.photo_url} alt={fullName} fill sizes="64px" className="object-cover object-top" />
          ) : (
            <InitialsAvatar name={fullName} isComplete />
          )
        ) : (
          <div className="w-full h-full bg-amber-200 flex items-center justify-center">
            <span className="text-amber-600 text-2xl font-bold">?</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              isComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            Monthly Bounty
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isComplete
                ? "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            +{bounty.bonus_xp} XP
          </span>
        </div>

        {isComplete ? (
          <>
            <p className="font-bold text-emerald-800 leading-tight">{fullName}</p>
            {bounty.office && <p className="text-xs text-emerald-600">{bounty.office}</p>}
            <p className="text-sm text-emerald-700 font-medium mt-1">Bounty complete! +{bounty.bonus_xp} XP earned.</p>
          </>
        ) : (
          <>
            <p className="font-bold text-amber-900 leading-tight">Meet {fullName}</p>
            {bounty.office && <p className="text-xs text-amber-700">{bounty.office}</p>}
            <p className="text-xs text-amber-600 mt-1">
              {daysLeft > 1
                ? `${daysLeft} days left this month`
                : daysLeft === 1
                ? "Last day — don't miss out!"
                : "Bounty expires today!"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function InitialsAvatar({ name, isComplete }: { name: string; isComplete: boolean }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const color = isComplete
    ? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
    : "bg-amber-300";
  return (
    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${color}`}>
      {initials}
    </div>
  );
}
