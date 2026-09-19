'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubmitDormPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [amenities, setAmenities] = useState('') // comma-separated input
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name || !university) return alert('Name and university are required')
    setSubmitting(true)

    let photo_url = ''

    // Upload photo if one was selected
    if (photoFile) {
      const fileName = `${Date.now()}-${photoFile.name}`
      const { data, error } = await supabase.storage
        .from('dorm-photos')        // You need to create this bucket in Supabase dashboard
        .upload(fileName, photoFile)

      if (error) {
        alert('Photo upload failed')
        console.error(error)
        setSubmitting(false)
        return
      }

      // Get the public URL for the uploaded photo
      const { data: urlData } = supabase.storage.from('dorm-photos').getPublicUrl(fileName)
      photo_url = urlData.publicUrl
    }

    // Insert dorm into DB
    const { data, error } = await supabase.from('dorms').insert({
      name,
      university,
      year_built: yearBuilt ? parseInt(yearBuilt) : null,
      amenities: amenities ? amenities.split(',').map(a => a.trim()) : [],
      photo_url,
    }).select().single()

    if (error) {
      alert('Error submitting dorm')
      console.error(error)
    } else {
      router.push(`/dorms/${data.id}`) // Go to the new dorm's page
    }

    setSubmitting(false)
  }

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <Link href="/" style={{ color: '#4f46e5', fontSize: '0.9rem' }}>← Back</Link>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '1rem 0' }}>Submit a Dorm</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={labelStyle}>
          Dorm Name *
          <input placeholder="e.g. Slusher Tower" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          University *
          <input placeholder="e.g. Virginia Tech" value={university} onChange={e => setUniversity(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Year Built
          <input type="number" placeholder="e.g. 1968" value={yearBuilt} onChange={e => setYearBuilt(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Amenities (comma-separated)
          <input placeholder="e.g. AC, Gym, Laundry, Study Rooms" value={amenities} onChange={e => setAmenities(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          Photo
          <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} style={inputStyle} />
        </label>

        <button onClick={handleSubmit} disabled={submitting} style={btnStyle}>
          {submitting ? 'Submitting...' : 'Submit Dorm'}
        </button>
      </div>
    </main>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  fontWeight: '500',
  fontSize: '0.95rem',
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
  padding: '0.75rem',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  marginTop: '0.5rem',
}