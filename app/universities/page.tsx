"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // adjust if your export is named differently

type DormRow = {
  university: string;
  avg_rating: number | null;
};

type University = {
  name: string;
  dormCount: number;
  avgRating: number | null;
};

export default function UniversitiesPage() {
  const [dorms, setDorms] = useState<DormRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("dorms")
        .select("university, avg_rating");
      setDorms((data as DormRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // No universities table needed: group the dorms by their university name.
  const universities = useMemo<University[]>(() => {
    const groups = new Map<string, DormRow[]>();
    for (const d of dorms) {
      if (!d.university) continue;
      groups.set(d.university, [...(groups.get(d.university) ?? []), d]);
    }
    return Array.from(groups.entries())
      .map(([name, rows]) => {
        const rated = rows.filter((r) => (r.avg_rating ?? 0) > 0);
        const avgRating = rated.length
          ? rated.reduce((sum, r) => sum + (r.avg_rating ?? 0), 0) / rated.length
          : null;
        return { name, dormCount: rows.length, avgRating };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dorms]);

  const filtered = universities.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 700, margin: 0, color: "#111" }}>
        Universities
      </h1>
      <p style={{ color: "#666", fontSize: 16, margin: "8px 0 24px" }}>
        Pick your school to see its dorms and what students say about them.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter universities…"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "12px 16px",
          fontSize: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          marginBottom: 32,
          outline: "none",
        }}
      />

      {loading && <p style={{ color: "#666" }}>Loading universities…</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: "#666" }}>
          No universities match “{query}”. Don’t see yours?{" "}
          <Link href="/submit" style={{ color: "#4f46e5" }}>
            Submit a dorm
          </Link>{" "}
          to add it.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((u) => (
          <Link
            key={u.name}
            href={`/universities/${encodeURIComponent(u.name)}`}
            style={{
              display: "block",
              padding: 20,
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: "#111" }}>
              {u.name}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
              {u.dormCount} {u.dormCount === 1 ? "dorm" : "dorms"}
              {u.avgRating !== null && ` · ★ ${u.avgRating.toFixed(1)} average`}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}