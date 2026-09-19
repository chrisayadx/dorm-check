/**
 * DormPortrait — the stand-in for a photograph that does not exist yet.
 *
 * Every dorm in the database currently has photo_url = null, and the design
 * system leans on campus photography. A grey "no image" box would read as a
 * hole in the page, so instead each building gets a facade drawn from its own
 * record: the window grid comes from year_built, the massing and lit windows
 * come from the name. Same dorm always draws the same portrait, on server and
 * client alike, so there is nothing to hydrate and nothing to cache-bust.
 *
 * It is deliberately an illustration, not a fake photo. The moment a real
 * photo_url lands, PhotoSlot below renders that instead.
 */

type Era = "tower" | "block" | "modern";

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small deterministic PRNG so the drawing never shifts. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function eraOf(yearBuilt?: number | null): Era {
  if (!yearBuilt) return "block";
  if (yearBuilt < 1975) return "tower";
  if (yearBuilt < 2000) return "block";
  return "modern";
}

export function DormPortrait({
  seed,
  yearBuilt,
  className,
  style,
}: {
  seed: string;
  yearBuilt?: number | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const rand = seeded(hashString(seed));
  const era = eraOf(yearBuilt);
  const uid = `dp${hashString(seed).toString(36)}`;

  // Massing. Older stock is narrow and tall, newer stock is wide and low.
  const width = era === "tower" ? 96 + rand() * 26 : 150 + rand() * 54;
  const height = era === "tower" ? 132 + rand() * 20 : 96 + rand() * 26;
  const x = 160 - width / 2 + (rand() * 28 - 14);
  const groundY = 182;
  const y = groundY - height;

  // Window grid. Narrow slots on the old towers, wide bands on the new builds.
  const cols = era === "tower" ? 3 + Math.floor(rand() * 2) : 5 + Math.floor(rand() * 3);
  const rows = era === "tower" ? 6 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 2);
  const padX = 14;
  const padTop = era === "modern" ? 22 : 16;
  const cellW = (width - padX * 2) / cols;
  const cellH = (height - padTop - 16) / rows;
  const winW = cellW * (era === "modern" ? 0.74 : 0.52);
  const winH = cellH * (era === "tower" ? 0.62 : 0.54);

  const windows: React.ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const lit = rand() > 0.68;
      windows.push(
        <rect
          key={`${r}-${c}`}
          x={x + padX + c * cellW + (cellW - winW) / 2}
          y={y + padTop + r * cellH + (cellH - winH) / 2}
          width={winW}
          height={winH}
          rx={era === "modern" ? 1.5 : 1}
          fill={lit ? "#ffffff" : "#b9d0ff"}
          opacity={lit ? 0.95 : 0.55}
        />
      );
    }
  }

  // A neighbouring wing, set back, for depth.
  const wingW = 52 + rand() * 30;
  const wingH = height * (0.5 + rand() * 0.22);
  const wingLeft = rand() > 0.5;
  const wingX = wingLeft ? x - wingW + 8 : x + width - 8;

  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustrated facade. No student photo has been added for this building yet."
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbe8ff" />
          <stop offset="62%" stopColor="#eef5ff" />
          <stop offset="100%" stopColor="#f8fbff" />
        </linearGradient>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a7ef0" />
          <stop offset="100%" stopColor="#1f45c4" />
        </linearGradient>
      </defs>

      <rect width="320" height="200" fill={`url(#${uid}-sky)`} />

      {/* wing behind */}
      <rect
        x={wingX}
        y={groundY - wingH}
        width={wingW}
        height={wingH}
        fill="#2f6bf6"
        opacity="0.28"
        rx="2"
      />

      {/* main body */}
      <rect x={x} y={y} width={width} height={height} fill={`url(#${uid}-body)`} rx="2" />

      {/* era detailing */}
      {era === "tower" && (
        <>
          <rect x={x} y={y} width={width} height="5" fill="#0f1f3d" opacity="0.32" />
          <rect x={x + width / 2 - 1} y={y + 5} width="2" height={height - 5} fill="#0f1f3d" opacity="0.14" />
        </>
      )}
      {era === "block" && (
        <rect x={x - 4} y={y} width={width + 8} height="7" fill="#0f1f3d" opacity="0.26" rx="1.5" />
      )}
      {era === "modern" && (
        <rect x={x + 10} y={y - 12} width={width - 20} height="12" fill="#1f45c4" opacity="0.72" rx="2" />
      )}

      {windows}

      {/* entrance */}
      <rect
        x={x + width / 2 - 9}
        y={groundY - 20}
        width="18"
        height="20"
        rx="1.5"
        fill="#0f1f3d"
        opacity="0.42"
      />

      {/* ground */}
      <rect x="0" y={groundY} width="320" height={200 - groundY} fill="#cfdff8" />
      <rect x="0" y={groundY} width="320" height="1.5" fill="#0f1f3d" opacity="0.12" />

      {/* campus planting */}
      <circle cx={x - 26} cy={groundY - 13} r="13" fill="#2f6bf6" opacity="0.3" />
      <circle cx={x + width + 24} cy={groundY - 9} r="9" fill="#2f6bf6" opacity="0.24" />
    </svg>
  );
}

/**
 * PhotoSlot — a real photo when there is one, the portrait when there is not.
 * Drop a file into Supabase storage and set dorms.photo_url to swap it over.
 */
export function PhotoSlot({
  photoUrl,
  seed,
  yearBuilt,
  alt,
  height,
  rounded = "var(--r-md)",
}: {
  photoUrl?: string | null;
  seed: string;
  yearBuilt?: number | null;
  alt: string;
  height: number | string;
  rounded?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        borderRadius: rounded,
        background: "var(--blue-050)",
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={alt}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <DormPortrait seed={seed} yearBuilt={yearBuilt} />
      )}
    </div>
  );
}
