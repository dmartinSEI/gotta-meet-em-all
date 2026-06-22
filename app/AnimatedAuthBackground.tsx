"use client";

import { useEffect, useRef } from "react";

// Radii chosen so the outermost ring (505px) comfortably fills a 1080p viewport
// while the inner rings stay visually tight around the center content.
const RADII = [68, 128, 196, 268, 344, 424, 505];

export default function AnimatedAuthBackground({ children }: { children: React.ReactNode }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number;
    let currX = 0, currY = 0, tgtX = 0, tgtY = 0;

    function onMove(e: MouseEvent) {
      // Normalize mouse to ±28px range — subtle drift, not distracting
      tgtX = (e.clientX / window.innerWidth  - 0.5) * 56;
      tgtY = (e.clientY / window.innerHeight - 0.5) * 56;
    }

    function tick() {
      // Lerp toward target — factor 0.045 ≈ 370ms to settle, feels like floating
      currX += (tgtX - currX) * 0.045;
      currY += (tgtY - currY) * 0.045;
      if (layerRef.current) {
        layerRef.current.style.transform =
          `translate(${currX.toFixed(2)}px, ${currY.toFixed(2)}px)`;
      }
      frameId = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    frameId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#2D1B4E] flex flex-col items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes ringBreath {
          0%, 100% { opacity: 0.055; }
          50%       { opacity: 0.20;  }
        }
      `}</style>

      {/* Ring layer — oversized so shifting never reveals a hard edge */}
      <div ref={layerRef} className="absolute pointer-events-none" style={{ inset: "-7%" }}>
        <svg className="w-full h-full" aria-hidden>
          {RADII.map((r, i) => (
            <circle
              key={r}
              cx="50%" cy="50%" r={r}
              fill="none"
              stroke="#C8102E"
              strokeWidth={i < 2 ? 1.5 : 1}
              style={{
                animation: `ringBreath ${3.8 + i * 0.5}s ease-in-out ${i * 0.7}s infinite`,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Content slot */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
