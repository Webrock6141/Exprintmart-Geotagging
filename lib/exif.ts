import piexif from "piexifjs"

export interface GeoMetadata {
  title: string
  subject: string
  latitude: string
  longitude: string
  latRef: "N" | "S"
  lonRef: "E" | "W"
  website: string
  keywords: string
  description: string
  author: string
  websiteName: string
  downloadFormat?: string
}

export const MAX_DESCRIPTION = 1300
export const MAX_KEYWORDS = 6600

/**
 * Encode a string into the UCS-2 (UTF-16LE) byte array that EXIF XP* tags expect.
 * Each byte is returned as a number; the array is null terminated.
 */
function encodeXPString(value: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    bytes.push(code & 0xff)
    bytes.push((code >> 8) & 0xff)
  }
  // Null terminator (2 bytes for UCS-2)
  bytes.push(0, 0)
  return bytes
}

/** Decode a UCS-2 byte array (XP* tag) back into a string. */
function decodeXPString(bytes: number[]): string {
  let out = ""
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8)
    if (code === 0) break
    out += String.fromCharCode(code)
  }
  return out
}

/** Build the EXIF UserComment value (ASCII charset prefix + text). */
function encodeUserComment(value: string): string {
  // 8-byte character code header for ASCII followed by the comment text.
  return "ASCII\0\0\0" + value
}

function decodeBytesToString(value: unknown): string | null {
  if (typeof value === "string") return value

  const tryDecode = (encoding: string, bytes: Uint8Array) => {
    try {
      const decoded = new TextDecoder(encoding, { fatal: false }).decode(bytes)
      const cleaned = decoded.replace(/\u0000.*$/, "").trim()
      return cleaned || null
    } catch {
      return null
    }
  }

  if (value instanceof Uint8Array) {
    const bytes = value
    for (const encoding of ["utf-8", "utf-16le", "utf-16be", "latin1"]) {
      const decoded = tryDecode(encoding, bytes)
      if (decoded) return decoded
    }
    return null
  }

  if (Array.isArray(value)) {
    const first = value[0]
    if (typeof first === "number") {
      const bytes = Uint8Array.from(value as number[])
      for (const encoding of ["utf-8", "utf-16le", "utf-16be", "latin1"]) {
        const decoded = tryDecode(encoding, bytes)
        if (decoded) return decoded
      }
      return null
    }
  }

  return null
}

/**
 * Read a File into a base64 data URL.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Convert any image data URL to a JPEG data URL via canvas.
 * piexifjs can only embed EXIF into JPEG, so PNG/WebP are converted.
 */
export function toJpegDataURL(dataURL: string, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      // Fill white background so transparent PNGs don't turn black in JPEG.
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => reject(new Error("Could not load image for conversion"))
    img.src = dataURL
  })
}

export function convertDataURLToFormat(
  dataURL: string,
  format: "jpg" | "png" | "webp",
  quality = 0.92,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      if (format === "jpg") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)

      const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg"
      const output = canvas.toDataURL(mime, format === "jpg" ? quality : undefined)
      if (!output.startsWith(`data:${mime}`)) {
        reject(new Error(`${format.toUpperCase()} encoding is not supported by this browser`))
        return
      }
      resolve(output)
    }
    img.onerror = () => reject(new Error("Could not load image for conversion"))
    img.src = dataURL
  })
}

function dataURLToBytes(dataURL: string): Uint8Array {
  const base64 = dataURL.split(",")[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToDataURL(bytes: Uint8Array, mime: string): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return `data:${mime};base64,${btoa(binary)}`
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function writeUint24LE(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >>> 8) & 0xff
  bytes[offset + 2] = (value >>> 16) & 0xff
}

function makeWebPChunk(name: string, payload: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(8 + payload.length + (payload.length & 1))
  for (let i = 0; i < 4; i++) chunk[i] = name.charCodeAt(i)
  new DataView(chunk.buffer).setUint32(4, payload.length, true)
  chunk.set(payload, 8)
  return chunk
}

/** Extract the TIFF-formatted EXIF payload from a JPEG APP1 segment. */
function extractJpegExif(jpegDataURL: string): Uint8Array | null {
  const jpeg = dataURLToBytes(jpegDataURL)
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return null

  let offset = 2
  while (offset + 4 <= jpeg.length) {
    if (jpeg[offset] !== 0xff) break
    const marker = jpeg[offset + 1]
    if (marker === 0xda || marker === 0xd9) break
    const length = (jpeg[offset + 2] << 8) | jpeg[offset + 3]
    if (length < 2 || offset + 2 + length > jpeg.length) break
    if (
      marker === 0xe1 &&
      jpeg[offset + 4] === 0x45 &&
      jpeg[offset + 5] === 0x78 &&
      jpeg[offset + 6] === 0x69 &&
      jpeg[offset + 7] === 0x66 &&
      jpeg[offset + 8] === 0 &&
      jpeg[offset + 9] === 0
    ) {
      return jpeg.slice(offset + 10, offset + 2 + length)
    }
    offset += 2 + length
  }
  return null
}

/** Add the JPEG's EXIF payload to a canvas-generated WebP RIFF container. */
export function addExifToWebP(webpDataURL: string, taggedJpegDataURL: string): string {
  const exif = extractJpegExif(taggedJpegDataURL)
  if (!exif) return webpDataURL

  const webp = dataURLToBytes(webpDataURL)
  const ascii = (offset: number, length: number) =>
    String.fromCharCode(...webp.subarray(offset, offset + length))
  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WEBP") return webpDataURL

  const chunks: Uint8Array[] = []
  let vp8xPayload: Uint8Array | null = null
  let width = 0
  let height = 0
  let hasAlpha = false

  for (let offset = 12; offset + 8 <= webp.length; ) {
    const name = ascii(offset, 4)
    const size = new DataView(webp.buffer, webp.byteOffset + offset + 4, 4).getUint32(0, true)
    const end = offset + 8 + size + (size & 1)
    if (end > webp.length) break
    const payload = webp.subarray(offset + 8, offset + 8 + size)

    if (name === "VP8X" && size >= 10) {
      vp8xPayload = new Uint8Array(payload)
      width = readUint24LE(payload, 4) + 1
      height = readUint24LE(payload, 7) + 1
    } else if (name === "VP8 " && size >= 10) {
      width ||= (payload[6] | (payload[7] << 8)) & 0x3fff
      height ||= (payload[8] | (payload[9] << 8)) & 0x3fff
    } else if (name === "VP8L" && size >= 5) {
      width ||= 1 + payload[1] + ((payload[2] & 0x3f) << 8)
      height ||= 1 + ((payload[2] >>> 6) | (payload[3] << 2) | ((payload[4] & 0x0f) << 10))
      hasAlpha ||= (payload[4] & 0x10) !== 0
    } else if (name === "ALPH") {
      hasAlpha = true
    }

    if (name !== "VP8X" && name !== "EXIF") chunks.push(webp.slice(offset, end))
    offset = end
  }

  if (!width || !height) return webpDataURL
  const vp8x = vp8xPayload ?? new Uint8Array(10)
  vp8x[0] |= 0x08
  if (hasAlpha) vp8x[0] |= 0x10
  writeUint24LE(vp8x, 4, width - 1)
  writeUint24LE(vp8x, 7, height - 1)

  const orderedChunks = [makeWebPChunk("VP8X", vp8x), ...chunks, makeWebPChunk("EXIF", exif)]
  const totalLength = 12 + orderedChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  output.set([0x52, 0x49, 0x46, 0x46], 0)
  new DataView(output.buffer).setUint32(4, totalLength - 8, true)
  output.set([0x57, 0x45, 0x42, 0x50], 8)
  let outputOffset = 12
  for (const chunk of orderedChunks) {
    output.set(chunk, outputOffset)
    outputOffset += chunk.length
  }

  return bytesToDataURL(output, "image/webp")
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makePngChunk(name: string, payload: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + payload.length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, payload.length, false)
  for (let i = 0; i < 4; i++) chunk[4 + i] = name.charCodeAt(i)
  chunk.set(payload, 8)
  view.setUint32(8 + payload.length, crc32(chunk.subarray(4, 8 + payload.length)), false)
  return chunk
}

/** Add the JPEG's TIFF-formatted EXIF payload to a PNG eXIf chunk. */
export function addExifToPNG(pngDataURL: string, taggedJpegDataURL: string): string {
  const exif = extractJpegExif(taggedJpegDataURL)
  if (!exif) return pngDataURL

  const png = dataURLToBytes(pngDataURL)
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (!signature.every((byte, index) => png[index] === byte)) return pngDataURL

  const chunks: Uint8Array[] = []
  let insertedExif = false
  for (let offset = 8; offset + 12 <= png.length; ) {
    const view = new DataView(png.buffer, png.byteOffset + offset, 4)
    const size = view.getUint32(0, false)
    const end = offset + 12 + size
    if (end > png.length) return pngDataURL
    const name = String.fromCharCode(...png.subarray(offset + 4, offset + 8))

    if (name !== "eXIf") chunks.push(png.slice(offset, end))
    if (name === "IHDR" && !insertedExif) {
      chunks.push(makePngChunk("eXIf", exif))
      insertedExif = true
    }
    offset = end
    if (name === "IEND") break
  }

  if (!insertedExif) return pngDataURL
  const totalLength = 8 + chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  output.set(signature, 0)
  let outputOffset = 8
  for (const chunk of chunks) {
    output.set(chunk, outputOffset)
    outputOffset += chunk.length
  }
  return bytesToDataURL(output, "image/png")
}

export function buildDownloadFilename(filename: string, format: string) {
  const cleanName = filename.replace(/\.[^/.]+$/, "")
  const ext = format === "png" ? ".png" : format === "webp" ? ".webp" : ".jpg"
  return `${cleanName}${ext}`
}

export interface ExistingGeo {
  latitude: number
  longitude: number
}

export function readExifMetadata(jpegDataURL: string): Partial<GeoMetadata> {
  try {
    const exif = piexif.load(jpegDataURL)
    const zeroth = exif["0th"] as Record<number, unknown>
    const exifIfd = exif.Exif as Record<number, unknown>
    const gps = exif.GPS as Record<number, unknown>

    const metadata: Partial<GeoMetadata> = {}

    const rawTitle = zeroth[piexif.ImageIFD.DocumentName]
    const rawXPTitle = zeroth[piexif.ImageIFD.XPTitle]
    const rawSubject = zeroth[piexif.ImageIFD.XPSubject]
    const rawDescription = zeroth[piexif.ImageIFD.ImageDescription]
    const rawAuthor = zeroth[piexif.ImageIFD.Artist]
    const rawXPAuthor = zeroth[piexif.ImageIFD.XPAuthor]
    const rawWebsiteName = zeroth[piexif.ImageIFD.Copyright]
    const rawKeywords = zeroth[piexif.ImageIFD.XPKeywords]
    const rawWebsite = zeroth[piexif.ImageIFD.XPComment]
    const userComment = exifIfd[piexif.ExifIFD.UserComment]

    const title =
      decodeBytesToString(rawTitle) ||
      (Array.isArray(rawXPTitle) ? decodeXPString(rawXPTitle) : "")
    const subject =
      (Array.isArray(rawSubject) ? decodeXPString(rawSubject) : "") ||
      decodeBytesToString(rawSubject)
    const description = decodeBytesToString(rawDescription)
    const author =
      decodeBytesToString(rawAuthor) ||
      (Array.isArray(rawXPAuthor) ? decodeXPString(rawXPAuthor) : "")
    const websiteName = decodeBytesToString(rawWebsiteName)
    const keywords =
      (Array.isArray(rawKeywords) ? decodeXPString(rawKeywords) : "") ||
      decodeBytesToString(rawKeywords)
    const website =
      ((Array.isArray(rawWebsite) ? decodeXPString(rawWebsite) : "") ||
        decodeBytesToString(rawWebsite) ||
        decodeBytesToString(userComment)?.replace(/^ASCII\x00\x00\x00/, "")) ||
      ""

    if (title?.trim()) metadata.title = title
    if (subject?.trim()) metadata.subject = subject
    if (description?.trim()) metadata.description = description
    if (author?.trim()) metadata.author = author
    if (websiteName?.trim()) metadata.websiteName = websiteName
    if (keywords?.trim()) metadata.keywords = keywords
    if (website?.trim()) metadata.website = website

    const lat = gps[piexif.GPSIFD.GPSLatitude] as [number, number][] | undefined
    const latRef = gps[piexif.GPSIFD.GPSLatitudeRef] as string | undefined
    const lon = gps[piexif.GPSIFD.GPSLongitude] as [number, number][] | undefined
    const lonRef = gps[piexif.GPSIFD.GPSLongitudeRef] as string | undefined

    if (lat && lon && latRef && lonRef) {
      const latitude = piexif.GPSHelper.dmsRationalToDeg(lat, latRef)
      const longitude = piexif.GPSHelper.dmsRationalToDeg(lon, lonRef)
      if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
        metadata.latitude = String(latitude)
        metadata.longitude = String(longitude)
        metadata.latRef = latRef === "S" ? "S" : "N"
        metadata.lonRef = lonRef === "W" ? "W" : "E"
      }
    }

    return metadata
  } catch {
    return {}
  }
}

/**
 * Try to read existing GPS coordinates from a JPEG data URL.
 * Returns null if none are present or the file is not a readable JPEG.
 */
export function readExistingGeo(jpegDataURL: string): ExistingGeo | null {
  try {
    const exif = piexif.load(jpegDataURL)
    const gps = exif.GPS as Record<number, unknown>
    const lat = gps[piexif.GPSIFD.GPSLatitude] as [number, number][] | undefined
    const latRef = gps[piexif.GPSIFD.GPSLatitudeRef] as string | undefined
    const lon = gps[piexif.GPSIFD.GPSLongitude] as [number, number][] | undefined
    const lonRef = gps[piexif.GPSIFD.GPSLongitudeRef] as string | undefined

    if (!lat || !lon || !latRef || !lonRef) return null

    const latitude = piexif.GPSHelper.dmsRationalToDeg(lat, latRef)
    const longitude = piexif.GPSHelper.dmsRationalToDeg(lon, lonRef)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null

    return { latitude, longitude }
  } catch {
    return null
  }
}

/**
 * Embed the provided metadata into a JPEG data URL and return the new
 * JPEG data URL with EXIF written.
 */
export function writeExif(jpegDataURL: string, meta: GeoMetadata): string {
  let exif: ReturnType<typeof piexif.load>
  try {
    exif = piexif.load(jpegDataURL)
  } catch {
    exif = {
      "0th": {},
      Exif: {},
      GPS: {},
      Interop: {},
      "1st": {},
      thumbnail: null,
    }
  }

  const zeroth = exif["0th"] as Record<number, unknown>
  const exifIfd = exif.Exif as Record<number, unknown>
  const gps = exif.GPS as Record<number, unknown>

  if (meta.title) {
    zeroth[piexif.ImageIFD.DocumentName] = meta.title
    zeroth[piexif.ImageIFD.XPTitle] = encodeXPString(meta.title)
  }

  if (meta.subject) {
    zeroth[piexif.ImageIFD.XPSubject] = encodeXPString(meta.subject)
  }

  if (meta.description) {
    zeroth[piexif.ImageIFD.ImageDescription] = meta.description.slice(0, MAX_DESCRIPTION)
  }

  if (meta.author) {
    zeroth[piexif.ImageIFD.Artist] = meta.author
    zeroth[piexif.ImageIFD.XPAuthor] = encodeXPString(meta.author)
  }

  // if (meta.websiteName) {
  //   zeroth[piexif.ImageIFD.Copyright] = meta.websiteName
  if (meta.websiteName) {
  const raw = meta.websiteName.trim()
  const copyright = raw.startsWith("©") ? raw : `© 2014, ${raw}`
  zeroth[piexif.ImageIFD.Copyright] = copyright
}
  // }

  if (meta.keywords) {
    zeroth[piexif.ImageIFD.XPKeywords] = encodeXPString(meta.keywords.slice(0, MAX_KEYWORDS))
  }

  if (meta.website) {
    zeroth[piexif.ImageIFD.XPComment] = encodeXPString(meta.website)
    exifIfd[piexif.ExifIFD.UserComment] = encodeUserComment(meta.website)
  }

  zeroth[piexif.ImageIFD.Software] = "Exprintmart GeoTag Tool"

  const lat = Number.parseFloat(meta.latitude)
  const lon = Number.parseFloat(meta.longitude)
  if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
    gps[piexif.GPSIFD.GPSVersionID] = [2, 3, 0, 0]
    gps[piexif.GPSIFD.GPSLatitudeRef] = meta.latRef
    gps[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat))
    gps[piexif.GPSIFD.GPSLongitudeRef] = meta.lonRef
    gps[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lon))
  }

  const exifBytes = piexif.dump(exif)
  return piexif.insert(exifBytes, jpegDataURL)
}

/** Convert a data URL into a Blob for downloading. */
export function dataURLtoBlob(dataURL: string): Blob {
  const [header, base64] = dataURL.split(",")
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg"
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/** Trigger a browser download for a data URL. */
export function downloadDataURL(dataURL: string, filename: string) {
  const blob = dataURLtoBlob(dataURL)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export { decodeXPString }
