'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SiteFrame, CampusGround } from '../components/SiteFrame'
import { UniversityMark, initialsOf } from '../components/ui'

type Entry = { name: string; count: number }

export default function UniversitiesPage() {
  const [dorms, setDorms] = useState<{ university: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('dorms')
      .select('university')
      .then(({ data }) => {
        setDorms(data ?? [])
        setLoading(false)
      })
  }, [])

  const universities = useMemo<Entry[]>(() => {
    const map = new Map<string, number>()
    for (const d of dorms) map.set(d.university, (map.get(d.university) ?? 0) + 1)
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }, [dorms])

  const q = search.trim().toLowerCase()
  const visible = q
    ? universities.filter((u) => u.name.toLowerCase().includes(q))
    : universities

  return (
    <main>
      <section>
        <SiteFrame media={<CampusGround seed="universities" />}>
          <div className="hero-lead">
            <h1 className="t-hero" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', maxWidth: '18ch' }}>
              Find your campus
            </h1>
            <p className="t-lead" style={{ margin: 0, maxWidth: '48ch' }}>
              Search for your school to see every building students have added.
            </p>
          </div>
        </SiteFrame>
      </section>

      <section className="shell" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <div style={{ maxWidth: 540, marginBottom: 28 }}>
          <label htmlFor="uni-search" style={{ position: 'absolute', left: -9999 }}>
            Search universities
          </label>
          <input
            id="uni-search"
            className="input"
            type="search"
            placeholder="Search your university…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{ fontSize: 16, padding: '15px 22px', borderRadius: 'var(--r-pill)' }}
          />
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="card"
                style={{ height: 72, background: 'var(--blue-050)', borderStyle: 'dashed', boxShadow: 'none' }}
              />
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="card" style={{ padding: 48, textAlign: 'center', borderStyle: 'dashed', boxShadow: 'none' }}>
            <p className="t-card" style={{ marginBottom: 6 }}>
              {q ? `No universities matching "${search.trim()}"` : 'No universities yet'}
            </p>
            <p className="t-body" style={{ margin: '0 auto 18px' }}>
              {q
                ? 'Try a different spelling — or be the first to add a dorm from your campus.'
                : 'Add the first building to get started.'}
            </p>
            <Link href="/submit" className="btn btn-primary">Add a dorm</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(({ name, count }) => (
            <Link
              key={name}
              href={`/browse?university=${encodeURIComponent(name)}`}
              className="dorm-card card"
              style={{
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <UniversityMark initials={initialsOf(name)} size={44} />
              <div style={{ flex: 1 }}>
                <div className="t-card">{name}</div>
                <div className="t-meta" style={{ marginTop: 2 }}>
                  {count} {count === 1 ? 'building' : 'buildings'}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M6 3l5 5-5 5"
                  stroke="var(--ink-400)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}