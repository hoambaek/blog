import sharp from 'sharp'

export interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
}

export interface OptimizedImage {
  buffer: Buffer
  contentType: string
  width: number
  height: number
  format: string
  originalSize: number
  optimizedSize: number
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
  maxWidth: 2400,
  maxHeight: 1600,
  quality: 85,
  format: 'webp',
}

/**
 * Optimize an image buffer for web delivery
 * - Converts to WebP format (best compression with quality)
 * - Resizes to max dimensions while maintaining aspect ratio
 * - Applies quality compression
 */
export async function optimizeImage(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = input.length

  // Get image metadata
  const metadata = await sharp(input).metadata()

  // Process image
  let pipeline = sharp(input)
    .rotate() // Auto-rotate based on EXIF

  // Resize if needed (maintaining aspect ratio)
  if (metadata.width && metadata.height) {
    const needsResize =
      metadata.width > opts.maxWidth ||
      metadata.height > opts.maxHeight

    if (needsResize) {
      pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
  }

  // Convert to target format with quality settings
  let buffer: Buffer
  let contentType: string

  switch (opts.format) {
    case 'webp':
      buffer = await pipeline.webp({ quality: opts.quality }).toBuffer()
      contentType = 'image/webp'
      break
    case 'avif':
      buffer = await pipeline.avif({ quality: opts.quality }).toBuffer()
      contentType = 'image/avif'
      break
    case 'jpeg':
      buffer = await pipeline.jpeg({ quality: opts.quality, mozjpeg: true }).toBuffer()
      contentType = 'image/jpeg'
      break
    case 'png':
      buffer = await pipeline.png({ quality: opts.quality, compressionLevel: 9 }).toBuffer()
      contentType = 'image/png'
      break
    default:
      buffer = await pipeline.webp({ quality: opts.quality }).toBuffer()
      contentType = 'image/webp'
  }

  // Get final dimensions
  const finalMetadata = await sharp(buffer).metadata()

  return {
    buffer,
    contentType,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
    format: opts.format,
    originalSize,
    optimizedSize: buffer.length,
  }
}

/**
 * Optimize image specifically for cover images (16:9 or 21:9 aspect)
 */
export async function optimizeCoverImage(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImage> {
  return optimizeImage(input, {
    maxWidth: 2400,
    maxHeight: 1350, // Optimized for 16:9 at 2400px width
    quality: 85,
    format: 'webp',
    ...options,
  })
}

/**
 * Optimize image for content/inline images
 */
export async function optimizeContentImage(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImage> {
  return optimizeImage(input, {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 82,
    format: 'webp',
    ...options,
  })
}

/**
 * Convert base64 string to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * Get file extension for content type
 */
export function getExtensionForContentType(contentType: string): string {
  const map: Record<string, string> = {
    // Images
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    // Videos
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
  }
  return map[contentType] || contentType.split('/')[1] || 'bin'
}
