import Link from "next/link";
import { Logo, NavLinks } from "./ui";

/**
 * SiteFrame — the system's page shell, and the one bold move on every page.
 *
 * A photograph is the page ground, running the full width of the page. A white
 * frame floats on it, inset from the edges, and the content panel is cut out of
 * that frame so the white reads as structural lines rather than background.
 *
 * The panel holds a second copy of the image. The two copies have to read as
 * one continuous photograph, which they do only because .ground-media and
 * .panel-media give both the same width, the same centre, and the same bottom
 * line, at natural aspect ratio. Never set width or height on the media element
 * itself: inline styles beat those rules and the hero splits into two
 * visibly different photos.
 */
export function SiteFrame({
  media,
  children,
  action,
  compactNav = false,
}: {
  media: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  compactNav?: boolean;
}) {
  return (
    <div className="ground">
      <div className="ground-media" aria-hidden>
        {media}
      </div>

      <div className="frame-wrap">
        <div className="frame">
          <div className="frame-bar">
            <div className="row wrap" style={{ gap: 22 }}>
              <Logo compact={compactNav} />
              <nav className="row wrap frame-nav" style={{ gap: 20 }} aria-label="Primary">
                <NavLinks size={13.5} />
              </nav>
            </div>
            {action ?? (
              <Link href="/submit" className="btn btn-outline btn-sm">
                Add a dorm
              </Link>
            )}
          </div>

          <div className="panel">
            <div className="panel-media" aria-hidden>
              {media}
            </div>
            <div className="panel-scrim" aria-hidden />
            <div className="panel-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * CampusGround — the stand-in for the campus photograph the design system
 * expects. Three receding bands of buildings, drawn once and deterministically.
 *
 * To use a real photo instead: drop a wide image at public/campus.jpg and pass
 * <GroundPhoto src="/campus.jpg" /> as the `media` prop of SiteFrame. Use a
 * wide crop; it is laid out at its natural aspect and anchored to the bottom.
 */
export function CampusGround({ seed = "dormcheck" }: { seed?: string }) {
  const rand = seeded(hashString(seed));
  const uid = `cg${hashString(seed).toString(36)}`;
  // Buildings live in the bottom quarter only. The type sits on clean sky
  // above them, the same way the reference photo carries its horizon low.
  const horizon = 458;

  type Band = { opacity: number; scale: number; windows: boolean };
  const bands: Band[] = [
    { opacity: 0.13, scale: 0.55, windows: false },
    { opacity: 0.24, scale: 0.78, windows: false },
    { opacity: 0.5, scale: 1, windows: true },
  ];

  return (
    <svg
      viewBox="0 0 1200 500"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d7e5ff" />
          <stop offset="52%" stopColor="#e9f1ff" />
          <stop offset="100%" stopColor="#f6faff" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.7" cy="0.16" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-lawn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c2d7f5" />
          <stop offset="100%" stopColor="#dfeaFB" />
        </linearGradient>
      </defs>

      <rect width="1200" height="500" fill={`url(#${uid}-sky)`} />
      <rect width="1200" height="500" fill={`url(#${uid}-glow)`} />

      {bands.map((band, bi) => {
        const shapes: React.ReactNode[] = [];
        let cursor = -40 + rand() * 40;
        const baseY = horizon - (2 - bi) * 16;

        while (cursor < 1240) {
          const w = (78 + rand() * 132) * band.scale;
          const h = (44 + rand() * 104) * band.scale;
          const bx = cursor;
          const by = baseY - h;
          const roof = rand();

          shapes.push(<rect key={`b${bi}-${bx}`} x={bx} y={by} width={w} height={h} rx="2" />);

          // Rooflines vary so the skyline reads as a campus, not a city block.
          if (roof > 0.86) {
            // clock tower
            shapes.push(
              <rect
                key={`t${bi}-${bx}`}
                x={bx + w / 2 - 11 * band.scale}
                y={by - 40 * band.scale}
                width={22 * band.scale}
                height={40 * band.scale}
                rx="2"
              />
            );
            shapes.push(
              <polygon
                key={`s${bi}-${bx}`}
                points={`${bx + w / 2 - 15 * band.scale},${by - 40 * band.scale} ${
                  bx + w / 2
                },${by - 64 * band.scale} ${bx + w / 2 + 15 * band.scale},${by - 40 * band.scale}`}
              />
            );
          } else if (roof > 0.62) {
            // gable
            shapes.push(
              <polygon
                key={`g${bi}-${bx}`}
                points={`${bx - 3},${by} ${bx + w / 2},${by - 22 * band.scale} ${bx + w + 3},${by}`}
              />
            );
          } else if (roof > 0.42) {
            // cornice
            shapes.push(
              <rect
                key={`c${bi}-${bx}`}
                x={bx - 5}
                y={by - 7 * band.scale}
                width={w + 10}
                height={8 * band.scale}
                rx="1.5"
              />
            );
          }

          if (band.windows) {
            const cols = Math.max(2, Math.floor(w / 26));
            const rowCount = Math.max(2, Math.floor(h / 34));
            const cw = w / cols;
            const ch = (h - 24) / rowCount;
            for (let r = 0; r < rowCount; r += 1) {
              for (let c = 0; c < cols; c += 1) {
                if (rand() > 0.34) {
                  shapes.push(
                    <rect
                      key={`w${bi}-${bx}-${r}-${c}`}
                      x={bx + c * cw + cw * 0.28}
                      y={by + 14 + r * ch + ch * 0.22}
                      width={cw * 0.44}
                      height={ch * 0.46}
                      rx="1"
                      fill="#ffffff"
                      opacity={rand() > 0.55 ? 0.82 : 0.42}
                    />
                  );
                }
              }
            }
          }

          cursor += w + (6 + rand() * 26) * band.scale;
        }

        return (
          <g key={bi} fill={bi === 2 ? "#2a5fe0" : "#2f6bf6"} opacity={band.opacity}>
            {shapes}
          </g>
        );
      })}

      {/* lawn */}
      <rect x="0" y={horizon} width="1200" height={500 - horizon} fill={`url(#${uid}-lawn)`} />
      <rect x="0" y={horizon} width="1200" height="2" fill="#1f45c4" opacity="0.14" />

      {/* planting along the horizon, small enough to stay scenery */}
      {Array.from({ length: 14 }).map((_, i) => {
        const tx = 20 + i * 88 + rand() * 40;
        const tr = 10 + rand() * 11;
        return (
          <g key={`tree${i}`} opacity="0.34">
            <rect x={tx - 1.6} y={horizon - tr} width="3.2" height={tr + 2} fill="#1f45c4" />
            <circle cx={tx} cy={horizon - tr - 4} r={tr} fill="#2f6bf6" />
          </g>
        );
      })}
    </svg>
  );
}

/** Real photograph as the page ground, once one exists. */
export function GroundPhoto({ src, alt = "" }: { src: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ display: "block" }}
    />
  );
}
