export interface LonLat {
  longitude: number
  latitude: number
}

const EWKB_SRID_FLAG = 0x20000000

/**
 * Parses an EWKB (Extended Well-Known Binary) hex string representing a
 * POINT geometry (optionally with SRID) into longitude/latitude coordinates.
 */
export function ewkbToLonLat(ewkbHex: string): LonLat {
  const bytes = hexToBytes(ewkbHex)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  const littleEndian = view.getUint8(0) === 1
  let offset = 1

  const geomType = view.getUint32(offset, littleEndian)
  offset += 4

  if ((geomType & 0xffff) !== 1) {
    throw new Error('EWKB geometry is not a POINT')
  }

  if (geomType & EWKB_SRID_FLAG) {
    offset += 4 // skip SRID
  }

  const longitude = view.getFloat64(offset, littleEndian)
  offset += 8
  const latitude = view.getFloat64(offset, littleEndian)

  return { longitude, latitude }
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim()
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return bytes
}

/**
 * Encodes longitude/latitude into an EWKB hex string representing a
 * POINT geometry with SRID, little-endian (matches PostGIS/GeoAlchemy2 output).
 */
export function lonLatToEwkb(longitude: number, latitude: number, srid = 4326): string {
  const buffer = new ArrayBuffer(25)
  const view = new DataView(buffer)

  view.setUint8(0, 1) // little endian
  view.setUint32(1, 0x20000001, true) // POINT type with SRID flag
  view.setUint32(5, srid, true)
  view.setFloat64(9, longitude, true)
  view.setFloat64(17, latitude, true)

  return bytesToHex(new Uint8Array(buffer))
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join('')
}
