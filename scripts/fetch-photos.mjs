// Fetch campus photos (per university) and exterior dorm photos (per dorm)
// from Wikimedia Commons.
//
// Run from the project root:
//   npm install @supabase/supabase-js
//   node --env-file=.env.local scripts/fetch-photos.mjs
//
// .env.local needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// (service key: local use only, never commit it, never prefix it NEXT_PUBLIC_).
//
// One-time SQL first (Supabase SQL editor):
//   alter table dorms add column if not exists photo_credit text;
//   alter table dorms add column if not exists photo_source text;
//
// Every dorm ends up with a photo, no hand-editing needed. Order tried per dorm:
//   1. Wikimedia Commons, strict name match      (photo_source = 'exact')
//   2. Openverse, looser match, same campus only (photo_source = 'loose')
//   3. The university's campus photo             (photo_source = 'campus')
// Re-running retries 'loose' and 'campus' dorms; photos you set by hand are never touched.

import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";

const UA = { "User-Agent": "DormCheck/1.0 (replace-with-your-email@example.com)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Keys must match the `university` column in your dorms table EXACTLY.
// Check yours with:  select distinct university from dorms;
// `pattern` is used to reject photos that aren't actually from that campus.
const UNIVERSITIES = {
  "University of Virginia": {
    pattern: /university of virginia|rotunda|charlottesville/i,
    queries: ["University of Virginia Rotunda", "University of Virginia Lawn", "University of Virginia campus"],
  },
  "George Mason University": {
    pattern: /george mason|fairfax/i,
    queries: ["George Mason University Fairfax campus", "George Mason University Johnson Center", "George Mason University"],
  },
  "Virginia Tech": {
    pattern: /virginia tech|blacksburg|hokie/i,
    queries: ["Virginia Tech Burruss Hall", "Virginia Tech Drillfield", "Virginia Tech campus"],
  },
  "UNC Chapel Hill": {
    pattern: /north carolina|chapel hill|unc/i,
    queries: ["Old Well University of North Carolina", "UNC Chapel Hill Wilson Library", "UNC Chapel Hill campus"],
  },
  "Georgia Tech": {
    pattern: /georgia tech|georgia institute/i,
    queries: ["Georgia Tech Tech Tower", "Georgia Tech campus", "Georgia Institute of Technology"],
  },
  "University of Michigan": {
    pattern: /michigan|ann arbor/i,
    queries: ["University of Michigan Diag", "Burton Memorial Tower", "University of Michigan campus"],
  },
};

// Skip logos, maps, floor plans, interiors, etc. We want the outside of buildings.
const BAD_TITLE = /logo|seal|map|floor ?plan|diagram|interior|room|lobby|icon|flag|banner/i;
const STOP = new Set(["hall", "house", "tower", "the", "of", "north", "south", "east", "west", "residence", "halls", "dormitory"]);

async function commons(query, { pattern, tokens = [] }) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6", // File: namespace
      gsrlimit: "10",
      prop: "imageinfo",
      iiprop: "url|size|mime|extmetadata",
      iiurlwidth: "1000",
    });

  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  const json = await res.json();
  const pages = Object.values(json?.query?.pages ?? {}).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0)
  );

  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl || info.mime !== "image/jpeg" || (info.width ?? 0) < 1200) continue;
    if (BAD_TITLE.test(p.title)) continue;

    const meta = info.extmetadata ?? {};
    const haystack = [p.title, meta.ImageDescription?.value, meta.Categories?.value]
      .join(" ")
      .toLowerCase();

    if (pattern && !pattern.test(haystack)) continue;
    if (!tokens.every((t) => haystack.includes(t))) continue;

    const artist = (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim();
    const license = meta.LicenseShortName?.value ?? "";
    return {
      url: info.thumburl,
      credit: [artist, license, "Wikimedia Commons"].filter(Boolean).join(" · "),
      source: info.descriptionurl,
    };
  }
  return null;
}

// Looser search over Creative Commons photos (Flickr, etc.). Results can be a different
// building at the right campus, which is fine here; the campus check keeps them on-topic.
async function openverse(query, pattern) {
  const url =
    "https://api.openverse.org/v1/images/?" +
    new URLSearchParams({ q: query, page_size: "15", category: "photograph" });
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  const json = await res.json();
  for (const r of json.results ?? []) {
    const text = [r.title, ...(r.tags ?? []).map((t) => t.name)].join(" ");
    if (pattern && !pattern.test(text)) continue;
    const src = r.thumbnail ?? r.url; // thumbnail is served by Openverse, so no hotlink blocking
    if (!src) continue;
    return {
      url: src,
      credit: [r.creator, (r.license ?? "").toUpperCase(), r.source].filter(Boolean).join(" · "),
    };
  }
  return null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: dorms, error } = await supabase
  .from("dorms")
  .select("id, name, university, photo_url, photo_source");
if (error) throw error;

// ---------- 1) One campus photo per university ----------
const universityPhotos = {};
const names = [...new Set((dorms ?? []).map((d) => d.university).filter(Boolean))];

for (const name of names) {
  const cfg = UNIVERSITIES[name];
  if (!cfg) {
    console.warn(`No config for "${name}". Add it to UNIVERSITIES (name must match exactly).`);
    continue;
  }
  for (const q of cfg.queries) {
    const photo = await commons(q, { pattern: cfg.pattern });
    await sleep(300);
    if (photo) {
      universityPhotos[name] = photo;
      console.log("campus photo:", name);
      break;
    }
  }
  if (!universityPhotos[name]) console.warn("no campus photo found:", name);
}

await mkdir("lib", { recursive: true });
await writeFile("lib/university-photos.json", JSON.stringify(universityPhotos, null, 2));

// ---------- 2) A photo for every dorm ----------
const todo = (dorms ?? []).filter(
  (d) => !d.photo_url || d.photo_source === "loose" || d.photo_source === "campus"
);
const counts = { exact: 0, loose: 0, campus: 0, none: 0 };
const none = [];

for (const d of todo) {
  const cfg = UNIVERSITIES[d.university];
  const tokens = d.name
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));

  let photo = null;
  let source = null;

  if (cfg && tokens.length > 0) {
    photo =
      (await commons(`${d.name} ${d.university}`, { pattern: cfg.pattern, tokens })) ??
      (await commons(`${d.name} residence hall`, { pattern: cfg.pattern, tokens }));
    await sleep(300);
    if (photo) source = "exact";
  }

  if (!photo && cfg) {
    photo = await openverse(`${d.name} ${d.university}`, cfg.pattern);
    await sleep(300);
    if (photo) source = "loose";
  }

  if (!photo && universityPhotos[d.university]) {
    photo = universityPhotos[d.university];
    source = "campus";
  }

  if (!photo) {
    counts.none++;
    none.push(d.name);
    continue;
  }

  // Don't downgrade a dorm that already has a better photo than this run found.
  const rank = { campus: 0, loose: 1, exact: 2 };
  if (d.photo_url && rank[source] <= (rank[d.photo_source] ?? 2)) continue;

  const { error: upErr } = await supabase
    .from("dorms")
    .update({ photo_url: photo.url, photo_credit: photo.credit, photo_source: source })
    .eq("id", d.id);
  if (upErr) console.error("update failed:", d.name, upErr.message);
  else {
    counts[source]++;
    console.log(`${source}:`, d.name);
  }
}

console.log("\nDone.", counts);
if (none.length) console.log("No photo at all (check UNIVERSITIES names):\n" + none.join("\n"));