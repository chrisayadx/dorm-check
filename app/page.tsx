'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Dorm = {
  id: string
  name: string
  university: string
  photo_url: string
  avg_rating: number
}

export default function HomePage() {
  const [dorms, setDorms] = useState<Dorm[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchDorms() {
      const { data } = await supabase
        .from('dorms')
        .select('*')
        .order('avg_rating', { ascending: false })
        .limit(6)
      if (data) setDorms(data)
    }
    fetchDorms()
  }, [])

  const filtered = dorms.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.university.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ fontFamily: 'sans-serif', color: '#1a1a1a' }}>

      {/* NAV */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', borderBottom: '1px solid #e5e5e5'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          Dorm<span style={{ color: '#4f46e5' }}>Check</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/browse" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>Browse dorms</Link>
          <Link href="/universities" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>Universities</Link>
          <Link href="/submit">
            <button style={primaryBtn}>Submit a dorm</button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        textAlign: 'center', padding: '4rem 2rem 3rem',
        maxWidth: '640px', margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-block', fontSize: '12px', color: '#4f46e5',
          background: '#eef2ff', borderRadius: '99px',
          padding: '4px 14px', marginBottom: '1.25rem',
          border: '1px solid #c7d2fe'
        }}>
          Student-powered dorm reviews
        </div>

        <h1 style={{ fontSize: '36px', fontWeight: '600', lineHeight: '1.2', marginBottom: '1rem' }}>
          Find your perfect dorm before move-in day
        </h1>

        <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.7', marginBottom: '2rem' }}>
          Real reviews from real students. Check ratings, amenities, photos,
          and insider tips for dorms at universities across the country.
        </p>

        {/* SEARCH BAR */}
        <div style={{ display: 'flex', gap: '8px', maxWidth: '480px', margin: '0 auto 1rem' }}>
          <input
            type="text"
            placeholder="Search by dorm name or university…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, padding: '0.65rem 1rem', borderRadius: '8px',
              border: '1px solid #ccc', fontSize: '14px'
            }}
          />
          <button style={primaryBtn}>Search</button>
        </div>

        <p style={{ fontSize: '13px', color: '#999' }}>
          or <Link href="/browse" style={{ color: '#4f46e5', textDecoration: 'none' }}>browse all universities →</Link>
        </p>
      </div>

      {/* STATS BAR */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '4rem',
        padding: '2rem', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5'
      }}>
        {[
          { num: '1,200+', label: 'Dorms listed' },
          { num: '8,400+', label: 'Student reviews' },
          { num: '340+',   label: 'Universities' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600' }}>{s.num}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURED DORMS */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
        <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Featured
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '1.5rem' }}>
          Top-rated dorms this semester
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {(search ? filtered : dorms).map((dorm) => (
            <Link key={dorm.id} href={`/dorms/${dorm.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                border: '1px solid #e5e5e5', borderRadius: '12px',
                overflow: 'hidden', cursor: 'pointer', background: 'white'
              }}>
                {dorm.photo_url ? (
                  <img
                    src={dorm.photo_url}
                    alt={dorm.name}
                    style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    height: '100px', background: '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px'
                  }}>🏠</div>
                )}
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{dorm.name}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{dorm.university}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(dorm.avg_rating || 0))}</span>
                    {' '}{dorm.avg_rating ? `${dorm.avg_rating}/5` : 'No ratings yet'}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {dorms.length === 0 && (
            <p style={{ color: '#aaa', gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
              No dorms yet — be the first to submit one!
            </p>
          )}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{
        maxWidth: '900px', margin: '0 auto', padding: '2rem 2rem 3rem',
        borderTop: '1px solid #e5e5e5'
      }}>
        <p style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          What you get
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '1.5rem' }}>
          Everything you need to decide
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { icon: '⭐', title: 'Honest reviews', desc: 'Star ratings and written feedback from students who actually lived there.' },
            { icon: 'ℹ️', title: 'Dorm facts', desc: 'Year built, amenities, floor count, and AC status — all in one place.' },
            { icon: '📸', title: 'Real photos', desc: 'Student-uploaded photos, not stock images from the housing office.' },
            { icon: '📤', title: 'Add your dorm', desc: "Don't see your building? Submit it and help future students." },
          ].map((f) => (
            <div key={f.title} style={{
              background: '#f9f9f9', border: '1px solid #e5e5e5',
              borderRadius: '12px', padding: '1.25rem'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{
        textAlign: 'center', padding: '3rem 2rem',
        borderTop: '1px solid #e5e5e5', background: '#f9f9f9'
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '0.75rem' }}>
          Know a dorm that's not listed?
        </h2>
        <p style={{ fontSize: '15px', color: '#666', marginBottom: '1.5rem' }}>
          Help your fellow students by adding a dorm and leaving the first review.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/submit">
            <button style={primaryBtn}>Submit a dorm</button>
          </Link>
          <Link href="/browse">
            <button style={outlineBtn}>Browse all universities</button>
          </Link>
        </div>
      </div>

    </main>
  )
}

const primaryBtn: React.CSSProperties = {
  background: '#4f46e5', color: 'white',
  border: 'none', borderRadius: '8px',
  padding: '0.6rem 1.25rem', fontSize: '14px',
  cursor: 'pointer', fontWeight: '500'
}

const outlineBtn: React.CSSProperties = {
  background: 'transparent', color: '#1a1a1a',
  border: '1px solid #ccc', borderRadius: '8px',
  padding: '0.6rem 1.25rem', fontSize: '14px',
  cursor: 'pointer'
}