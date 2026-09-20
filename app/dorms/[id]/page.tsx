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
  room_number?: string | null
  room_type?: string | null
  floor?: number | null
  has_ac?: boolean | null
  bathroom_type?: string | null
  proximity_notes?: string | null
  year_lived?: number | null
  photos?: string[] | null
  
}

const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Suite']
const BATHROOM_TYPES = ['Private', 'Shared hall', 'Suite style', 'Pod style']
const PROXIMITY_OPTIONS = [
  'Near stairs',
  'Near elevator',
  'Near entrance',
  'End of hall',
  'Middle of hall',
  'Corner room',
]

export default function DormPage() {
  const { id } = useParams<{ id: string }>()
  const [dorm, setDorm] = useState<Dorm | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState<string | null>(null)
  const [floor, setFloor] = useState('')
  const [hasAc, setHasAc] = useState<boolean | null>(null)
  const [bathroomType, setBathroomType] = useState<string | null>(null)
  const [proximity, setProximity] = useState<string[]>([])
  const [yearLived, setYearLived] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  

  useEffect(() => {
    async function load() {
      const [{ data: dormData }, { data: reviewData }] = await Promise.all([
        supabase.from('dorms').select('*').eq('id', id).single(),
        supabase.from('reviews').select('*').eq('dorm_id', id).order('created_at', { ascending: false }),
      ])
      setDorm(dormData)
      setReviews(reviewData || [])
      setLoading(false)
    }
    load()
  }, [id])

  function toggleProximity(p: string) {
    setProximity((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

// Object URLs have to be revoked or the page leaks blobs as people swap
  // photos. Cap at three so one review can't dominate the page.
  function pickPhotos(files: FileList | null) {
    if (!files) return
    const next = Array.from(files).slice(0, 3)
    setPhotoFiles(next)
    setPhotoPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u))
      return next.map((f) => URL.createObjectURL(f))
    })
  }
  
  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !body.trim()) {
      setError('Add your name and a few words about the room before posting.')
      return
    }
    setSubmitting(true)
    setError(null)

// Photos go up first. A failed upload shouldn't lose the written review,
    // so a failure here posts the text without the images rather than aborting.
    console.log('FILES TO UPLOAD:', photoFiles.length)
    const photoUrls: string[] = []
    for (const file of photoFiles) {
      const safeName = `${id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
      const { error: upErr } = await supabase.storage
        .from('dorm-photos')
        .upload(safeName, file)
      if (upErr) { console.error('UPLOAD FAILED:', upErr); continue }
        photoUrls.push(
        supabase.storage.from('dorm-photos').getPublicUrl(safeName).data.publicUrl
      )
    }
    console.log('UPLOADED URLS:', photoUrls)
    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        dorm_id: id,
        author_name: authorName.trim(),
        rating,
        body: body.trim(),
        photos: photoUrls.length > 0 ? photoUrls : null,
        room_number: roomNumber.trim() || null,
        room_type: roomType,
        floor: floor ? parseInt(floor, 10) : null,
        has_ac: hasAc,
        bathroom_type: bathroomType,
        proximity_notes: proximity.length > 0 ? proximity.join(', ') : null,
        year_lived: yearLived ? parseInt(yearLived, 10) : null,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('That did not save. Check your connection and post again.')
    } else {
      console.log('INSERTED REVIEW:', data)
      setReviews([data, ...reviews])
      setAuthorName('')
      setBody('')
      setRating(5)
      setRoomNumber('')
      setRoomType(null)
      setFloor('')
      setHasAc(null)
      setBathroomType(null)
      setProximity([])
      setYearLived('')
      photoPreviews.forEach((u) => URL.revokeObjectURL(u))
      setPhotoFiles([])
      setPhotoPreviews([])
      photoPreviews.forEach((u) => URL.revokeObjectURL(u))
      setPhotoFiles([])
      setPhotoPreviews([])  
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <main className="shell" style={{ paddingTop: 24 }}>
        <div className="card" style={{ height: 420, background: 'var(--blue-050)', borderStyle: 'dashed' }} />
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
        <Link href="/" className="btn btn-primary">Back to all dorms</Link>
      </main>
    )
  }

  const score = summarize(reviews, dorm.avg_rating)

  return (
    <main>
      <section>
        <SiteFrame
          media={dorm.photo_url ? <GroundPhoto src={dorm.photo_url} /> : <CampusGround seed={dorm.id} />}
          action={<Link href="/" className="btn btn-outline btn-sm">All dorms</Link>}
        >
          <div className="hero-lead">
            <div className="row wrap" style={{ gap: 12 }}>
              <UniversityMark initials={initialsOf(dorm.university)} size={40} />
              <div>
                <h1 className="t-hero" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)' }}>
                  {dorm.name}
                </h1>
                <p className="t-meta" style={{ fontSize: 14, marginTop: 2 }}>
                  {dorm.university}{dorm.location ? ` · ${dorm.location}` : ''}
                </p>
              </div>
            </div>

            <Rating value={score.value} count={score.count} size="lg" />

            {dorm.amenities && dorm.amenities.length > 0 && (
              <div className="row wrap" style={{ gap: 8 }}>
                {dorm.amenities.map((a) => (
                  <span key={a} className="chip">{a}</span>
                ))}
              </div>
            )}
          </div>
        </SiteFrame>
      </section>

      <section className="shell detail-grid" style={{ paddingTop: 40, paddingBottom: 72 }}>
        {/* left: building info + reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div className="card" style={{ padding: '26px 28px' }}>
            <h2 className="t-section" style={{ marginBottom: 18 }}>The building</h2>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))' }}>
              <Fact label="Built" value={dorm.year_built ? String(dorm.year_built) : null} />
              <Fact label="Address" value={dorm.location} invite="Not added yet" />
              <Fact label="Vibe" value={dorm.vibe} invite="Not described yet" />
              <Fact
                label="Floors"
                value={dorm.coed === null ? null : dorm.coed ? 'Co-ed floors' : 'Single-gender floors'}
                invite="Not recorded"
              />
            </div>
          </div>

          <Prose
            title="What is in the building"
            value={dorm.building_info}
            invite="Study lounges, learning communities, practice rooms, the good vending machine. Nobody has filled this in yet."
          />

          <Prose
            title="What is nearby"
            value={dorm.nearby_places}
            invite="Dining halls, the gym, bus stops, how long the walk to class actually takes. Still empty for this building."
          />

          {/* Reviews list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 className="t-section">
              {reviews.length === 0 ? 'No reviews yet' : reviews.length === 1 ? '1 review' : `${reviews.length} reviews`}
            </h2>

            {reviews.length === 0 && (
              <div className="card" style={{ padding: 32, borderStyle: 'dashed', boxShadow: 'none', textAlign: 'center' }}>
                <p className="t-body" style={{ margin: '0 auto' }}>
                  Nobody has written about living here. If you did, the form beside this is the whole job.
                </p>
              </div>
            )}

            {reviews.map((r) => (
              <article key={r.id} className="card" style={{ padding: '20px 24px' }}>
                <div className="row wrap" style={{ justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{r.author_name}</span>
                  <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
                    {r.year_lived && (
                      <span className="t-meta">{r.year_lived}–{r.year_lived + 1}</span>
                    )}
                    <Rating value={r.rating} size="sm" />
                  </div>
                </div>

                {(r.room_number || r.room_type || r.floor || r.has_ac != null || r.bathroom_type) && (
                  <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
                    {r.room_number && <span className="chip" style={{ fontSize: 12, padding: '4px 10px' }}>Room {r.room_number}</span>}
                    {r.floor && <span className="chip" style={{ fontSize: 12, padding: '4px 10px' }}>Floor {r.floor}</span>}
                    {r.room_type && <span className="chip" style={{ fontSize: 12, padding: '4px 10px' }}>{r.room_type}</span>}
                    {r.has_ac === true && (
                      <span className="chip" style={{ fontSize: 12, padding: '4px 10px', color: 'var(--green-600)', background: 'var(--green-050)', borderColor: 'var(--green-600)' }}>
                        AC ✓
                      </span>
                    )}
                    {r.has_ac === false && (
                      <span className="chip" style={{ fontSize: 12, padding: '4px 10px', color: 'var(--clay-600)', background: 'var(--clay-050)' }}>
                        No AC
                      </span>
                    )}
                    {r.bathroom_type && <span className="chip" style={{ fontSize: 12, padding: '4px 10px' }}>{r.bathroom_type} bath</span>}
                  </div>
                )}

                {r.proximity_notes && (
                  <p className="t-meta" style={{ marginBottom: 8, fontSize: 12 }}>📍 {r.proximity_notes}</p>
                )}

                <p className="t-body" style={{ margin: 0 }}>{r.body}</p>
                
                {r.photos && r.photos.length > 0 && (
                  <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                    {r.photos.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt=""
                        loading="lazy"
                        style={{
                          width: 128,
                          height: 96,
                          objectFit: 'cover',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          display: 'block',
                        }}
                      />
                    ))}
                  </div>
                )}
                <p className="t-meta" style={{ marginTop: 10, fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* right: review form */}
        <form
          onSubmit={submitReview}
          className="card"
          style={{ padding: '26px 26px 28px', display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}
        >
          <div>
            <h2 className="t-section" style={{ fontSize: 21 }}>Write a review</h2>
            <p className="t-body" style={{ fontSize: 13.5, marginTop: 4 }}>
              What would you tell someone about to sign for this building?
            </p>
          </div>

          <label className="field">
            <span className="field-label">Your name</span>
            <input className="input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="First name is fine" />
          </label>

          <div className="field">
            <span className="field-label">Rating</span>
            <div className="row wrap" style={{ gap: 7 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-pressed={rating === n} className={`chip${rating === n ? ' chip-on' : ''}`} style={{ minWidth: 42, justifyContent: 'center' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field-label">Your experience</span>
            <textarea className="input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Room size, noise, heat in September, how far the laundry is." />
          </label>

          <div className="field">
            <span className="field-label">
              Photos <span style={{ fontWeight: 500 }}>(up to 3, optional)</span>
            </span>

            <label
              style={{
                display: 'block',
                border: '1.5px dashed #cfdcf2',
                borderRadius: 'var(--r-md)',
                padding: photoPreviews.length > 0 ? 10 : 20,
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fbfcff',
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => pickPhotos(e.target.files)}
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              />
              {photoPreviews.length > 0 ? (
                <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {photoPreviews.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt=""
                      style={{
                        width: 76,
                        height: 58,
                        objectFit: 'cover',
                        borderRadius: 'var(--r-sm)',
                        display: 'block',
                      }}
                    />
                  ))}
                  <span className="t-meta" style={{ display: 'block', width: '100%', marginTop: 6 }}>
                    Choose again to replace
                  </span>
                </span>
              ) : (
                <span className="t-meta">Add a photo of the room</span>
              )}
            </label>
          </div>

          <hr className="divider" />
          <p className="field-label" style={{ color: 'var(--ink-500)', marginBottom: -4 }}>
            Room details <span style={{ fontWeight: 500 }}>(optional)</span>
          </p>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">
              <span className="field-label">Room #</span>
              <input className="input" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 312" style={{ padding: '10px 14px' }} />
            </label>
            <label className="field">
              <span className="field-label">Year lived</span>
              <input className="input" type="number" inputMode="numeric" min={2000} max={2030} value={yearLived} onChange={(e) => setYearLived(e.target.value)} placeholder="e.g. 2023" style={{ padding: '10px 14px' }} />
            </label>
          </div>

          <label className="field" style={{ maxWidth: 140 }}>
            <span className="field-label">Floor</span>
            <input className="input" type="number" inputMode="numeric" min={1} max={60} value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor #" style={{ padding: '10px 14px' }} />
          </label>

          <div className="field">
            <span className="field-label">Room type</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {ROOM_TYPES.map((t) => (
                <button key={t} type="button" className={`chip${roomType === t ? ' chip-on' : ''}`} aria-pressed={roomType === t} onClick={() => setRoomType(roomType === t ? null : t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Air conditioning</span>
            <div className="row wrap" style={{ gap: 6 }}>
              <button type="button" className={`chip${hasAc === true ? ' chip-on' : ''}`} aria-pressed={hasAc === true} onClick={() => setHasAc(hasAc === true ? null : true)}>Has AC</button>
              <button type="button" className={`chip${hasAc === false ? ' chip-on' : ''}`} aria-pressed={hasAc === false} onClick={() => setHasAc(hasAc === false ? null : false)}>No AC</button>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Bathroom</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {BATHROOM_TYPES.map((t) => (
                <button key={t} type="button" className={`chip${bathroomType === t ? ' chip-on' : ''}`} aria-pressed={bathroomType === t} onClick={() => setBathroomType(bathroomType === t ? null : t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Location in building</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {PROXIMITY_OPTIONS.map((p) => (
                <button key={p} type="button" className={`chip${proximity.includes(p) ? ' chip-on' : ''}`} aria-pressed={proximity.includes(p)} onClick={() => toggleProximity(p)}>{p}</button>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--clay-600)', fontWeight: 600 }} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting ? 'Posting…' : 'Post review'}
          </button>
        </form>
      </section>
    </main>
  )
}

function Fact({ label, value, invite }: { label: string; value: string | null; invite?: string }) {
  const empty = !value
  return (
    <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: empty ? 'transparent' : 'var(--blue-050)', border: empty ? '1px dashed #cfdcf2' : '1px solid var(--border-soft)' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-400)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: empty ? 500 : 700, color: empty ? 'var(--ink-300)' : 'var(--ink-900)' }}>
        {value ?? invite ?? 'Not recorded'}
      </div>
    </div>
  )
}

function Prose({ title, value, invite }: { title: string; value: string | null; invite: string }) {
  return (
    <div className="card" style={{ padding: '24px 28px', borderStyle: value ? 'solid' : 'dashed', boxShadow: value ? undefined : 'none' }}>
      <h2 className="t-section" style={{ fontSize: 20, marginBottom: 8 }}>{title}</h2>
      <p className="t-body" style={{ margin: 0, color: value ? 'var(--ink-500)' : 'var(--ink-300)' }}>
        {value ?? invite}
      </p>
    </div>
  )
}