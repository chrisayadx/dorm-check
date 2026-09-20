import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

// ======================================================
// ENVIRONMENT
// ======================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const SCORECARD_KEY =
  process.env.COLLEGE_SCORECARD_API_KEY

const LOGO_DEV_KEY =
  process.env.NEXT_PUBLIC_LOGO_DEV_KEY

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!SUPABASE_KEY) {
  throw new Error('Missing Supabase key')
}

if (!SCORECARD_KEY) {
  throw new Error('Missing COLLEGE_SCORECARD_API_KEY')
}

if (!LOGO_DEV_KEY) {
  throw new Error('Missing NEXT_PUBLIC_LOGO_DEV_KEY')
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

// ======================================================
// VIRGINIA TECH
//
// We are intentionally testing ONE university first.
// Once VT is correct, we can build official lists for
// UVA, Michigan, UNC, Georgia Tech and GMU.
// ======================================================

const UNIVERSITY = {
  scorecardName:
    'Virginia Polytechnic Institute and State University',
  displayName: 'Virginia Tech',
}

// ======================================================
// OFFICIAL VIRGINIA TECH RESIDENCE HALLS
//
// "name" = the name DormCheck should display.
// "aliases" = names OpenStreetMap may use.
//
// Oak Lane / fraternity-sorority housing is intentionally
// excluded from DormCheck's normal residence-hall list.
// ======================================================

type OfficialDorm = {
  name: string
  aliases: string[]
}

const VT_DORMS: OfficialDorm[] = [
  {
    name: 'Ambler Johnston East',
    aliases: [
      'Ambler Johnston East',
      'East Ambler Johnston',
      'East Ambler Johnston Hall',
      'Ambler Johnston Hall East',
    ],
  },
  {
    name: 'Ambler Johnston West',
    aliases: [
      'Ambler Johnston West',
      'West Ambler Johnston',
      'West Ambler Johnston Hall',
      'Ambler Johnston Hall West',
    ],
  },
  {
    name: 'Campbell Main',
    aliases: [
      'Campbell Main',
      'Main Campbell',
      'Main Campbell Hall',
      'Campbell Hall Main',
    ],
  },
  {
    name: 'Campbell East',
    aliases: [
      'Campbell East',
      'East Campbell',
      'East Campbell Hall',
      'Campbell Hall East',
    ],
  },
  {
    name: 'Cochrane Hall',
    aliases: [
      'Cochrane Hall',
      'Cochrane',
    ],
  },
  {
    name: 'Creativity and Innovation District Residence Hall',
    aliases: [
      'Creativity and Innovation District Residence Hall',
      'Creativity and Innovation District',
      'CID Residence Hall',
      'CID',
    ],
  },
  {
    name: 'Donaldson Brown (GLC)',
    aliases: [
      'Donaldson Brown',
      'Donaldson Brown (GLC)',
      'Graduate Life Center at Donaldson Brown',
      'Graduate Life Center',
    ],
  },
  {
    name: 'Eggleston East',
    aliases: [
      'Eggleston East',
      'East Eggleston',
      'East Eggleston Hall',
      'Eggleston Hall East',
    ],
  },
  {
    name: 'Eggleston Main',
    aliases: [
      'Eggleston Main',
      'Main Eggleston',
      'Main Eggleston Hall',
      'Eggleston Hall Main',
    ],
  },
  {
    name: 'Eggleston West',
    aliases: [
      'Eggleston West',
      'West Eggleston',
      'West Eggleston Hall',
      'Eggleston Hall West',
    ],
  },
  {
    name: 'Harper Hall',
    aliases: [
      'Harper Hall',
      'Harper',
    ],
  },
  {
    name: 'Hillcrest Hall',
    aliases: [
      'Hillcrest Hall',
      'Hillcrest',
    ],
  },
  {
    name: 'Hoge Hall',
    aliases: [
      'Hoge Hall',
      'Hoge',
      'Lee Hall',
    ],
  },
  {
    name: 'Johnson Hall',
    aliases: [
      'Johnson Hall',
      'Johnson',
    ],
  },
  {
    name: 'Miles Hall',
    aliases: [
      'Miles Hall',
      'Miles',
    ],
  },
  {
    name: 'New Hall West',
    aliases: [
      'New Hall West',
    ],
  },
  {
    name: 'New Residence Hall East',
    aliases: [
      'New Residence Hall East',
      'New Res Hall East',
      'NRHE',
    ],
  },
  {
    name: 'Newman Hall',
    aliases: [
      'Newman Hall',
      'Newman',
    ],
  },
  {
    name: "O'Shaughnessy Hall",
    aliases: [
      "O'Shaughnessy Hall",
      "O'Shaughnessy",
      'O’Shaughnessy Hall',
      'O’Shaughnessy',
    ],
  },
  {
    name: 'Payne Hall',
    aliases: [
      'Payne Hall',
      'Payne',
    ],
  },
  {
    name: 'Pearson Hall East',
    aliases: [
      'Pearson Hall East',
      'Pearson East',
      'Pearson Hall (East)',
    ],
  },
  {
    name: 'Pearson Hall West',
    aliases: [
      'Pearson Hall West',
      'Pearson West',
      'Pearson Hall (West)',
    ],
  },
  {
    name: 'Peddrew-Yates Hall',
    aliases: [
      'Peddrew-Yates Hall',
      'Peddrew-Yates',
      'Peddrew Yates Hall',
    ],
  },
  {
    name: 'Pritchard Hall',
    aliases: [
      'Pritchard Hall',
      'Pritchard',
    ],
  },

  // DormCheck is building-level, so split Slusher.
  {
    name: 'Slusher Tower',
    aliases: [
      'Slusher Tower',
    ],
  },
  {
    name: 'Slusher Wing',
    aliases: [
      'Slusher Wing',
    ],
  },

  {
    name: 'Upper Quad Hall North',
    aliases: [
      'Upper Quad Hall North',
      'Upper Quad North',
    ],
  },
  {
    name: 'Vawter Hall',
    aliases: [
      'Vawter Hall',
      'Vawter',
    ],
  },
  {
    name: 'Whitehurst Hall',
    aliases: [
      'Whitehurst Hall',
      'Whitehurst',
      'Barringer Hall',
    ],
  },
]

// ======================================================
// OVERPASS SERVERS
// ======================================================

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

// ======================================================
// HELPERS
// ======================================================

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]/g, '')
}

function normalizeWebsite(
  value: string | null
) {
  if (!value) return null

  if (
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value
  }

  return `https://${value}`
}

function getDomain(
  value: string | null
) {
  if (!value) return null

  try {
    const website =
      normalizeWebsite(value)

    if (!website) return null

    return new URL(website)
      .hostname
      .replace(/^www\./, '')
  } catch {
    return value
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
  }
}

function getYearBuilt(
  value?: string
) {
  if (!value) return null

  const match =
    value.match(/\b(18|19|20)\d{2}\b/)

  return match
    ? Number(match[0])
    : null
}

function getAddress(
  tags: Record<string, string>
) {
  const street = [
    tags['addr:housenumber'],
    tags['addr:street'],
  ]
    .filter(Boolean)
    .join(' ')

  const cityState = [
    tags['addr:city'],
    tags['addr:state'],
  ]
    .filter(Boolean)
    .join(', ')

  const pieces = [
    street,
    cityState,
  ].filter(Boolean)

  return pieces.length
    ? pieces.join(', ')
    : null
}

function makeBoundingBox(
  latitude: number,
  longitude: number
) {
  const radiusKm = 3

  const latChange =
    radiusKm / 111

  const lonChange =
    radiusKm /
    (
      111 *
      Math.cos(
        latitude *
        Math.PI /
        180
      )
    )

  return {
    south:
      latitude - latChange,

    west:
      longitude - lonChange,

    north:
      latitude + latChange,

    east:
      longitude + lonChange,
  }
}

// ======================================================
// COLLEGE SCORECARD
// ======================================================

async function getScorecardSchool() {
  const params =
    new URLSearchParams({
      api_key:
        SCORECARD_KEY!,

      'school.name':
        UNIVERSITY.scorecardName,

      fields: [
        'id',
        'school.name',
        'school.city',
        'school.state',
        'school.school_url',
        'location.lat',
        'location.lon',
      ].join(','),

      per_page: '5',
    })

  const url =
    'https://api.data.gov/ed/collegescorecard/v1/schools.json?' +
    params.toString()

  const response =
    await fetch(url)

  if (!response.ok) {
    throw new Error(
      `College Scorecard failed: ${response.status}`
    )
  }

  const data =
    await response.json()

  return data.results?.[0] ?? null
}

// ======================================================
// BUILD OVERPASS QUERY
//
// IMPORTANT:
// We search ONLY for names from the official list.
// We do not ask OSM "what counts as a dorm?"
// ======================================================

function escapeOverpassString(
  value: string
) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
}

function buildOverpassQuery(
  latitude: number,
  longitude: number
) {
  const box =
    makeBoundingBox(
      latitude,
      longitude
    )

  const bbox =
    `${box.south},${box.west},${box.north},${box.east}`

  const aliases =
    VT_DORMS.flatMap(
      (dorm) => dorm.aliases
    )

  const lines =
    aliases.map(
      (name) =>
        `nwr["name"="${escapeOverpassString(name)}"](${bbox});`
    )

  return `
[out:json][timeout:45];
(
${lines.join('\n')}
);
out center tags;
`
}

// ======================================================
// OPENSTREETMAP
// ======================================================

async function getOsmMatches(
  latitude: number,
  longitude: number
) {
  const query =
    buildOverpassQuery(
      latitude,
      longitude
    )

  let lastError:
    Error | null = null

  for (
    const server of
    OVERPASS_SERVERS
  ) {
    console.log(
      `  Trying OSM server: ${server}`
    )

    try {
      const controller =
        new AbortController()

      const timeout =
        setTimeout(
          () => controller.abort(),
          60000
        )

      const response =
        await fetch(
          server,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded',

              Accept:
                'application/json',

              'User-Agent':
                'DormCheck/1.0 university-housing-project',
            },

            body:
              new URLSearchParams({
                data: query,
              }),

            signal:
              controller.signal,
          }
        )

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        )
      }

      const data =
        await response.json()

      console.log(
        '  ✓ OSM responded'
      )

      return data.elements ?? []
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(String(error))

      lastError = err

      console.log(
        `  ⚠ OSM server failed: ${err.message}`
      )

      await sleep(2500)
    }
  }

  console.log(
    '  ⚠ OSM unavailable. Official halls will still be saved without coordinates.'
  )

  if (lastError) {
    console.log(
      `  Last OSM error: ${lastError.message}`
    )
  }

  return []
}

// ======================================================
// MATCH AN OSM FEATURE TO AN OFFICIAL HALL
// ======================================================

function findOsmMatch(
  dorm: OfficialDorm,
  elements: any[]
) {
  const accepted =
    new Set(
      dorm.aliases.map(
        normalizeName
      )
    )

  return elements.find(
    (element) => {
      const osmName =
        element.tags?.name

      if (!osmName) {
        return false
      }

      return accepted.has(
        normalizeName(
          osmName
        )
      )
    }
  )
}

// ======================================================
// SAVE OR UPDATE ONE DORM
//
// We manually check by university_id + name instead of
// relying on nullable OSM IDs for duplicate prevention.
// ======================================================

async function saveDorm(
  universityId: string,
  dorm: OfficialDorm,
  osm: any | undefined
) {
  const tags = osm?.tags ?? {}

  const latitude =
    osm?.lat ??
    osm?.center?.lat ??
    null

  const longitude =
    osm?.lon ??
    osm?.center?.lon ??
    null

  const row = {
    name: dorm.name,

    university:
      UNIVERSITY.displayName,

    university_id:
      universityId,

    latitude,
    longitude,

    osm_id:
      osm?.id ?? null,

    osm_type:
      osm?.type ?? null,

    photo_url:
      tags.image?.startsWith('http')
        ? tags.image
        : null,

    year_built:
      getYearBuilt(
        tags.start_date
      ),

    location:
      getAddress(tags),

    building_info:
      tags.description ??
      (
        tags['building:levels']
          ? `${tags['building:levels']} floors`
          : null
      ),
  }

  // ----------------------------------------------------
  // 1. Does the canonical dorm name already exist?
  // ----------------------------------------------------

  const {
    data: existingByName,
    error: nameLookupError,
  } =
    await supabase
      .from('dorms')
      .select('id, name, osm_id, osm_type')
      .eq(
        'university_id',
        universityId
      )
      .eq(
        'name',
        dorm.name
      )
      .maybeSingle()

  if (nameLookupError) {
    throw new Error(
      nameLookupError.message
    )
  }

  // ----------------------------------------------------
  // 2. Does this exact OSM building already exist
  //    under an OLD / different name?
  // ----------------------------------------------------

  let existingByOsm:
    {
      id: string
      name: string
      osm_id: number | null
      osm_type: string | null
    } |
    null = null

  if (
    osm?.id != null &&
    osm?.type
  ) {
    const {
      data,
      error:
        osmLookupError,
    } =
      await supabase
        .from('dorms')
        .select(
          'id, name, osm_id, osm_type'
        )
        .eq(
          'university_id',
          universityId
        )
        .eq(
          'osm_id',
          osm.id
        )
        .eq(
          'osm_type',
          osm.type
        )
        .maybeSingle()

    if (osmLookupError) {
      throw new Error(
        osmLookupError.message
      )
    }

    existingByOsm = data
  }

  // ----------------------------------------------------
  // 3. Same row already exists
  // ----------------------------------------------------

  if (
    existingByName &&
    (
      !existingByOsm ||
      existingByName.id ===
        existingByOsm.id
    )
  ) {
    const {
      error:
        updateError,
    } =
      await supabase
        .from('dorms')
        .update(row)
        .eq(
          'id',
          existingByName.id
        )

    if (updateError) {
      throw new Error(
        updateError.message
      )
    }

    console.log(
      `  ↻ Updated ${dorm.name}`
    )

    return
  }

  // ----------------------------------------------------
  // 4. OSM building exists under an old name.
  //
  // Rename/update the EXISTING row instead of inserting
  // a duplicate. Its UUID stays the same, so reviews
  // connected to it stay connected.
  // ----------------------------------------------------

  if (
    existingByOsm &&
    !existingByName
  ) {
    const oldName =
      existingByOsm.name

    const {
      error:
        renameError,
    } =
      await supabase
        .from('dorms')
        .update(row)
        .eq(
          'id',
          existingByOsm.id
        )

    if (renameError) {
      throw new Error(
        renameError.message
      )
    }

    console.log(
      `  ↻ Renamed "${oldName}" → "${dorm.name}"`
    )

    return
  }

  // ----------------------------------------------------
  // 5. Extremely rare case:
  //    canonical name AND OSM row both exist separately.
  //
  // Do not destroy either row automatically.
  // Keep canonical row unchanged for now.
  // ----------------------------------------------------

  if (
    existingByName &&
    existingByOsm &&
    existingByName.id !==
      existingByOsm.id
  ) {
    console.log(
      `  ⚠ Duplicate needs review: "${dorm.name}"`
    )

    console.log(
      `    Name row: ${existingByName.id}`
    )

    console.log(
      `    OSM row:  ${existingByOsm.id}`
    )

    return
  }

  // ----------------------------------------------------
  // 6. Brand-new dorm
  // ----------------------------------------------------

  const {
    error:
      insertError,
  } =
    await supabase
      .from('dorms')
      .insert(row)

  if (insertError) {
    throw new Error(
      insertError.message
    )
  }

  console.log(
    `  + Added ${dorm.name}`
  )
}

// ======================================================
// CLEAN OLD OSM-IMPORTED VT ROWS
//
// Removes OSM-imported buildings that are NOT in our
// official canonical list.
//
// IMPORTANT:
// If a bad/old row already has a review, we keep it and
// print a warning so the review isn't accidentally lost.
// ======================================================

async function cleanupOldImports(
  universityId: string
) {
  console.log('')
  console.log(
    'Checking old Virginia Tech imports...'
  )

  const canonical =
    new Set(
      VT_DORMS.map(
        (dorm) =>
          normalizeName(
            dorm.name
          )
      )
    )

  const {
    data: rows,
    error,
  } =
    await supabase
      .from('dorms')
      .select(
        'id, name, osm_id'
      )
      .eq(
        'university_id',
        universityId
      )

  if (error) {
    throw new Error(
      error.message
    )
  }

  const unwanted =
    (rows ?? []).filter(
      (row) =>
        row.osm_id !== null &&
        !canonical.has(
          normalizeName(
            row.name
          )
        )
    )

  if (
    unwanted.length === 0
  ) {
    console.log(
      '✓ No unwanted OSM imports found'
    )

    return
  }

  for (
    const row of unwanted
  ) {
    const {
      count,
      error:
        reviewError,
    } =
      await supabase
        .from('reviews')
        .select(
          '*',
          {
            count: 'exact',
            head: true,
          }
        )
        .eq(
          'dorm_id',
          row.id
        )

    if (reviewError) {
      console.log(
        `⚠ Could not check reviews for ${row.name}`
      )

      continue
    }

    if (
      (count ?? 0) > 0
    ) {
      console.log(
        `⚠ Keeping "${row.name}" because it has ${count} review(s)`
      )

      continue
    }

    const {
      error:
        deleteError,
    } =
      await supabase
        .from('dorms')
        .delete()
        .eq(
          'id',
          row.id
        )

    if (deleteError) {
      console.log(
        `⚠ Could not remove "${row.name}"`
      )
    } else {
      console.log(
        `🗑 Removed unwanted import: ${row.name}`
      )
    }
  }
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  console.log(
    'Starting VERIFIED Virginia Tech seed...'
  )

  console.log('')
  console.log(
    '--------------------------------'
  )
  console.log(
    'Virginia Tech'
  )
  console.log(
    '--------------------------------'
  )

  // ----------------------------------------------------
  // 1. COLLEGE SCORECARD
  // ----------------------------------------------------

  const school =
    await getScorecardSchool()

  if (!school) {
    throw new Error(
      'Virginia Tech was not found in College Scorecard'
    )
  }

  const latitude =
    Number(
      school[
        'location.lat'
      ]
    )

  const longitude =
    Number(
      school[
        'location.lon'
      ]
    )

  const website =
    normalizeWebsite(
      school[
        'school.school_url'
      ]
    )

  const domain =
    getDomain(website)

  const logoUrl =
    domain
      ? `https://img.logo.dev/${domain}?token=${LOGO_DEV_KEY}`
      : null

  console.log(
    `✓ Scorecard: ${school['school.city']}, ${school['school.state']}`
  )

  // ----------------------------------------------------
  // 2. UNIVERSITY
  // ----------------------------------------------------

  const universityRow = {
    name:
      UNIVERSITY.displayName,

    slug:
      slugify(
        UNIVERSITY.displayName
      ),

    city:
      school[
        'school.city'
      ],

    state:
      school[
        'school.state'
      ],

    website,

    domain,

    logo_url:
      logoUrl,

    scorecard_id:
      Number(
        school.id
      ),

    latitude,

    longitude,
  }

  const {
    data: university,
    error:
      universityError,
  } =
    await supabase
      .from(
        'universities'
      )
      .upsert(
        universityRow,
        {
          onConflict:
            'scorecard_id',
        }
      )
      .select(
        'id'
      )
      .single()

  if (
    universityError
  ) {
    throw new Error(
      `Supabase university error: ${universityError.message}`
    )
  }

  console.log(
    '✓ University saved'
  )

  // ----------------------------------------------------
  // 3. OPENSTREETMAP
  // ----------------------------------------------------

  const osmElements =
    await getOsmMatches(
      latitude,
      longitude
    )

  console.log(
    `✓ OSM returned ${osmElements.length} matching map features`
  )

  // ----------------------------------------------------
  // 4. SAVE EVERY OFFICIAL VT HALL
  // ----------------------------------------------------

  console.log('')
  console.log(
    `Saving ${VT_DORMS.length} official residence-hall buildings...`
  )

  for (
    const dorm of
    VT_DORMS
  ) {
    const osm =
      findOsmMatch(
        dorm,
        osmElements
      )

    await saveDorm(
      university.id,
      dorm,
      osm
    )
  }

  // ----------------------------------------------------
  // 5. REMOVE OLD BAD OSM IMPORTS
  // ----------------------------------------------------

  await cleanupOldImports(
    university.id
  )

  console.log('')
  console.log(
    '✅ Virginia Tech verified seed finished.'
  )
}

main().catch(
  (error) => {
    console.error(
      '❌ Seed failed:',
      error
    )

    process.exit(1)
  }
)