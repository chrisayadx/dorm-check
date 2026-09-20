'use client'
import { AiChat } from './components/AiChat'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SiteFrame, CampusGround } from './components/SiteFrame'
import { DormCard, CardSkeleton } from './components/DormCard'
import { Figure } from './components/ui'
import { summarize, groupByDorm } from '@/lib/ratings'
import { HeroArc } from './components/HeroArc'
import universityPhotos from '@/lib/university-photos.json'



type Dorm = {
  id: string
  name: string
  university: string
  photo_url: string | null
  avg_rating: number | null
  year_built: number | null
  amenities: string[] | null
}

export default function HomePage() {
  const [dorms, setDorms] = useState<Dorm[]>([])
  const [reviews, setReviews] = useState<
    { dorm_id: string; rating: number }[]
  >([])
  const [search, setSearch] = useState('')

    const resultsRef = useRef<HTMLElement>(null)

  // Scrolls the results section to the top of the viewport. Called on submit
  // and on the debounced typing effect below.
  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Typing scrolls down once, when a query first produces matches. Without the
  // guard, every keystroke would re-trigger the scroll and fight the user as
  // they keep typing. The delay lets them finish a word first.
  const hasScrolled = useRef(false)

  useEffect(() => {
    const q = search.trim()
    if (!q) {
      hasScrolled.current = false
      return
    }
    if (hasScrolled.current) return

    const t = setTimeout(() => {
      hasScrolled.current = true
      scrollToResults()
    }, 500)
    return () => clearTimeout(t)
  }, [search, scrollToResults])

  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [dormsRes, reviewsRes] = await Promise.all([
        supabase
          .from('dorms')
          .select('*')
          .order('avg_rating', { ascending: false }),

        supabase
          .from('reviews')
          .select('dorm_id, rating'),
      ])

      if (cancelled) return

      if (dormsRes.error) {
        console.error('SUPABASE DORMS ERROR:', dormsRes.error)
        setLoadFailed(true)
        setLoading(false)
        return
      }
      console.log('DORMS LOADED:', dormsRes.data?.length, dormsRes.data?.[0])
      setDorms(dormsRes.data ?? [])
      setReviews(reviewsRes.data ?? [])
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setLoadFailed(false)
    setReloadKey((k) => k + 1)
  }

  const byDorm = useMemo(
    () => groupByDorm(reviews),
    [reviews]
  )

  const universities = useMemo(
    () => [...new Set(dorms.map((d) => d.university))],
    [dorms]
  )

    const [featuredUni, setFeaturedUni] = useState<string | null>(null)

  // Campus photo per university. Files go in public/ and are referenced from
  // the root: public/campus/vt.jpg → '/campus/vt.jpg'. When a school has no
  // dedicated shot here, the first dorm photo for that school is used.
  // Campus photos come from scripts/fetch-photos.mjs, which writes this file
  // from Wikimedia Commons. Keys are the `university` values in the database.
    const featuredPhoto = useMemo(() => {
    if (!featuredUni) return null
    const photos = universityPhotos as Record<string, { url: string }>
    return photos[featuredUni]?.url?.replace('thumb.wikimedia.org', 'upload.wikimedia.org') ?? null
  }, [featuredUni])

  const handleFeature = useCallback((u: string) => setFeaturedUni(u), [])

  const q = search.trim().toLowerCase()

  // Search shows every match; the default view shows a top slice. The query
  // already sorts by avg_rating desc, so the first nine are the highest rated.
  const visible = q
    ? dorms.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.university.toLowerCase().includes(q)
      )
    : dorms.slice(0, 9)

  return (
    <main>
      {/* ---------- hero ---------- */}
       <section>
        <SiteFrame media={null} bgPhoto={featuredPhoto}>
          <div className="hero-center" style={{ position: 'relative', paddingTop: 96 }}>

            <HeroArc universities={universities} onFeature={handleFeature} />

            <h1
              className="t-hero"
              style={{
                maxWidth: '16ch',
              }}
            >
              What is it actually like to live there?
            </h1>

            <p
              className="t-lead"
              style={{
                maxWidth: '46ch',
                margin: 0,
              }}
            >
              Room details, building facts, and reviews
              from students who already spent a year in
              the place you are about to sign for.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                scrollToResults()
              }}
              style={{
                display: 'flex',
                gap: 10,
                width: '100%',
                maxWidth: 480,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <label
                htmlFor="dorm-search"
                style={{
                  position: 'absolute',
                  left: -9999,
                }}
              >
                Search dorms by name or university
              </label>

              <input
                id="dorm-search"
                className="input"
                type="search"
                placeholder="Search a dorm or a university"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                style={{
                  flex: '1 1 240px',
                  width: 'auto',
                  borderRadius:
                    'var(--r-pill)',
                  padding: '14px 22px',
                }}
              />

              <button
                type="submit"
                className="btn btn-primary"
              >
                Find your dorm
              </button>
            </form>
          </div>
        </SiteFrame>
      </section>

      {/* ---------- stats ---------- */}
      <section
        className="shell"
        style={{
          paddingTop: 40,
        }}
      >
        <div className="card stat-row">
          <Figure
            value={
              loadFailed
                ? '—'
                : String(dorms.length)
            }
            label={
              dorms.length === 1
                ? 'dorm listed'
                : 'dorms listed'
            }
          />

          <Figure
            value={
              loadFailed
                ? '—'
                : String(reviews.length)
            }
            label={
              reviews.length === 1
                ? 'student review'
                : 'student reviews'
            }
          />

          <Figure
            value={
              loadFailed
                ? '—'
                : String(universities.length)
            }
            label={
              universities.length === 1
                ? 'university'
                : 'universities'
            }
          />

          <p
            className="t-body"
            style={{
              flex: '1 1 260px',
              margin: 0,
              fontSize: 14,
            }}
          >
            {loadFailed
              ? 'These counts are unavailable while the database is unreachable.'
              : 'Early days. Every listing here was added by a student, so the fastest way to make this useful for your campus is to add the building you live in.'}
          </p>
        </div>
      </section>

      {/* ---------- dorms ---------- */}
      <section
        ref={resultsRef}
        className="shell"
        style={{
          paddingTop: 56,
          paddingBottom: 24,
          scrollMarginTop: 24
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'flex-end',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 22,
          }}
        >
          <div>
            <h2 className="t-section">
              {q ? `Matching "${search.trim()}"` : 'Top rated dorms'}
            </h2>

            <p
              className="t-body"
              style={{
                marginTop: 6,
                fontSize: 14,
              }}
            >
              {q
                ? `${visible.length} ${
                    visible.length === 1
                      ? 'building'
                      : 'buildings'
                  }`
                : 'The nine highest rated buildings students have reviewed so far.'}
            </p>
          </div>

          <div className="row wrap" style={{ gap: 10 }}>
            <Link href="/browse" className="btn btn-outline btn-sm">
              See all dorms
            </Link>
            <Link href="/submit" className="btn btn-soft btn-sm">
              Add a dorm
            </Link>
          </div>
        </div>

        <div className="grid-auto">
          {loading &&
            Array.from({
              length: 6,
            }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}

          {!loading &&
            visible.map((dorm) => (
              <DormCard
                key={dorm.id}
                dorm={dorm}
                rating={
                  summarize(
                    byDorm.get(dorm.id) ??
                      [],
                    dorm.avg_rating
                  ).value
                }
              />
            ))}
        </div>

        {!loading && loadFailed && (
          <div
            className="card"
            style={{
              padding: 40,
              textAlign: 'center',
              borderStyle: 'dashed',
              boxShadow: 'none',
            }}
          >
            <p
              className="t-card"
              style={{
                marginBottom: 6,
              }}
            >
              The dorm list did not load
            </p>

            <p
              className="t-body"
              style={{
                margin: '0 auto 18px',
              }}
            >
              The database did not answer. Your
              connection or the server is the likely
              cause, not your search.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !loadFailed &&
          visible.length === 0 && (
            <div
              className="card"
              style={{
                padding: 40,
                textAlign: 'center',
                borderStyle: 'dashed',
                boxShadow: 'none',
              }}
            >
              <p
                className="t-card"
                style={{
                  marginBottom: 6,
                }}
              >
                {q
                  ? `Nothing here matches "${search.trim()}"`
                  : 'No dorms yet'}
              </p>

              <p
                className="t-body"
                style={{
                  margin:
                    '0 auto 18px',
                }}
              >
                {q
                  ? 'Try the university name, or add the building yourself.'
                  : 'Add the first building and leave the first review.'}
              </p>

              <Link
                href="/submit"
                className="btn btn-primary"
              >
                Add a dorm
              </Link>
            </div>
          )}
      </section>

      {/* ---------- closing ---------- */}
      <section
        className="shell"
        style={{
          paddingTop: 32,
          paddingBottom: 72,
        }}
      >
        <div
          className="card-tint"
          style={{
            padding: '40px 36px',
            display: 'flex',
            gap: 28,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent:
              'space-between',
          }}
        >
          <div
            style={{
              flex: '1 1 320px',
            }}
          >
            <h2
              className="t-section"
              style={{
                color:
                  'var(--blue-900)',
              }}
            >
              Your building is missing
            </h2>

            <p
              className="t-body"
              style={{
                marginTop: 8,
              }}
            >
              It takes about a minute. Name,
              university, what the room had, and what
              you wish you had known before you moved
              in.
            </p>
          </div>

          <div
            className="row wrap"
            style={{
              gap: 12,
            }}
          >
            <Link
              href="/submit"
              className="btn btn-primary"
            >
              Add a dorm
            </Link>

            <Link
              href="/browse"
              className="btn btn-outline"
            >
              Browse by university
            </Link>
          </div>
        </div>
      </section>
            <AiChat dormContext={universities.join(', ')} />
    </main>
  )
}