import Link from "next/link";

/**
 * Wordmark. The mark repeats the window grid used in DormPortrait, so the
 * building motif carries from the logo down to every card on the page.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        color: "var(--ink-900)",
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: "linear-gradient(135deg, #3d7bff, #1330a6)",
          display: "inline-grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 2.5,
          padding: 6,
          flexShrink: 0,
        }}
      >
        <i style={{ background: "#fff", opacity: 0.95, borderRadius: 1 }} />
        <i style={{ background: "#fff", opacity: 0.5, borderRadius: 1 }} />
        <i style={{ background: "#fff", opacity: 0.5, borderRadius: 1 }} />
        <i style={{ background: "#fff", opacity: 0.95, borderRadius: 1 }} />
      </span>
      {!compact && (
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>
          DormCheck
        </span>
      )}
    </Link>
  );
}

const NAV = [
  { href: "/browse", label: "Browse dorms" },
  { href: "/universities", label: "Universities" },
  { href: "/submit", label: "Add a dorm" },
]

export function NavLinks({ size = 14 }: { size?: number }) {
  return (
    <>
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{ fontSize: size, fontWeight: 600}}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

/**
 * Rating. The system permits one blue spine and no second accent hue, so the
 * usual row of amber stars is out. A filled bar plus the numeral carries the
 * same information and stays on palette. The review count is shown plainly
 * because "4.7 from one review" is a different claim than "4.7 from ninety".
 */
export function Rating({
  value,
  count,
  size = "md",
}: {
  value?: number | null;
  count?: number;
  size?: "sm" | "md" | "lg";
}) {
  const score = typeof value === "number" && value > 0 ? value : null;
  const pct = score ? Math.max(0, Math.min(1, score / 5)) : 0;

  const numeral = size === "lg" ? 34 : size === "md" ? 17 : 15;
  const barW = size === "lg" ? 132 : size === "md" ? 62 : 52;
  const barH = size === "lg" ? 8 : 5;

  if (!score) {
    return (
      <span className="t-meta" style={{ fontWeight: 600 }}>
        Not rated yet
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size === "lg" ? 14 : 9 }}>
      <span className="t-num" style={{ fontSize: numeral, color: "var(--blue-900)", lineHeight: 1 }}>
        {score.toFixed(1)}
      </span>
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 5 }}>
        <span
          role="img"
          aria-label={`${score.toFixed(1)} out of 5`}
          style={{
            width: barW,
            height: barH,
            borderRadius: 999,
            background: "#dfe8f8",
            overflow: "hidden",
            display: "block",
          }}
        >
          <span
            style={{
              display: "block",
              width: `${pct * 100}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(135deg, #3d7bff, #1330a6)",            }}
          />
        </span>
        {typeof count === "number" && size !== "sm" && (
          <span style={{ fontSize: 12, color: "var(--ink-400)", lineHeight: 1 }}>
            {count === 0 ? "no reviews yet" : count === 1 ? "1 review" : `${count} reviews`}
          </span>
        )}
      </span>
    </span>
  );
}

/** A measured figure. Used for counts that come from the database, never invented. */
export function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="t-num" style={{ fontSize: 30, color: "var(--blue-900)", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 13, color: "var(--ink-400)" }}>{label}</span>
    </div>
  );
}

/** Initials tile, used for the university arc across the hero. */
export function UniversityMark({ initials, size = 46 }: { initials: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "#fff",
        boxShadow: "0 6px 16px rgba(17,41,92,0.12)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.28,
        fontWeight: 800,
        color: "var(--blue-900)",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

/**
 * Short mark for a university name.
 * "UNC Chapel Hill" keeps the acronym it already has rather than becoming UCH;
 * "University of Michigan" keeps the U so it reads UM, not M.
 */
const STOPWORDS = new Set(["of", "at", "the", "and", "in"]);

export function initialsOf(university: string) {
  const words = university.split(/[\s-]+/).filter((w) => /[A-Za-z]/.test(w));

  const existing = words.find((w) => w.length >= 2 && w === w.toUpperCase());
  if (existing) return existing.slice(0, 4);

  const initials = words
    .filter((w) => !STOPWORDS.has(w.toLowerCase()))
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return initials.slice(0, 3) || university.slice(0, 2).toUpperCase();
}
