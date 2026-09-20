'use client'

import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Dorm = { id: string; name: string; university: string }

function SubmitRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillDormId = searchParams.get('dorm_id') || ''

  const [dorms, setDorms] = useState<Dorm[]>([])
  const [dormId, setDormId] = useState(prefillDormId)
  const [roomNumber, setRoomNumber] = useState('')
  const [roomType, setRoomType] = useState('')
  const [approxSize, setApproxSize] = useState('')
  const [bathroomType, setBathroomType] = useState('')
  const [hasAc, setHasAc] = useState(false)
  const [hasLaundry, setHasLaundry] = useState(false)
  const [hasKitchen, setHasKitchen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchDorms() {
      const { data } = await supabase.from('dorms').select('id, name, university').order('name')
      setDorms(data || [])
    }
    fetchDorms()
  }, [])

  async function handleSubmit() {
    if (!dormId || !roomNumber || !roomType) return alert('Dorm, room number, and room type are required')
    setSubmitting(true)

    const { data, error } = await supabase.from('rooms').insert({
      dorm_id: dormId,
      room_number: roomNumber,
      room_type: roomType,
      approx_size: approxSize ? parseInt(approxSize) : null,
      bathroom_type: bathroomType,
      has_ac: hasAc,
      has_laundry: hasLaundry,
      has_kitchen: hasKitchen,
    }).select().single()

    if (error) { alert('Error submitting room'); console.error(error) }
    else { router.push(`/rooms/${data.id}`) }

    setSubmitting(false)
  }

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <Link href="/" style={{ color: '#4f46e5', fontSize: '0.9rem' }}>← Back</Link>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '600', margin: '1rem 0' }}>Add a Room</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={sectionStyle}>
          <h2 style={sectionHeader}>Which dorm?</h2>
          <label style={labelStyle}>
            Select a dorm *
            <select value={dormId} onChange={e => setDormId(e.target.value)} style={inputStyle}>
              <option value="">Select a dorm...</option>
              {dorms.map(d => (
                <option key={d.id} value={d.id}>{d.name} — {d.university}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionHeader}>Room basics</h2>
          <label style={labelStyle}>
            Room Number *
            <input placeholder="e.g. 204" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Room Type *
            <select value={roomType} onChange={e => setRoomType(e.target.value)} style={inputStyle}>
              <option value="">Select type...</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Triple">Triple</option>
              <option value="Suite">Suite</option>
            </select>
          </label>
          <label style={labelStyle}>
            Approximate Size (sq ft)
            <input type="number" placeholder="e.g. 180" value={approxSize} onChange={e => setApproxSize(e.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Bathroom Type
            <select value={bathroomType} onChange={e => setBathroomType(e.target.value)} style={inputStyle}>
              <option value="">Select type...</option>
              <option value="Private">Private (in room)</option>
              <option value="Shared">Shared (floor bathroom)</option>
              <option value="Suite">Suite style</option>
              <option value="Pod">Pod style</option>
            </select>
          </label>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionHeader}>What's included?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: '❄️ Air Conditioning (AC)', value: hasAc, setter: setHasAc },
              { label: '🧺 Laundry in building', value: hasLaundry, setter: setHasLaundry },
              { label: '🍳 Kitchen access', value: hasKitchen, setter: setHasKitchen },
            ].map(({ label, value, setter }) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px' }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={e => setter(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} style={btnStyle}>
          {submitting ? 'Submitting...' : 'Add Room'}
        </button>

      </div>
    </main>
  )
}

export default function SubmitRoomPage() {
  return (
    <Suspense fallback={null}>
      <SubmitRoomForm />
    </Suspense>
  )
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #e5e5e5', borderRadius: '12px',
  padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
}

const sectionHeader: React.CSSProperties = {
  fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem', color: '#333',
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.4rem',
  fontWeight: '500', fontSize: '0.95rem',
}

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem', border: '1px solid #ccc',
  borderRadius: '8px', fontSize: '0.95rem',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

const btnStyle: React.CSSProperties = {
  background: '#4f46e5', color: 'white', padding: '0.75rem',
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontSize: '1rem', fontWeight: '600',
}