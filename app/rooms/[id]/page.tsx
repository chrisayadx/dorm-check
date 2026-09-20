'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Room = {
  id: string
  dorm_id: string
  room_number: string
  room_type: string
  approx_size: number
  bathroom_type: string
  has_ac: boolean
  has_laundry: boolean
  has_kitchen: boolean
  avg_rating: number
}

type RoomReview = {
  id: string
  author_name: string
  rating: number
  body: string
  photos: string[]
  created_at: string
}

export default function RoomPage() {
  const { id } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [dormName, setDormName] = useState('')
  const [reviews, setReviews] = useState<RoomReview[]>([])
  const [loading, setLoading] = useState(true)

  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: roomData } = await supabase
        .from('rooms').select('*').eq('id', id).single()
      setRoom(roomData)

      if (roomData?.dorm_id) {
        const { data: dormData } = await supabase
          .from('dorms').select('name').eq('id', roomData.dorm_id).single()
        setDormName(dormData?.name || '')
      }

      const { data: reviewData } = await supabase
        .from('room_reviews').select('*').eq('room_id', id)
        .order('created_at', { ascending: false })
      setReviews(reviewData || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function submitReview() {
    if (!body || !authorName) return alert('Please fill in all fields')
    setSubmitting(true)

    let photoUrls: string[] = []

    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`
      const { error } = await supabase.storage.from('dorm-photos').upload(fileName, photoFile)
      if (!error) {
        const { data: urlData } = supabase.storage.from('dorm-photos').getPublicUrl(fileName)
        photoUrls = [urlData.publicUrl]
      }
    }

    const { error } = await supabase.from('room_reviews').insert({
      room_id: id, author_name: authorName, rating, body, photos: photoUrls,
    })

    if (error) { alert('Error submitting review'); console.error(error) }
    else {
      setReviews([{ id: Date.now().toString(), author_name: authorName, rating, body, photos: photoUrls, created_at: new Date().toISOString() }, ...reviews])
      setAuthorName(''); setBody(''); setRating(5); setPhotoFile(null)
    }
    setSubmitting(false)
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>
  if (!room) return <p style={{ padding: '2rem' }}>Room not found.</p>

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link href={`/dorms/${room.dorm_id}`} style={{ color: '#4f46e5', fontSize: '0.9rem' }}>
        ← Back to {dormName}
      </Link>

      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '1rem 0 0.25rem' }}>
        Room {room.room_number}
      </h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>{dormName}</p>

      {/* WHAT YOU'RE GETTING */}
      <div style={sectionStyle}>
        <h2 style={sectionHeader}>What you're getting</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          <InfoTile label="Room Type" value={room.room_type || 'Unknown'} />
          <InfoTile label="Approx Size" value={room.approx_size ? `${room.approx_size} sq ft` : 'Unknown'} />
          <InfoTile label="Bathroom" value={room.bathroom_type || 'Unknown'} />
          <InfoTile label="Rating" value={room.avg_rating ? `${room.avg_rating} / 5` : 'No ratings yet'} />
        </div>
      </div>

      {/* FEATURES */}
      <div style={sectionStyle}>
        <h2 style={sectionHeader}>Features</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Feature label="AC" available={room.has_ac} />
          <Feature label="Laundry" available={room.has_laundry} />
          <Feature label="Kitchen" available={room.has_kitchen} />
        </div>
      </div>

      {/* PHOTOS FROM PAST RESIDENTS */}
      {reviews.some(r => r.photos?.length > 0) && (
        <div style={sectionStyle}>
          <h2 style={sectionHeader}>Photos from past residents</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {reviews.flatMap(r => r.photos || []).map((url, i) => (
              <img key={i} src={url} alt="Room photo"
                style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
            ))}
          </div>
        </div>
      )}

      {/* REVIEW FORM */}
      <div style={sectionStyle}>
        <h2 style={sectionHeader}>Leave a Review</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input placeholder="Your name" value={authorName} onChange={e => setAuthorName(e.target.value)} style={inputStyle} />
          <select value={rating} onChange={e => setRating(Number(e.target.value))} style={inputStyle}>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} ({n}/5)</option>)}
          </select>
          <textarea placeholder="Describe your experience in this room..." value={body} onChange={e => setBody(e.target.value)} rows={4} style={inputStyle} />
          <label style={{ fontSize: '14px', color: '#555' }}>
            Add a photo (optional)
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} style={{ ...inputStyle, marginTop: '4px' }} />
          </label>
          <button onClick={submitReview} disabled={submitting} style={btnStyle}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>

      {/* REVIEWS */}
      <div style={sectionStyle}>
        <h2 style={sectionHeader}>Reviews ({reviews.length})</h2>
        {reviews.length === 0 && <p style={{ color: '#999' }}>No reviews yet — be the first!</p>}
        {reviews.map((r) => (
          <div key={r.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{r.author_name}</strong>
              <span>{'⭐'.repeat(r.rating)}</span>
            </div>
            <p style={{ marginTop: '0.5rem', color: '#444' }}>{r.body}</p>
            {r.photos?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {r.photos.map((url, i) => (
                  <img key={i} src={url} alt="Review photo"
                    style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '0.75rem', border: '1px solid #e5e5e5' }}>
      <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontWeight: '600', fontSize: '14px' }}>{value}</p>
    </div>
  )
}

function Feature({ label, available }: { label: string; available: boolean }) {
  return (
    <div style={{
      padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: '500',
      background: available ? '#dcfce7' : '#f5f5f5',
      color: available ? '#16a34a' : '#999',
      border: `1px solid ${available ? '#86efac' : '#e5e5e5'}`
    }}>
      {available ? '✓' : '✗'} {label}
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #e5e5e5', borderRadius: '12px',
  padding: '1.25rem', marginBottom: '1.25rem',
}

const sectionHeader: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem',
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem', border: '1px solid #ccc',
  borderRadius: '8px', fontSize: '0.95rem',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

const btnStyle: React.CSSProperties = {
  background: '#4f46e5', color: 'white', padding: '0.6rem 1.2rem',
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontSize: '0.95rem', alignSelf: 'flex-start',
}