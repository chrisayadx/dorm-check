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
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data }, { data: reviewRows }] = await Promise.all([
        supabase.from('dorms').select('*').order('avg_rating', { ascending: false }),
        supabase.from('reviews').select('dorm_id, rating'),
      ])
      setDorms(data ?? [])
      setReviews(reviewRows ?? [])
      setLoading(false)
    }
    load()
  }, [])

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
      <section className="shell" style={{ paddingTop: 24 }}>
        <SiteFrame media={<CampusGround seed="browse" />}>
          <div style={{ padding: '30px 34px 104px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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

        {!loading && dorms.length === 0 && (
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
