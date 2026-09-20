'use client'

import { useState } from 'react'

const DOMAINS: Record<string, string> = {
  UNC: 'unc.edu',
  VT: 'vt.edu',
  UM: 'umich.edu',
  GT: 'gatech.edu',
  UV: 'virginia.edu',
  GMU: 'gmu.edu',
}

export function UniLogo({
  code,
}: {
  code: string
}) {
  const [failed, setFailed] = useState(false)

  const domain = DOMAINS[code]
  const key = process.env.NEXT_PUBLIC_LOGO_DEV_KEY

  if (!domain || !key || failed) {
    return (
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--blue-900)',
        }}
      >
        {code}
      </span>
    )
  }

  return (
    <img
      src={`https://img.logo.dev/${domain}?token=${key}`}
      alt={`${code} logo`}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%',
        clipPath: 'circle(50%)',
      }}
    />
  )
}