'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SiteFrame, CampusGround } from './components/SiteFrame'
import { DormCard, CardSkeleton } from './components/DormCard'
import { Figure, UniversityMark, initialsOf } from './components/ui'
import { summarize, groupByDorm } from '@/lib/ratings'

type Dorm = {
  id: string
  name: string
  university: string
  photo_url: string | null
  avg_rating: number | null
  year_built: number | null
  amenities: string[] | null
}

// How tall the arc sits above the heading text
const ARC_RY = 72
const ARC_EXTRA = 22

export default function HomePage() {
  const router = useRouter()

  const [dorms, setDorms] = useState<Dorm[]>([])
  const [reviews, setReviews] = useState<{ dorm_id: string; rating: number }[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Arc
  const [arcRx, setArcRx] = useState(200)
  const [mounted, setMounted] = useState(false)
  const [featuredIndex, setFeaturedIndex] = useState<number | null>(null)

  const searchRef = useRef<HTMLDivElement>(null)

  // Responsive arc radius
  useEffect(() => {
    const calc = () => setArcRx(Math.min(240, window.innerWidth * 0.28))
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  // Trigger emerge-from-text animation on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load dorms + reviews
  useEffect(() => {
    let cancelled = false
    async function load() {
      const [dormsRes, reviewsRes] = await Promise.all([
        supabase.from('dorms').select('*').order('avg_rating', { ascending: false }),
        supabase.from('reviews').select('dorm_id, rating'),
      ])
      if (cancelled) return
      if (dormsRes.error) { setLoadFailed(true); setLoading(false); return }
      setDorms(dormsRes.data ?? [])
      setReviews(reviewsRes.data ?? [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  const byDorm = useMemo(() => groupByDorm(reviews), [reviews])

  const universities = useMemo(
    () => [...new Set(dorms.map((d) => d.university))],
    [dorms]
  )

  // Best available photo per university — used as background when that icon is featured
  const universityPhotos = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const u of universities) {
      const hit = dorms.find((d) => d.university === u && d.photo_url)
      map.set(u, hit?.photo_url ?? null)
    }
    return map
  }, [dorms, universities])

  // Cycle featured icon every 10 s once universities are loaded
  useEffect(() => {
    if (universities.length === 0) return
    setFeaturedIndex(0)
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % Math.min(universities.length, 6)
      setFeaturedIndex(idx)
    }, 10000)
    return () => clearInterval(interval)
  }, [universities.length])

  const featuredBgPhoto =
    featuredIndex !== null
      ? (universityPhotos.get(universities[featuredIndex]) ?? null)
      : null

  const universityDormCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of dorms) map.set(d.university, (map.get(d.university) ?? 0) + 1)
    return map
  }, [dorms])

  const q = search.trim().toLowerCase()

  const matchedUniversities = useMemo(
    () => (q ? universities.filter((u) => u.toLowerCase().includes(q)).slice(0, 5) : []),
    [q, universities]
  )

  const matchedDorms = useMemo(
    () => (q ? dorms.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 4) : []),
    [q, dorms]
  )

  const visible = q
    ? dorms.filter(
        (d) => d.name.toLowerCase().includes(q) || d.university.toLowerCase().includes(q)
      )
    : dorms

  function handleSelectUniversity(u: string) {
    setSearch(u)
    setDropdownOpen(false)
    router.push(`/browse?university=${encodeURIComponent(u)}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setDropdownOpen(false)
    if (!q) return
    const target = matchedUniversities[0]
    router.push(
      target
        ? `/browse?university=${encodeURIComponent(target)}`
        : `/browse?q=${encodeURIComponent(search.trim())}`
    )
  }

  function retry() {
    setLoading(true)
    setLoadFailed(false)
    setReloadKey((k) => k + 1)
  }

  // Place icon i of n along a wide, flat arc above the heading.
  // x is centered on the heading; y is always negative (above the text).
  function arcPos(i: number, n: number) {
    const t = n === 1 ? 0.5 : i / (n - 1)
    // Span from ~158° to ~22° — a wide arc, open side facing down
    const angle = Math.PI * (0.88 - 0.76 * t)
    return {
      x: arcRx * Math.cos(angle),
      y: -(ARC_RY * Math.sin(angle) + ARC_EXTRA),
      // Icons at the ends sit lower on the arc, fade them slightly
      edgeOpacity: 0.5 + Math.min(t, 1 - t),
    }
  }

  const arcCount = Math.min(universities.length, 6)

  return (
    <main>
      {/* ---------- hero ---------- */}
      <section>
        <SiteFrame media={<CampusGround />} bgPhoto={featuredBgPhoto}>
          <div
            className="hero-center"
            style={{
              position: 'relative',
              paddingTop: arcCount > 0 ? 120 : undefined,
            }}
          >
            {/* Arc + heading grouped so the arc anchors to the heading's top edge */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {arcCount > 0 && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                    overflow: 'visible',
                  }}
                >
                  {universities.slice(0, 6).map((u, i) => {
                    const { x, y, edgeOpacity } = arcPos(i, arcCount)
                    const isFeatured = featuredIndex === i

                    // Before mount: icons start 52 px lower (inside heading) at opacity 0
                    // After mount: float up to their arc position, fade in
                    const yFinal = y + (isFeatured ? -32 : 0)
                    const yNow = yFinal + (mounted ? 0 : 52)
                    const delay = mounted ? '0s' : `${(i * 0.11).toFixed(2)}s`

                    return (
                      <div
                        key={u}
                        title={u}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 44,
                          height: 44,
                          transform: `translate(
                            calc(-50% + ${x.toFixed(1)}px),
                            calc(-50% + ${yNow.toFixed(1)}px)
                          ) scale(${isFeatured ? 1.42 : 1})`,
                          opacity: mounted ? (isFeatured ? 1 : edgeOpacity) : 0,
                          transition: `transform 0.65s cubic-bezier(0.34,1.56,0.64,1) ${delay},
                                       opacity 0.5s ease ${delay}`,
                          zIndex: isFeatured ? 5 : 1,
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            position: 'relative',
                            animation: mounted
                              ? `arc-bob ${(2.8 + i * 0.35).toFixed(2)}s ease-in-out ${(-i * 0.65).toFixed(2)}s infinite`
                              : 'none',
                          }}
                        >
                          <UniversityMark initials={initialsOf(u)} size={44} />
                          {isFeatured && <span className="arc-focus-ring" />}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <h1 className="t-hero" style={{ maxWidth: '16ch', position: 'relative' }}>
                What is it actually like to live there?
              </h1>
            </div>

            <p
              className="t-lead"
              style={{ maxWidth: '46ch', margin: 0, position: 'relative', zIndex: 1 }}
            >
              Room details, building facts, and reviews from students who already spent
              a year in the place you are about to sign for.
            </p>
          </div>
        </SiteFrame>
      </section>

      {/*
        Search lives OUTSIDE the SiteFrame panel.
        The panel has overflow:hidden which would clip the dropdown.
      */}
      <section className="shell" style={{ paddingTop: 28, paddingBottom: 4 }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            gap: 10,
            maxWidth: 560,
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          <div ref={searchRef} className="search-wrap">
            <label htmlFor="dorm-search" style={{ position: 'absolute', left: -9999 }}>
              Search dorms by name or university
            </label>
            <input
              id="dorm-search"
              className="input"
              type="search"
              placeholder="Search a school or dorm…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              style={{ fontSize: 16, padding: '15px 22px', borderRadius: 'var(--r-pill)' }}
            />

            {dropdownOpen && q && (matchedUniversities.length > 0 || matchedDorms.length > 0) && (
              <div className="search-dropdown">
                {matchedUniversities.length > 0 && (
                  <>
                    <div className="search-group-label">Universities</div>
                    {matchedUniversities.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className="search-result-item"
                        onClick={() => handleSelectUniversity(u)}
                      >
                        <UniversityMark initials={initialsOf(u)} size={32} />
                        <div>
                          <div>{u}</div>
                          <div className="search-result-meta">
                            {universityDormCounts.get(u) ?? 0}{' '}
                            {(universityDormCounts.get(u) ?? 0) === 1 ? 'building' : 'buildings'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {matchedDorms.length > 0 && (
                  <>
                    <div className="search-group-label">Dorms</div>
                    {matchedDorms.map((d) => (
                      <Link
                        key={d.id}
                        href={`/dorms/${d.id}`}
                        className="search-result-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--r-sm)',
                            background: 'var(--blue-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 800,
                            color: 'var(--blue-900)',
                            flexShrink: 0,
                          }}
                        >
                          {d.name.charAt(0)}
                        </span>
                        <div>
                          <div>{d.name}</div>
                          <div className="search-result-meta">{d.university}</div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '15px 28px' }}>
            Find your dorm
          </button>
        </form>
      </section>

      {/* ---------- stats ---------- */}
      <section className="shell" style={{ paddingTop: 20 }}>
        <div className="card stat-row">
          <Figure
            value={loadFailed ? '—' : String(dorms.length)}
            label={dorms.length === 1 ? 'dorm listed' : 'dorms listed'}
          />
          <Figure
            value={loadFailed ? '—' : String(reviews.length)}
            label={reviews.length === 1 ? 'student review' : 'student reviews'}
          />
          <Figure
            value={loadFailed ? '—' : String(universities.length)}
            label={universities.length === 1 ? 'university' : 'universities'}
          />
          <p className="t-body" style={{ flex: '1 1 260px', margin: 0, fontSize: 14 }}>
            {loadFailed
              ? 'These counts are unavailable while the database is unreachable.'
              : 'Early days. Every listing here was added by a student, so the fastest way to make this useful for your campus is to add the building you live in.'}
          </p>
        </div>
      </section>

      {/* ---------- dorm grid ---------- */}
      <section className="shell" style={{ paddingTop: 56, paddingBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 22,
          }}
        >
          <div>
            <h2 className="t-section">
              {q ? `Matching "${search.trim()}"` : 'Every dorm on DormCheck'}
            </h2>
            <p className="t-body" style={{ marginTop: 6, fontSize: 14 }}>
              {q
                ? `${visible.length} ${visible.length === 1 ? 'building' : 'buildings'}`
                : 'Sorted by rating. Buildings without a student photo show an illustrated facade.'}
            </p>
          </div>
          <Link href="/submit" className="btn btn-soft btn-sm">Add a dorm</Link>
        </div>

        <div className="grid-auto">
          {loading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          {!loading && visible.map((dorm) => (
            <DormCard
              key={dorm.id}
              dorm={dorm}
              rating={summarize(byDorm.get(dorm.id) ?? [], dorm.avg_rating).value}
            />
          ))}
        </div>

        {!loading && loadFailed && (
          <div className="card" style={{ padding: 40, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}>
            <p className="t-card" style={{ marginBottom: 6 }}>The dorm list did not load</p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>
              The database did not answer. Your connection or the server is the likely cause.
            </p>
            <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>
          </div>
        )}

        {!loading && !loadFailed && visible.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}>
            <p className="t-card" style={{ marginBottom: 6 }}>
              {q ? `Nothing here matches "${search.trim()}"` : 'No dorms yet'}
            </p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>
              {q
                ? 'Try the university name, or add the building yourself.'
                : 'Add the first building and leave the first review.'}
            </p>
            <Link href="/submit" className="btn btn-primary">Add a dorm</Link>
          </div>
        )}
      </section>

      {/* ---------- CTA ---------- */}
      <section className="shell" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <div
          className="card-tint"
          style={{
            padding: '40px 36px',
            display: 'flex',
            gap: 28,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <h2 className="t-section" style={{ color: 'var(--blue-900)' }}>
              Your building is missing
            </h2>
            <p className="t-body" style={{ marginTop: 8 }}>
              It takes about a minute. Name, university, what the room had, and what
              you wish you had known before you moved in.
            </p>
          </div>
          <div className="row wrap" style={{ gap: 12 }}>
            <Link href="/submit" className="btn btn-primary">Add a dorm</Link>
            <Link href="/universities" className="btn btn-outline">Browse by university</Link>
          </div>
        </div>
      </section>
    </main>
  )
}