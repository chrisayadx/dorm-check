'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { summarize, groupByDorm } from '@/lib/ratings'
import { SiteFrame, CampusGround } from '../components/SiteFrame'
import { DormCard, CardSkeleton, type DormSummary } from '../components/DormCard'
import { UniversityMark, initialsOf } from '../components/ui'

export default function BrowsePage() {
  const [dorms, setDorms] = useState<DormSummary[]>([])
  const [reviews, setReviews] = useState<{ dorm_id: string; rating: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  // reloadKey lets the retry button re-run this effect. The fetch is declared
  // inside the effect so the mount pass never sets state synchronously.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [dormsRes, reviewsRes] = await Promise.all([
        supabase.from('dorms').select('*').order('avg_rating', { ascending: false }),
        supabase.from('reviews').select('dorm_id, rating'),
      ])
      if (cancelled) return
      // A failed request and an empty database look identical once the rows
      // are gone, and "add the first dorm" is the wrong thing to say when the
      // query never came back. Keep them apart.
      if (dormsRes.error) {
        setLoadFailed(true)
        setLoading(false)
        return
      }
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

  const byDorm = useMemo(() => groupByDorm(reviews), [reviews])

  const grouped = useMemo(() => {
    const map = new Map<string, DormSummary[]>()
    for (const dorm of dorms) {
      const bucket = map.get(dorm.university)
      if (bucket) bucket.push(dorm)
      else map.set(dorm.university, [dorm])
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [dorms])

  const shown = active ? grouped.filter(([u]) => u === active) : grouped

  return (
    <main>
      <section>
        <SiteFrame media={<CampusGround seed="browse" />}>
          <div className="hero-lead">
            <h1 className="t-hero" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', maxWidth: '18ch' }}>
              Every building, by campus
            </h1>
            <p className="t-lead" style={{ margin: 0, maxWidth: '48ch' }}>
              Pick a university to narrow the list, or scroll through everything students
              have added so far.
            </p>
          </div>
        </SiteFrame>
      </section>

      <section className="shell" style={{ paddingTop: 32, paddingBottom: 72 }}>
        {grouped.length > 1 && (
          <div className="row wrap" style={{ gap: 8, marginBottom: 28 }}>
            <button
              type="button"
              className={`chip${active === null ? ' chip-on' : ''}`}
              onClick={() => setActive(null)}
            >
              All campuses
            </button>
            {grouped.map(([university, list]) => (
              <button
                key={university}
                type="button"
                className={`chip${active === university ? ' chip-on' : ''}`}
                onClick={() => setActive(university)}
              >
                {university} ({list.length})
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="grid-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading &&
          shown.map(([university, list]) => (
            <div key={university} style={{ marginBottom: 48 }}>
              <div className="row wrap" style={{ gap: 12, marginBottom: 18 }}>
                <UniversityMark initials={initialsOf(university)} size={38} />
                <div>
                  <h2 className="t-section" style={{ fontSize: 22 }}>
                    {university}
                  </h2>
                  <p className="t-meta">
                    {list.length} {list.length === 1 ? 'building' : 'buildings'}
                  </p>
                </div>
              </div>
              <div className="grid-auto">
                {list.map((dorm) => (
                  <DormCard
                    key={dorm.id}
                    dorm={dorm}
                    showUniversity={false}
                    rating={summarize(byDorm.get(dorm.id) ?? [], dorm.avg_rating).value}
                  />
                ))}
              </div>
            </div>
          ))}

        {!loading && loadFailed && (
          <div
            className="card"
            style={{ padding: 48, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}
          >
            <p className="t-card" style={{ marginBottom: 6 }}>
              The dorm list did not load
            </p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>
              The database did not answer. Nothing is missing, it just could not be
              fetched.
            </p>
            <button type="button" className="btn btn-primary" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {!loading && !loadFailed && dorms.length === 0 && (
          <div
            className="card"
            style={{ padding: 48, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}
          >
            <p className="t-card" style={{ marginBottom: 6 }}>
              Nothing here yet
            </p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>
              Add the first building and it shows up here straight away.
            </p>
            <Link href="/submit" className="btn btn-primary">
              Add a dorm
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
