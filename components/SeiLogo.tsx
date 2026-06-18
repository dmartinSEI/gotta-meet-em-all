interface SeiLogoMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * SEI logomark — outer ring + inner ~300° arc with gap at upper-right.
 * Matches the orbital mark used in SEI brand materials.
 * Defaults to SEI red (#C8102E). Pass color="#fff" for the white variant on dark backgrounds.
 */
export function SeiLogoMark({ size = 32, color = "#C8102E", className }: SeiLogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
      style={{ color }}
    >
      {/* Outer ring — complete circle */}
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="2.5" />
      {/*
        Inner arc — 300° clockwise arc with a ~60° gap at the upper-right
        (from ~11 o'clock to ~3 o'clock), creating the characteristic "C" orbital shape.
        Start: (24.5, 16) = 3 o'clock on r=8.5 circle
        End:   (20.25, 8.64) = 11 o'clock on r=8.5 circle
        Path sweeps clockwise: 6→9→12 o'clock, covering 300°.
      */}
      <path
        d="M 24.5 16 A 8.5 8.5 0 1 1 20.25 8.64"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * SEI full logo — mark + "SEI" wordmark side by side.
 * Use on standalone pages (sign-in, auth errors). For headers use SeiLogoMark directly.
 */
export function SeiLogo({
  size = 32,
  color = "#C8102E",
  textColor,
  className,
}: SeiLogoMarkProps & { textColor?: string }) {
  const tc = textColor ?? color;
  const fontSize = Math.round(size * 0.5);
  const gap = Math.round(size * 0.28);
  return (
    <div className={`flex items-center${className ? ` ${className}` : ""}`} style={{ gap }}>
      <SeiLogoMark size={size} color={color} />
      <span
        style={{
          color: tc,
          fontSize,
          fontWeight: 900,
          letterSpacing: "0.08em",
          lineHeight: 1,
          fontFamily: "inherit",
        }}
      >
        SEI
      </span>
    </div>
  );
}
