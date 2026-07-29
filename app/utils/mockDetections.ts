export interface Detection {
  id: number
  location: string // EWKB hex (POINT, srid=4326)
  probability: number
  image_time: string
  detected_at: string
  bbox_west: number
  bbox_south: number
  bbox_east: number
  bbox_north: number
  threshold: number
}

// Rough bounding box for continental Argentina
const AR_BOUNDS = {
  minLon: -73.5,
  maxLon: -53.5,
  minLat: -55.0,
  maxLat: -21.8,
}

const PIXEL_PADDING = 0.05 // ~ GOES pixel footprint in degrees

// Fixed anchor (not Date.now()) so generated timestamps are identical on
// server and client renders — Date.now() would differ between the two,
// causing SSR/CSR hydration mismatches wherever these dates are displayed.
const REFERENCE_TIME = new Date('2026-07-28T12:00:00Z').getTime()

// Deterministic PRNG (mulberry32) so mock data is stable across reloads
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(20260727)

function randomInRange(min: number, max: number): number {
  return min + random() * (max - min)
}

function generateDetection(id: number): Detection {
  const longitude = randomInRange(AR_BOUNDS.minLon, AR_BOUNDS.maxLon)
  const latitude = randomInRange(AR_BOUNDS.minLat, AR_BOUNDS.maxLat)

  const daysAgo = randomInRange(0, 14)
  const imageTime = new Date(REFERENCE_TIME - daysAgo * 24 * 60 * 60 * 1000)
  const detectedAt = new Date(imageTime.getTime() + randomInRange(30, 300) * 1000)

  const threshold = 0.5

  return {
    id,
    location: lonLatToEwkb(longitude, latitude),
    probability: Number(randomInRange(threshold, 0.99).toFixed(4)),
    image_time: imageTime.toISOString(),
    detected_at: detectedAt.toISOString(),
    bbox_west: Number((longitude - PIXEL_PADDING).toFixed(6)),
    bbox_south: Number((latitude - PIXEL_PADDING).toFixed(6)),
    bbox_east: Number((longitude + PIXEL_PADDING).toFixed(6)),
    bbox_north: Number((latitude + PIXEL_PADDING).toFixed(6)),
    threshold,
  }
}

export const mockDetections: Detection[] = Array.from({ length: 50 }, (_, i) => generateDetection(i + 1))
