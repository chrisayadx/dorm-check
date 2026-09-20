'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { summarize, groupByDorm } from '@/lib/ratings'
import { SiteFrame, CampusGround } from '../components/SiteFrame'
import { DormCard, CardSkeleton, type DormSummary } from '../components/DormCard'

function BrowseContent() {
  const searchParams = useSearchParams()
  const universityFilter = searchParams.get('university') ?? null
  const qParam = searchParams.get('q') ?? ''

  const [dorms, setDorms] = useState<DormSummary[]>([])
  const [reviews, setReviews] = useState<{ dorm_id: string; rating: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [search, setSearch] = useState(qParam)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => { setSearch(qParam) }, [qParam])

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
  const q = search.trim().toLowerCase()

  const visible = useMemo(() => {
    let result = dorms
    if (universityFilter) result = result.filter((d) => d.university === universityFilter)
    if (q)
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.university.toLowerCase().includes(q)
      )
    return result
  }, [dorms, universityFilter, q])

  return (
    <main>
      <section>
        <SiteFrame media={<CampusGround seed="browse" />}>
          <div className="hero-lead">
            <h1 className="t-hero" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', maxWidth: '22ch' }}>
              {universityFilter ?? 'Every dorm on DormCheck'}
            </h1>
            <p className="t-lead" style={{ margin: 0, maxWidth: '50ch' }}>
              {universityFilter
                ? `${visible.length} ${visible.length === 1 ? 'building' : 'buildings'} added by students who lived there.`
                : 'Browse every building students have added, or search by name.'}
            </p>
          </div>
        </SiteFrame>
      </section>

      <section className="shell" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', maxWidth: 460 }}>
            <label htmlFor="browse-search" style={{ position: 'absolute', left: -9999 }}>
              Search dorms
            </label>
            <input
              id="browse-search"
              className="input"
              type="search"
              placeholder={
                universityFilter
                  ? `Search ${universityFilter} dorms…`
                  : 'Search by dorm or university…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 'var(--r-pill)', padding: '12px 20px' }}
            />
          </div>
          {universityFilter && (
            <Link href="/universities" className="btn btn-quiet btn-sm">
              ← All universities
            </Link>
          )}
          <Link href="/submit" className="btn btn-soft btn-sm" style={{ marginLeft: 'auto' }}>
            Add a dorm
          </Link>
        </div>

        <div className="grid-auto">
          {loading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          {!loading && visible.map((dorm) => (
            <DormCard
              key={dorm.id}
              dorm={dorm}
              showUniversity={!universityFilter}
              rating={summarize(byDorm.get(dorm.id) ?? [], dorm.avg_rating).value}
            />
          ))}
        </div>

        {!loading && loadFailed && (
          <div className="card" style={{ padding: 48, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}>
            <p className="t-card" style={{ marginBottom: 6 }}>The dorm list did not load</p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>The database did not answer.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { setLoading(true); setLoadFailed(false); setReloadKey((k) => k + 1) }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !loadFailed && visible.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}>
            <p className="t-card" style={{ marginBottom: 6 }}>
              {q
                ? `Nothing matches "${search.trim()}"`
                : universityFilter
                ? `No dorms from ${universityFilter} yet`
                : 'No dorms yet'}
            </p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>
              Be the first to add a building.
            </p>
            <Link href="/submit" className="btn btn-primary">Add a dorm</Link>
          </div>
        )}
      </section>
    </main>
  )
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <main className="shell" style={{ paddingTop: 24 }}>
          <div className="card" style={{ height: 400, background: 'var(--blue-050)', borderStyle: 'dashed' }} />
        </main>
      }
    >
      <BrowseContent />
    </Suspense>
  )
}