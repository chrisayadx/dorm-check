"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase"; // adjust if your export is named differently

type Dorm = {
  id: string;
  name: string;
  university: string;
  photo_url: string | null;
  avg_rating: number | null;
  vibe: string | null;
  year_built: number | null;
};

export default function UniversityPage() {
  const params = useParams<{ name: string }>();
  const universityName = decodeURIComponent(params.name);

  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("dorms")
        .select("id, name, university, photo_url, avg_rating, vibe, year_built")
        .eq("university", universityName)
        .order("avg_rating", { ascending: false });
      setDorms((data as Dorm[]) ?? []);
      setLoading(false);
    }
    load();
  }, [universityName]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <Link
        href="/universities"
        style={{ color: "#4f46e5", fontSize: 14, textDecoration: "none" }}
      >
        ← All universities
      </Link>

      <h1 style={{ fontSize: 36, fontWeight: 700, margin: "16px 0 4px", color: "#111" }}>
        {universityName}
      </h1>
      {!loading && (
        <p style={{ color: "#666", fontSize: 16, margin: "0 0 32px" }}>
          {dorms.length} {dorms.length === 1 ? "dorm" : "dorms"}, highest rated first
        </p>
      )}

      {loading && <p style={{ color: "#666" }}>Loading dorms…</p>}

      {!loading && dorms.length === 0 && (
        <p style={{ color: "#666" }}>
          No dorms listed for this university yet.{" "}
          <Link href="/submit" style={{ color: "#4f46e5" }}>
            Be the first to submit one
          </Link>
          .
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {dorms.map((d) => (
          <Link
            key={d.id}
            href={`/dorms/${d.id}`}
            style={{
              display: "block",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              overflow: "hidden",
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
            }}
          >
            <div
              style={{
                height: 120,
                background: d.photo_url
                  ? `url(${d.photo_url}) center / cover`
                  : "#f4f4f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
              }}
            >
              {!d.photo_url && "🏠"}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#111" }}>
                {d.name}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: "#666" }}>
                {d.avg_rating ? `★ ${Number(d.avg_rating).toFixed(1)}` : "No ratings yet"}
                {d.vibe && ` · ${d.vibe}`}
                {d.year_built && ` · Built ${d.year_built}`}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}