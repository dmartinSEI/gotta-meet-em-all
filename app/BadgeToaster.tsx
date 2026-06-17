"use client";

import { useEffect, useState } from "react";
import type { BadgeInfo } from "@/lib/types";

export default function BadgeToaster() {
  const [toasts, setToasts] = useState<BadgeInfo[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      const badges = (e as CustomEvent<BadgeInfo[]>).detail;
      if (!badges?.length) return;
      setToasts(badges);
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setToasts([]), 400);
      }, 4500);
      return () => clearTimeout(t);
    }
    window.addEventListener("badge-earned", handler);
    return () => window.removeEventListener("badge-earned", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none"
      style={{
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      {toasts.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border border-amber-300"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          <span className="text-2xl leading-none">{badge.icon}</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-100 leading-none mb-0.5">
              Badge Unlocked!
            </p>
            <p className="text-white font-bold text-sm leading-none">{badge.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
