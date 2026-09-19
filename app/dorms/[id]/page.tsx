'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Dorm = {
  id: string
  name: string
  university: string
  photo_url: string
  avg_rating: number
  year_built: number
  amenities: string[]
}

type Review = {
  id: string
  author_name: string
  rating: number
  body: string
  created_at: string
}

export default function DormPage() {
  const { id } = useParams()
  const [dorm, setDorm] = useState<Dorm | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // Form state — like instance variables for the review form
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // Fetch dorm info
      const { data: dormData } = await supabase
        .from('dorms')
        .select('*')
        .eq('id', id)
        .single()
      setDorm(dormData)

      // Fetch reviews for this dorm
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('dorm_id', id)
        .order('created_at', { ascending: false })
      setReviews(reviewData || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function submitReview() {
    if (!body || !authorName) return alert('Please fill in all fields')
    setSubmitting(true)

    const { error } = await supabase.from('reviews').insert({
      dorm_id: id,
      author_name: authorName,
      rating,
      body,
    })

    if (error) {
      alert('Error submitting review')
      console.error(error)
    } else {
      // Add review to local list without refetching
      setReviews([{ id: Date.now().toString(), author_name: authorName, rating, body, created_at: new Date().toISOString() }, ...reviews])
      setAuthorName('')
      setBody('')
      setRating(5)
    }
    setSubmitting(false)
  }

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>
  if (!dorm) return <p style={{ padding: '2rem' }}>Dorm not found.</p>

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Link href="/" style={{ color: '#4f46e5', fontSize: '0.9rem' }}>← Back to all dorms</Link>

      {/* Dorm Header */}
      {dorm.photo_url && (
        <img src={dorm.photo_url} alt={dorm.name}
          style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '8px', margin: '1rem 0' }} />
      )}
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{dorm.name}</h1>
      <p style={{ color: '#666' }}>{dorm.university}</p>

      {/* Facts */}
      <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <Stat label="Avg Rating" value={`${dorm.avg_rating || 'N/A'} / 5`} />
        <Stat label="Year Built" value={dorm.year_built?.toString() || 'Unknown'} />
        <Stat label="Amenities" value={dorm.amenities?.join(', ') || 'None listed'} />
      </div>

      <hr style={{ margin: '2rem 0' }} />

      {/* Review Form */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>Write a Review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <input
          placeholder="Your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          style={inputStyle}
        />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={inputStyle}>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} ({n}/5)</option>)}
        </select>
        <textarea
          placeholder="Describe your experience..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          style={inputStyle}
        />
        <button onClick={submitReview} disabled={submitting} style={btnStyle}>
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      {/* Reviews List */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem' }}>
        Reviews ({reviews.length})
      </h2>
      {reviews.length === 0 && <p style={{ color: '#999' }}>No reviews yet. Be the first!</p>}
      {reviews.map((r) => (
        <div key={r.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{r.author_name}</strong>
            <span>{'⭐'.repeat(r.rating)}</span>
          </div>
          <p style={{ marginTop: '0.5rem', color: '#444' }}>{r.body}</p>
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
            {new Date(r.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '0.75rem 1rem' }}>
      <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontWeight: '600' }}>{value}</p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem',
  border: '1px solid #ccc',
  borderRadius: '6px',
  fontSize: '0.95rem',
  width: '100%',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  background: '#4f46e5',
  color: 'white',
  padding: '0.6rem 1.2rem',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  alignSelf: 'flex-start',
}