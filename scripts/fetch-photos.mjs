import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'

// ======================================================
// ENVIRONMENT
// ======================================================

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL in .env.local'
  )
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local'
  )
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
)

// ======================================================
// SETTINGS
// ======================================================

const WIKIMEDIA_API =
  'https://commons.wikimedia.org/w/api.php'

const REQUEST_DELAY_MS = 900

const MIN_IMAGE_WIDTH = 1200

const OUTPUT_FILE = path.join(
  process.cwd(),
  'lib',
  'university-photos.json'
)

// ======================================================
// UNIVERSITIES
//
// These names MUST match public.dorms.university exactly.
// ======================================================

const UNIVERSITIES = {
  'Virginia Tech': {
    aliases: [
      'Virginia Tech',
      'Virginia Polytechnic Institute and State University',
      'VPI',
      'Blacksburg',
    ],

    campusSearches: [
      'Virginia Tech Burruss Hall',
      'Virginia Tech Drillfield',
      'Virginia Tech campus Blacksburg',
    ],
  },

  'University of Virginia': {
    aliases: [
      'University of Virginia',
      'UVA',
      'Charlottesville',
    ],

    campusSearches: [
      'University of Virginia Rotunda',
      'University of Virginia Lawn',
      'University of Virginia campus Charlottesville',
    ],
  },

  'UNC Chapel Hill': {
    aliases: [
      'UNC Chapel Hill',
      'University of North Carolina at Chapel Hill',
      'University of North Carolina Chapel Hill',
      'Chapel Hill',
    ],

    campusSearches: [
      'UNC Chapel Hill Old Well',
      'University of North Carolina Chapel Hill campus',
      'UNC Chapel Hill campus',
    ],
  },

  'University of Michigan': {
    aliases: [
      'University of Michigan',
      'UMich',
      'Michigan',
      'Ann Arbor',
    ],

    campusSearches: [
      'University of Michigan Diag',
      'University of Michigan Ann Arbor campus',
      'University of Michigan campus',
    ],
  },

  'Georgia Tech': {
    aliases: [
      'Georgia Tech',
      'Georgia Institute of Technology',
      'Atlanta',
    ],

    campusSearches: [
      'Georgia Tech Tech Tower',
      'Georgia Institute of Technology campus',
      'Georgia Tech Atlanta campus',
    ],
  },

  'George Mason University': {
    aliases: [
      'George Mason University',
      'George Mason',
      'GMU',
      'Fairfax',
    ],

    campusSearches: [
      'George Mason University Fairfax campus',
      'George Mason University campus',
    ],
  },
}

// ======================================================
// WORDS THAT USUALLY MEAN "DO NOT USE THIS IMAGE"
// ======================================================

const REJECT_TERMS = [
  'logo',
  'seal',
  'crest',
  'wordmark',
  'emblem',
  'flag',

  'map',
  'diagram',
  'floor plan',
  'floorplan',
  'site plan',
  'blueprint',

  'interior',
  'inside',
  'bedroom',
  'bathroom',
  'hallway',
  'corridor',
  'lounge',
  'kitchen',
  'room interior',

  'drawing',
  'illustration',
  'rendering',
  'render',
  'sketch',
]

// ======================================================
// HELPERS
// ======================================================

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normalize(value = '') {
  return stripHtml(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function compact(value = '') {
  return normalize(value)
    .replace(/\s+/g, '')
}

function firstWords(value = '') {
  return normalize(value)
    .split(' ')
    .filter(
      (word) =>
        word.length >= 3 &&
        ![
          'hall',
          'dorm',
          'dormitory',
          'residence',
          'residential',
          'building',
          'house',
          'the',
          'and',
          'east',
          'west',
          'north',
          'south',
          'main',
        ].includes(word)
    )
}

function getMetadata(
  image,
  field
) {
  return stripHtml(
    image?.imageinfo?.[0]?.extmetadata?.[
      field
    ]?.value ?? ''
  )
}

function getCategories(image) {
  return (
    image?.categories
      ?.map((category) =>
        category.title.replace(
          /^Category:/,
          ''
        )
      )
      .join(' ') ?? ''
  )
}

function getSearchableText(image) {
  return [
    image.title,
    getMetadata(
      image,
      'ObjectName'
    ),
    getMetadata(
      image,
      'ImageDescription'
    ),
    getMetadata(
      image,
      'Categories'
    ),
    getCategories(image),
  ]
    .filter(Boolean)
    .join(' ')
}

function isRejectedImage(image) {
  const info =
    image.imageinfo?.[0]

  if (!info) {
    return true
  }

  const width =
    Number(info.width ?? 0)

  if (width < MIN_IMAGE_WIDTH) {
    return true
  }

  const mime =
    String(info.mime ?? '')
      .toLowerCase()

  if (
    mime !== 'image/jpeg'
  ) {
    return true
  }

  const text =
    normalize(
      getSearchableText(image)
    )

  return REJECT_TERMS.some(
    (term) =>
      text.includes(
        normalize(term)
      )
  )
}

function containsAnyAlias(
  text,
  aliases
) {
  const normalizedText =
    normalize(text)

  const compactText =
    compact(text)

  return aliases.some(
    (alias) => {
      const a =
        normalize(alias)

      const c =
        compact(alias)

      return (
        normalizedText.includes(a) ||
        compactText.includes(c)
      )
    }
  )
}

function dormNameMatches(
  text,
  dormName
) {
  const normalizedText =
    normalize(text)

  const compactText =
    compact(text)

  const normalizedDorm =
    normalize(dormName)

  const compactDorm =
    compact(dormName)

  // Strongest match:
  // complete dorm name
  if (
    normalizedText.includes(
      normalizedDorm
    ) ||
    compactText.includes(
      compactDorm
    )
  ) {
    return true
  }

  // Fallback for titles such as:
  // "Pritchard Residence Hall"
  // vs "Pritchard Hall"
  const meaningfulWords =
    firstWords(dormName)

  if (
    meaningfulWords.length === 0
  ) {
    return false
  }

  return meaningfulWords.every(
    (word) =>
      normalizedText.includes(word)
  )
}

function buildCredit(image) {
  const info =
    image.imageinfo?.[0]

  const artist =
    getMetadata(
      image,
      'Artist'
    )

  const license =
    getMetadata(
      image,
      'LicenseShortName'
    )

  const credit =
    getMetadata(
      image,
      'Credit'
    )

  const source =
    info?.descriptionurl ?? ''

  const pieces = []

  if (artist) {
    pieces.push(artist)
  }

  if (license) {
    pieces.push(license)
  }

  if (
    credit &&
    !pieces.some(
      (piece) =>
        normalize(piece) ===
        normalize(credit)
    )
  ) {
    pieces.push(credit)
  }

  if (source) {
    pieces.push(source)
  }

  return pieces.join(' · ')
}

function photoFromImage(image) {
  const info =
    image.imageinfo?.[0]

  if (!info?.url) {
    return null
  }

  return {
    url: info.url,
    credit:
      buildCredit(image),

    source:
      info.descriptionurl ?? null,

    title:
      image.title,

    width:
      Number(
        info.width ?? 0
      ),

    height:
      Number(
        info.height ?? 0
      ),
  }
}

// ======================================================
// WIKIMEDIA API
// ======================================================

async function commonsSearch(
  search,
  limit = 15
) {
  const params =
    new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',

      generator: 'search',

      gsrsearch: search,
      gsrnamespace: '6',
      gsrlimit: String(limit),

      prop:
        'imageinfo|categories',

      iiprop:
        'url|size|mime|extmetadata',

      cllimit: 'max',
    })

  const url =
    `${WIKIMEDIA_API}?${params}`

  const response =
    await fetch(
      url,
      {
        headers: {
          'User-Agent':
            'DormCheck/1.0 (student university housing project)',
          Accept:
            'application/json',
        },
      }
    )

  if (!response.ok) {
    throw new Error(
      `Wikimedia returned HTTP ${response.status}`
    )
  }

  const data =
    await response.json()

  const pages =
    Object.values(
      data?.query?.pages ?? {}
    )

  return pages.filter(
    (page) =>
      page &&
      page.imageinfo?.length
  )
}

// ======================================================
// CAMPUS PHOTOS
// ======================================================

function campusScore(
  image,
  university
) {
  if (
    isRejectedImage(image)
  ) {
    return -1000
  }

  const text =
    getSearchableText(image)

  let score = 0

  if (
    containsAnyAlias(
      text,
      university.aliases
    )
  ) {
    score += 6
  }

  const normalized =
    normalize(text)

  if (
    normalized.includes('campus')
  ) {
    score += 2
  }

  if (
    normalized.includes('university')
  ) {
    score += 1
  }

  const width =
    image.imageinfo?.[0]?.width ??
    0

  if (width >= 2000) {
    score += 2
  }

  if (width >= 3000) {
    score += 1
  }

  return score
}

async function findCampusPhoto(
  universityName,
  config
) {
  console.log('')
  console.log(
    `🏫 Campus photo: ${universityName}`
  )

  let best = null
  let bestScore = -Infinity

  for (
    const search of
    config.campusSearches
  ) {
    console.log(
      `   Searching: ${search}`
    )

    let results

    try {
      results =
        await commonsSearch(
          search,
          15
        )
    } catch (error) {
      console.log(
        `   ⚠ ${error.message}`
      )

      await sleep(
        REQUEST_DELAY_MS
      )

      continue
    }

    for (
      const image of results
    ) {
      const score =
        campusScore(
          image,
          config
        )

      if (
        score > bestScore
      ) {
        best = image
        bestScore = score
      }
    }

    await sleep(
      REQUEST_DELAY_MS
    )
  }

  if (
    !best ||
    bestScore < 5
  ) {
    console.log(
      '   ✗ No confident campus image'
    )

    return null
  }

  const photo =
    photoFromImage(best)

  console.log(
    `   ✓ ${photo.title}`
  )

  return photo
}

// ======================================================
// DORM PHOTOS
// ======================================================

function dormScore(
  image,
  dorm,
  universityConfig
) {
  if (
    isRejectedImage(image)
  ) {
    return -1000
  }

  const text =
    getSearchableText(image)

  const dormMatches =
    dormNameMatches(
      text,
      dorm.name
    )

  if (!dormMatches) {
    return -1000
  }

  const universityMatches =
    containsAnyAlias(
      text,
      universityConfig.aliases
    )

if (!universityMatches) {
  score -= 3
} else {
  score += 4
}

  let score = 10

  const normalized =
    normalize(text)

  const dormName =
    normalize(dorm.name)

  if (
    normalized.includes(
      dormName
    )
  ) {
    score += 5
  }

  if (
    normalized.includes(
      'residence hall'
    )
  ) {
    score += 2
  }

  if (
    normalized.includes(
      'dormitory'
    )
  ) {
    score += 1
  }

  if (
    normalized.includes(
      'exterior'
    )
  ) {
    score += 2
  }

  const width =
    image.imageinfo?.[0]?.width ??
    0

  if (width >= 2000) {
    score += 2
  }

  if (width >= 3000) {
    score += 1
  }

  return score
}

async function findDormPhoto(
  dorm,
  universityConfig
) {
const searches = [
  `${dorm.name} ${dorm.university}`,

  `${dorm.name} Virginia Tech`,

  `"${dorm.name}"`,

  `${dorm.name}`,
]

  let best = null
  let bestScore = -Infinity

  for (
    const search of searches
  ) {
    let results

    try {
      results =
        await commonsSearch(
          search,
          20
        )
    } catch (error) {
      console.log(
        `      ⚠ Wikimedia error: ${error.message}`
      )

      await sleep(
        REQUEST_DELAY_MS
      )

      continue
    }

    for (
      const image of results
    ) {
      const score =
        dormScore(
          image,
          dorm,
          universityConfig
        )

      if (
        score > bestScore
      ) {
        best = image
        bestScore = score
      }
    }

    await sleep(
      REQUEST_DELAY_MS
    )
  }

if (
  !best ||
  bestScore < 7
) {
  return null
}

  return photoFromImage(
    best
  )
}

// ======================================================
// LOAD DORMS
// ======================================================

async function getDorms() {
  const {
    data,
    error,
  } =
    await supabase
      .from('dorms')
      .select(
        `
        id,
        name,
        university,
        photo_url,
        photo_credit
        `
      )
      .order(
        'university',
        {
          ascending: true,
        }
      )
      .order(
        'name',
        {
          ascending: true,
        }
      )

  if (error) {
    throw new Error(
      `Could not load dorms: ${error.message}`
    )
  }

  return data ?? []
}

// ======================================================
// UPDATE DORM PHOTO
// ======================================================

async function saveDormPhoto(
  dorm,
  photo
) {
  const {
    error,
  } =
    await supabase
      .from('dorms')
      .update({
        photo_url:
          photo.url,

        photo_credit:
          photo.credit,
      })
      .eq(
        'id',
        dorm.id
      )

  if (error) {
    throw new Error(
      error.message
    )
  }
}

// ======================================================
// SAVE UNIVERSITY PHOTOS JSON
// ======================================================

async function saveUniversityPhotos(
  photos
) {
  await fs.mkdir(
    path.dirname(
      OUTPUT_FILE
    ),
    {
      recursive: true,
    }
  )

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      photos,
      null,
      2
    ) + '\n',
    'utf8'
  )
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  console.log(
    'DormCheck Wikimedia photo fetch'
  )

  console.log(
    '==============================='
  )

  // ----------------------------------------------------
  // Load dorm database
  // ----------------------------------------------------

  const dorms =
    await getDorms()

  console.log(
    `Loaded ${dorms.length} dorms from Supabase.`
  )

  const databaseUniversities =
    [
      ...new Set(
        dorms.map(
          (dorm) =>
            dorm.university
        )
      ),
    ]

  // ----------------------------------------------------
  // Verify university names
  // ----------------------------------------------------

  for (
    const universityName of
    databaseUniversities
  ) {
    if (
      !UNIVERSITIES[
        universityName
      ]
    ) {
      console.log(
        `⚠ Unknown university name in database: "${universityName}"`
      )
    }
  }

  // ----------------------------------------------------
  // Fetch university campus photos
  // ----------------------------------------------------

  const universityPhotos = {}

  for (
    const [
      universityName,
      config,
    ] of Object.entries(
      UNIVERSITIES
    )
  ) {
    const photo =
      await findCampusPhoto(
        universityName,
        config
      )

    if (photo) {
      universityPhotos[
        universityName
      ] = {
        url:
          photo.url,

        credit:
          photo.credit,

        source:
          photo.source,
      }
    }

    await sleep(
      REQUEST_DELAY_MS
    )
  }

  await saveUniversityPhotos(
    universityPhotos
  )

  console.log('')
  console.log(
    `✓ Campus photo file written to:`
  )

  console.log(
    `  ${OUTPUT_FILE}`
  )

  // ----------------------------------------------------
  // Fetch dorm exterior photos
  // ----------------------------------------------------

  console.log('')
  console.log(
    'Searching dorm exterior photos...'
  )

  const missing = []

  let foundCount = 0
  let skippedCount = 0

  for (
    let i = 0;
    i < dorms.length;
    i++
  ) {
    const dorm =
      dorms[i]

    const number =
      i + 1

    console.log('')
    console.log(
      `[${number}/${dorms.length}] ${dorm.university} — ${dorm.name}`
    )

    // Keep photos already stored
    if (dorm.photo_url) {
      console.log(
        '   ↷ Already has a photo'
      )

      skippedCount++

      continue
    }

    const universityConfig =
      UNIVERSITIES[
        dorm.university
      ]

    if (!universityConfig) {
      console.log(
        '   ⚠ University not configured'
      )

      missing.push({
        university:
          dorm.university,

        dorm:
          dorm.name,

        reason:
          'university not configured',
      })

      continue
    }

    const photo =
      await findDormPhoto(
        dorm,
        universityConfig
      )

    if (!photo) {
      console.log(
        '   ✗ No confident Commons match'
      )

      missing.push({
        university:
          dorm.university,

        dorm:
          dorm.name,

        reason:
          'no confident Commons match',
      })

      continue
    }

    try {
      await saveDormPhoto(
        dorm,
        photo
      )

      foundCount++

      console.log(
        `   ✓ ${photo.title}`
      )

      console.log(
        `   ✓ Saved to Supabase`
      )
    } catch (error) {
      console.log(
        `   ⚠ Could not save: ${error.message}`
      )

      missing.push({
        university:
          dorm.university,

        dorm:
          dorm.name,

        reason:
          `Supabase error: ${error.message}`,
      })
    }

    await sleep(
      REQUEST_DELAY_MS
    )
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  console.log('')
  console.log(
    '==============================='
  )

  console.log(
    'PHOTO FETCH COMPLETE'
  )

  console.log(
    '==============================='
  )

  console.log(
    `Dorm photos found: ${foundCount}`
  )

  console.log(
    `Already had photos: ${skippedCount}`
  )

  console.log(
    `Still missing: ${missing.length}`
  )

  console.log(
    `Campus photos: ${Object.keys(universityPhotos).length}`
  )

  if (
    missing.length > 0
  ) {
    console.log('')
    console.log(
      'Dorms still missing a confident photo:'
    )

    for (
      const item of missing
    ) {
      console.log(
        `- ${item.university} — ${item.dorm} (${item.reason})`
      )
    }
  }

  console.log('')
  console.log(
    'Done.'
  )
}

main().catch(
  (error) => {
    console.error('')
    console.error(
      '❌ Photo script failed:'
    )

    console.error(error)

    process.exit(1)
  }
)