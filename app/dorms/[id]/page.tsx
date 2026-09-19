'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { summarize } from '@/lib/ratings'
import { SiteFrame, CampusGround, GroundPhoto } from '../../components/SiteFrame'
import { Rating, UniversityMark, initialsOf } from '../../components/ui'

type Dorm = {
  id: string
  name: string
  university: string
  photo_url: string | null
  avg_rating: number | null
  year_built: number | null
  amenities: string[] | null
  vibe: string | null
  coed: boolean | null
  nearby_places: string | null
  building_info: string | null
  location: string | null
}

type Review = {
  id: string
  author_name: string
  rating: number
  body: string
  created_at: string
}

export default function DormPage() {
  const { id } = useParams<{ id: string }>()
  const [dorm, setDorm] = useState<Dorm | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: dormData }, { data: reviewData }] = await Promise.all([
        supabase.from('dorms').select('*').eq('id', id).single(),
        supabase
          .from('reviews')
          .select('*')
          .eq('dorm_id', id)
          .order('created_at', { ascending: false }),
      ])
      setDorm(dormData)
      setReviews(reviewData || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !body.trim()) {
      setError('Add your name and a few words about the room before posting.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({ dorm_id: id, author_name: authorName.trim(), rating, body: body.trim() })
      .select()
      .single()

    if (insertError || !data) {
      setError('That did not save. Check your connection and post again.')
    } else {
      setReviews([data, ...reviews])
      setAuthorName('')
      setBody('')
      setRating(5)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <main className="shell" style={{ paddingTop: 24 }}>
        <div
          className="card"
          style={{ height: 420, background: 'var(--blue-050)', borderStyle: 'dashed' }}
        />
      </main>
    )
  }

  if (!dorm) {
    return (
      <main className="shell" style={{ paddingTop: 80, textAlign: 'center' }}>
        <h1 className="t-section">That dorm is not here</h1>
        <p className="t-body" style={{ margin: '10px auto 22px' }}>
          The link may be out of date, or the building was never added.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to all dorms
        </Link>
      </main>
    )
  }

  const score = summarize(reviews, dorm.avg_rating)

  return (
    <main>
      <section className="shell" style={{ paddingTop: 24 }}>
        <SiteFrame
          media={
            dorm.photo_url ? (
              <GroundPhoto src={dorm.photo_url} />
            ) : (
              <CampusGround seed={dorm.id} />
            )
          }
          action={
            <Link href="/" className="btn btn-outline btn-sm">
              All dorms
            </Link>
          }
        >
          <div style={{ padding: '30px 34px 104px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="row wrap" style={{ gap: 12 }}>
              <UniversityMark initials={initialsOf(dorm.university)} size={40} />
              <div>
                <h1 className="t-hero" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)' }}>
                  {dorm.name}
                </h1>
                <p className="t-meta" style={{ fontSize: 14, marginTop: 2 }}>
                  {dorm.university}
                  {dorm.location ? ` · ${dorm.location}` : ''}
                </p>
              </div>
            </div>

            <Rating value={score.value} count={score.count} size="lg" />

            {dorm.amenities && dorm.amenities.length > 0 && (
              <div className="row wrap" style={{ gap: 8 }}>
                {dorm.amenities.map((a) => (
                  <span key={a} className="chip">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </SiteFrame>
      </section>

      <section
        className="shell detail-grid"
        style={{ paddingTop: 40, paddingBottom: 72 }}
      >
        {/* ---------- left: what is known about the building ---------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div className="card" style={{ padding: '26px 28px' }}>
            <h2 className="t-section" style={{ marginBottom: 18 }}>
              The building
            </h2>
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              }}
            >
              <Fact label="Built" value={dorm.year_built ? String(dorm.year_built) : null} />
              <Fact label="Address" value={dorm.location} invite="Not added yet" />
              <Fact label="Vibe" value={dorm.vibe} invite="Not described yet" />
              <Fact
                label="Floors"
                value={
                  dorm.coed === null ? null : dorm.coed ? 'Co-ed floors' : 'Single-gender floors'
                }
                invite="Not recorded"
              />
            </div>
          </div>

          <Prose
            title="What is in the building"
            value={dorm.building_info}
            invite="Study lounges, learning communities, practice rooms, the good vending machine. Nobody has filled this in for this building yet."
          />

          <Prose
            title="What is nearby"
            value={dorm.nearby_places}
            invite="Dining halls, the gym, bus stops, how long the walk to class actually takes. Still empty for this building."
          />

          {/* ---------- reviews ---------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 className="t-section">
              {reviews.length === 0
                ? 'No reviews yet'
                : reviews.length === 1
                  ? '1 review'
                  : `${reviews.length} reviews`}
            </h2>

            {reviews.length === 0 && (
              <div
                className="card"
                style={{ padding: 32, borderStyle: 'dashed', boxShadow: 'none', textAlign: 'center' }}
              >
                <p className="t-body" style={{ margin: '0 auto' }}>
                  Nobody has written about living here. If you did, the form beside this
                  is the whole job.
                </p>
              </div>
            )}

            {reviews.map((r) => (
              <article key={r.id} className="card" style={{ padding: '20px 24px' }}>
                <div
                  className="row wrap"
                  style={{ justifyContent: 'space-between', gap: 12, marginBottom: 10 }}
                >
                  <span style={{ fontWeight: 700 }}>{r.author_name}</span>
                  <Rating value={r.rating} size="sm" />
                </div>
                <p className="t-body" style={{ margin: 0 }}>
                  {r.body}
                </p>
                <p className="t-meta" style={{ marginTop: 10, fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* ---------- right: write one ---------- */}
        <form
          onSubmit={submitReview}
          className="card"
          style={{
            padding: '26px 26px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 24,
          }}
        >
          <div>
            <h2 className="t-section" style={{ fontSize: 21 }}>
              Write a review
            </h2>
            <p className="t-body" style={{ fontSize: 13.5, marginTop: 4 }}>
              What would you tell someone about to sign for this building?
            </p>
          </div>

          <label className="field">
            <span className="field-label">Your name</span>
            <input
              className="input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="First name is fine"
            />
          </label>

          <div className="field">
            <span className="field-label">Rating</span>
            <div className="row wrap" style={{ gap: 7 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-pressed={rating === n}
                  className={`chip${rating === n ? ' chip-on' : ''}`}
                  style={{ minWidth: 42, justifyContent: 'center' }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field-label">Your experience</span>
            <textarea
              className="input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Room size, noise, heat in September, how far the laundry is."
            />
          </label>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--clay-600)', fontWeight: 600 }} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Posting' : 'Post review'}
          </button>
        </form>
      </section>
    </main>
  )
}

/** A single fact. Missing facts stay visible as an invitation rather than "N/A". */
function Fact({ label, value, invite }: { label: string; value: string | null; invite?: string }) {
  const empty = !value
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--r-md)',
        background: empty ? 'transparent' : 'var(--blue-050)',
        border: empty ? '1px dashed #cfdcf2' : '1px solid var(--border-soft)',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-400)', marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: empty ? 500 : 700,
          color: empty ? 'var(--ink-300)' : 'var(--ink-900)',
        }}
      >
        {value ?? invite ?? 'Not recorded'}
      </div>
    </div>
  )
}

function Prose({ title, value, invite }: { title: string; value: string | null; invite: string }) {
  return (
    <div
      className="card"
      style={{
        padding: '24px 28px',
        borderStyle: value ? 'solid' : 'dashed',
        boxShadow: value ? undefined : 'none',
      }}
    >
      <h2 className="t-section" style={{ fontSize: 20, marginBottom: 8 }}>
        {title}
      </h2>
      <p className="t-body" style={{ margin: 0, color: value ? 'var(--ink-500)' : 'var(--ink-300)' }}>
        {value ?? invite}
      </p>
    </div>
  )
}
