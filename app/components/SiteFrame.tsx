'use client'

import Link from "next/link";
import { Logo, NavLinks } from "./ui";
import { useState, useEffect, useRef } from "react";

export function SiteFrame({
  media,
  children,
  action,
  compactNav = false,
  bgPhoto,
}: {
  media: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  compactNav?: boolean;
  bgPhoto?: string | null;
}) {
  const [prevSlot, setPrevSlot] = useState<{ url: string; id: number } | null>(null);
  const [currSlot, setCurrSlot] = useState<{ url: string; id: number } | null>(null);
  const slotId = useRef(0);
  const currRef = useRef<{ url: string; id: number } | null>(null);

  useEffect(() => {
    const prev = currRef.current;
    const next = bgPhoto ? { url: bgPhoto, id: ++slotId.current } : null;
    currRef.current = next;
    setPrevSlot(prev);
    setCurrSlot(next);
    const t = setTimeout(() => setPrevSlot(null), 1450);
    return () => clearTimeout(t);
  }, [bgPhoto]);

  const overlayBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    zIndex: 1
  };

  return (
    <div className={`ground${bgPhoto ? ' has-photo' : ''}`}>
      <div className="ground-media" aria-hidden>{media}</div>

      {prevSlot && (
        <img
          key={`prev-${prevSlot.id}`}
          src={prevSlot.url}
          alt=""
          aria-hidden
          style={{ ...overlayBase, animation: "bg-photo-out 1.3s ease forwards" }}
        />
      )}
      {currSlot && (
        <img
          key={`curr-${currSlot.id}`}
          src={currSlot.url}
          alt=""
          aria-hidden
          style={{ ...overlayBase, animation: "bg-photo-in 1.3s ease 0.15s forwards" }}
        />
      )}
      {bgPhoto && <div className="hero-tint" aria-hidden />}
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
            <div className="panel-media" aria-hidden>{media}</div>
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

export function CampusGround({ seed = "dormcheck" }: { seed?: string }) {
  const rand = seeded(hashString(seed));
  const uid = `cg${hashString(seed).toString(36)}`;
  const horizon = 458;

  type Band = { opacity: number; scale: number; windows: boolean };
  const bands: Band[] = [
    { opacity: 0.13, scale: 0.55, windows: false },
    { opacity: 0.24, scale: 0.78, windows: false },
    { opacity: 0.5,  scale: 1,    windows: true  },
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
          <stop offset="0%"   stopColor="#d7e5ff" />
          <stop offset="52%"  stopColor="#e9f1ff" />
          <stop offset="100%" stopColor="#f6faff" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.7" cy="0.16" r="0.5">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-lawn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c2d7f5" />
          <stop offset="100%" stopColor="#dfeafb" />
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

          if (roof > 0.86) {
            shapes.push(
              <rect key={`t${bi}-${bx}`} x={bx + w / 2 - 11 * band.scale} y={by - 40 * band.scale} width={22 * band.scale} height={40 * band.scale} rx="2" />,
              <polygon key={`s${bi}-${bx}`} points={`${bx + w / 2 - 15 * band.scale},${by - 40 * band.scale} ${bx + w / 2},${by - 64 * band.scale} ${bx + w / 2 + 15 * band.scale},${by - 40 * band.scale}`} />
            );
          } else if (roof > 0.62) {
            shapes.push(<polygon key={`g${bi}-${bx}`} points={`${bx - 3},${by} ${bx + w / 2},${by - 22 * band.scale} ${bx + w + 3},${by}`} />);
          } else if (roof > 0.42) {
            shapes.push(<rect key={`c${bi}-${bx}`} x={bx - 5} y={by - 7 * band.scale} width={w + 10} height={8 * band.scale} rx="1.5" />);
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

      <rect x="0" y={horizon} width="1200" height={500 - horizon} fill={`url(#${uid}-lawn)`} />
      <rect x="0" y={horizon} width="1200" height="2" fill="#1f45c4" opacity="0.14" />

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

export function GroundPhoto({ src, alt = "" }: { src: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} style={{ display: "block" }} />;
}