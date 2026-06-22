"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "Offices",
    href: "/",
    match: (p: string) => p === "/" || p.startsWith("/office"),
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    match: (p: string) => p.startsWith("/leaderboard"),
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20v-7M12 20V4M18 20v-4" />
      </svg>
    ),
  },
  {
    label: "Collection",
    href: "/collection",
    match: (p: string) => p.startsWith("/collection"),
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="13" height="17" rx="2" />
        <path d="M7 2h13a2 2 0 0 1 2 2v13" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    match: (p: string) => p.startsWith("/profile"),
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-3.8 3.6-7 8-7s8 3.2 8 7" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid"
      style={{
        gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
        background: "#2D1B4E",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(({ label, href, match, icon }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
            style={{ color: active ? "#fff" : "rgba(255,255,255,0.40)" }}
          >
            {active && (
              <span
                className="absolute top-0 rounded-full"
                style={{ left: "50%", transform: "translateX(-50%)", width: 32, height: 2, background: "#C8102E" }}
              />
            )}
            {icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1 }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
