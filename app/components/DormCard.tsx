import Link from 'next/link'
import { PhotoSlot } from './DormPortrait'
import { Rating } from './ui'

export type DormSummary = {
  id: string
  name: string
  university: string
  photo_url: string | null
  avg_rating: number | null
  year_built: number | null
  amenities: string[] | null
}

export function DormCard({
  dorm,
  rating,
  showUniversity = true,
}: {
  dorm: DormSummary
  rating: number | null
  showUniversity?: boolean
}) {
  return (
    <Link
      href={`/dorms/${dorm.id}`}
      className="dorm-card card"
      style={{ overflow: 'hidden', color: 'inherit', display: 'block' }}
    >
      <PhotoSlot
        photoUrl={dorm.photo_url}
        seed={dorm.id}
        yearBuilt={dorm.year_built}
        alt={dorm.name}
        height={164}
        rounded="0"
      />
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div className="t-card">{dorm.name}</div>
          <div className="t-meta" style={{ marginTop: 2 }}>
            {showUniversity ? dorm.university : null}
            {showUniversity && dorm.year_built ? ' · ' : ''}
            {dorm.year_built ? `built ${dorm.year_built}` : ''}
          </div>
        </div>
        <Rating value={rating} size="sm" />
        {dorm.amenities && dorm.amenities.length > 0 && (
          <div className="row wrap" style={{ gap: 6 }}>
            {dorm.amenities.slice(0, 3).map((a) => (
              <span key={a} className="chip" style={{ fontSize: 12, padding: '5px 11px' }}>
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export function CardSkeleton() {
  return (
    <div
      className="card"
      style={{ height: 290, background: 'var(--blue-050)', borderStyle: 'dashed', boxShadow: 'none' }}
    />
  )
}
