'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SiteFrame, CampusGround } from '../components/SiteFrame'
import universityPhotos from '@/lib/university-photos.json'

const COMMON_AMENITIES = [
  'AC',
  'Laundry',
  'Gym',
  'Dining Hall',
  'Study Rooms',
  'Kitchen',
  'Elevator',
  'Bike Storage',
]

const VIBES = ['Social', 'Quiet', 'Mixed', 'Studious', 'Party']

export default function SubmitDormPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [location, setLocation] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [vibe, setVibe] = useState<string | null>(null)
  const [coed, setCoed] = useState<boolean | null>(null)
  const [amenities, setAmenities] = useState<string[]>([])
  const [buildingInfo, setBuildingInfo] = useState('')
  const [nearby, setNearby] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleAmenity(item: string) {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    )
  }

  function pickPhoto(file: File | null) {
    setPhotoFile(file)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !university.trim()) {
      setError('A building needs at least a name and a university.')
      return
    }

    setSubmitting(true)
    setError(null)

    let photo_url = ''
    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name.replace(/[^\w.-]/g, '_')}`
      const { error: uploadError } = await supabase.storage
        .from('dorm-photos')
        .upload(fileName, photoFile)

      if (uploadError) {
        setError('The photo did not upload. Post without it, or try a smaller file.')
        setSubmitting(false)
        return
      }
      photo_url = supabase.storage.from('dorm-photos').getPublicUrl(fileName).data.publicUrl
    }

    const { data, error: insertError } = await supabase
      .from('dorms')
      .insert({
        name: name.trim(),
        university: university.trim(),
        location: location.trim() || null,
        year_built: yearBuilt ? parseInt(yearBuilt, 10) : null,
        vibe,
        coed,
        amenities,
        building_info: buildingInfo.trim() || null,
        nearby_places: nearby.trim() || null,
        photo_url,
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('That did not save. Check your connection and post again.')
      setSubmitting(false)
      return
    }

    router.push(`/dorms/${data.id}`)
  }
  // One fixed campus shot. This page has no school context, and a hero that
  // changes between renders would be noise on a form.
  const photos = universityPhotos as Record<string, { url: string }>
  const submitHero =
    photos['University of Virginia']?.url.replace(
      'thumb.wikimedia.org',
      'upload.wikimedia.org'
    ) ?? null

  return (
    <main>
      <section>
        <SiteFrame
          media={<CampusGround seed="submit" />}
          bgPhoto={submitHero}
          action={
            <Link href="/" className="btn btn-outline btn-sm">
              All dorms
            </Link>
          }
        >
          <div className="hero-lead">
            <h1 className="t-hero" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', maxWidth: '17ch' }}>
              Add the building you lived in
            </h1>
            <p className="t-lead" style={{ margin: 0, maxWidth: '50ch' }}>
              Only the name and university are required. Everything else fills in the
              gaps that the next student will be looking at.
            </p>
          </div>
        </SiteFrame>
      </section>

      <section className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760 }}
        >
          {/* --- identity --- */}
          <fieldset className="card" style={{ padding: '26px 28px', border: '1px solid var(--border)' }}>
            <legend className="t-card" style={{ padding: '0 8px' }}>
              The basics
            </legend>
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                marginTop: 12,
              }}
            >
              <label className="field">
                <span className="field-label">Dorm name</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Slusher Tower"
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">University</span>
                <input
                  className="input"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Virginia Tech"
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Address</span>
                <input
                  className="input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where on campus it sits"
                />
              </label>
              <label className="field">
                <span className="field-label">Year built</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1800}
                  max={2100}
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="1968"
                />
              </label>
            </div>
          </fieldset>

          {/* --- character --- */}
          <fieldset className="card" style={{ padding: '26px 28px' }}>
            <legend className="t-card" style={{ padding: '0 8px' }}>
              What it is like
            </legend>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
              <div className="field">
                <span className="field-label">Vibe</span>
                <div className="row wrap" style={{ gap: 8 }}>
                  {VIBES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVibe(vibe === v ? null : v)}
                      aria-pressed={vibe === v}
                      className={`chip${vibe === v ? ' chip-on' : ''}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field-label">Floors</span>
                <div className="row wrap" style={{ gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCoed(coed === true ? null : true)}
                    aria-pressed={coed === true}
                    className={`chip${coed === true ? ' chip-on' : ''}`}
                  >
                    Co-ed floors
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoed(coed === false ? null : false)}
                    aria-pressed={coed === false}
                    className={`chip${coed === false ? ' chip-on' : ''}`}
                  >
                    Single-gender floors
                  </button>
                </div>
              </div>

              <div className="field">
                <span className="field-label">Amenities</span>
                <div className="row wrap" style={{ gap: 8 }}>
                  {COMMON_AMENITIES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      aria-pressed={amenities.includes(a)}
                      className={`chip${amenities.includes(a) ? ' chip-on' : ''}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* --- the parts nobody can look up --- */}
          <fieldset className="card" style={{ padding: '26px 28px' }}>
            <legend className="t-card" style={{ padding: '0 8px' }}>
              What you only know from living there
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <label className="field">
                <span className="field-label">What is in the building</span>
                <textarea
                  className="input"
                  value={buildingInfo}
                  onChange={(e) => setBuildingInfo(e.target.value)}
                  placeholder="Study lounges, learning communities, practice rooms, which floor has the good printer."
                />
              </label>
              <label className="field">
                <span className="field-label">What is nearby</span>
                <textarea
                  className="input"
                  value={nearby}
                  onChange={(e) => setNearby(e.target.value)}
                  placeholder="Closest dining hall, the gym, bus stops, and how long the walk to class really takes."
                />
              </label>
            </div>
          </fieldset>

          {/* --- photo --- */}
          <fieldset className="card" style={{ padding: '26px 28px' }}>
            <legend className="t-card" style={{ padding: '0 8px' }}>
              Photo
            </legend>
            <p className="t-body" style={{ fontSize: 13.5, margin: '8px 0 14px' }}>
              Listings without a photo show an illustrated facade instead. One real
              picture of the building replaces it everywhere.
            </p>

            <label
              style={{
                display: 'block',
                border: '1.5px dashed #cfdcf2',
                borderRadius: 'var(--r-md)',
                padding: photoPreview ? 10 : 28,
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fbfcff',
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              />
              {photoPreview ? (
                <span style={{ display: 'block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt=""
                    style={{
                      width: '100%',
                      maxHeight: 260,
                      objectFit: 'cover',
                      borderRadius: 'var(--r-sm)',
                      display: 'block',
                    }}
                  />
                  <span className="t-meta" style={{ display: 'block', marginTop: 10 }}>
                    {photoFile?.name} · choose another to replace it
                  </span>
                </span>
              ) : (
                <span>
                  <span style={{ display: 'block', fontWeight: 700, marginBottom: 4 }}>
                    Choose a photo
                  </span>
                  <span className="t-meta">A picture of the building from outside works best</span>
                </span>
              )}
            </label>
          </fieldset>

          {error && (
            <p
              role="alert"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--clay-600)',
                background: 'var(--clay-050)',
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <div className="row wrap" style={{ gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting' : 'Post this dorm'}
            </button>
            <Link href="/" className="btn btn-quiet">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
