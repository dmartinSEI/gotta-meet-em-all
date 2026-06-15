"use client";

import { useEffect, useRef, useState } from "react";
import { catchConsultant, uncatchConsultant } from "./actions";

type Phase = "unmet" | "met" | "confirming";

export default function CatchButton({
  consultantId,
  initialCaught = false,
}: {
  consultantId: number;
  initialCaught?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(initialCaught ? "met" : "unmet");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function handleClick() {
    if (loading) return;

    if (phase === "unmet") {
      setLoading(true);
      const result = await catchConsultant(consultantId);
      if (result.success) setPhase("met");
      setLoading(false);

    } else if (phase === "met") {
      setPhase("confirming");
      timer.current = setTimeout(() => setPhase("met"), 3000);

    } else if (phase === "confirming") {
      if (timer.current) clearTimeout(timer.current);
      setLoading(true);
      const result = await uncatchConsultant(consultantId);
      if (result.success) setPhase("unmet");
      else setPhase("met");
      setLoading(false);
    }
  }

  const styles: Record<Phase, string> = {
    unmet:
      "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600",
    met: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    confirming: "bg-red-50 text-red-600 border-red-300 hover:bg-red-100",
  };

  const label = loading
    ? "…"
    : phase === "unmet"
    ? "Meet!"
    : phase === "met"
    ? "Met ✅"
    : "Undo?";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mt-auto w-full py-2 rounded-lg text-sm font-bold border transition-colors disabled:opacity-50 ${styles[phase]}`}
    >
      {label}
    </button>
  );
}
