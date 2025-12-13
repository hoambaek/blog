import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 Configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'blog-images'
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL // e.g., https://images.musedemaree.com

// Create S3 client configured for R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = R2_BUCKET_NAME

// Generate a unique filename
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${randomStr}.${ext}`
}

// Get the public URL for an uploaded file
export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  // Fallback to R2.dev URL if public URL not set
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${key}`
}

// Upload file directly
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await r2Client.send(command)
  return getPublicUrl(key)
}

// Generate presigned URL for client-side upload
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(r2Client, command, { expiresIn })
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  })

  await r2Client.send(command)
}

// Extract key from URL
export function getKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Remove leading slash
    return urlObj.pathname.replace(/^\//, '')
  } catch {
    return null
  }
}

// Allowed media types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-matroska', // .mkv
]

export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

// Check if file is a video
export function isVideoFile(type: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(type)
}

// Check if file is an image
export function isImageFile(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(type)
}

// Validate media file (images and videos)
export function validateMediaFile(
  file: { type: string; size: number },
  maxImageSizeInMB: number = 10,
  maxVideoSizeInMB: number = 100
): { valid: boolean; error?: string; isVideo: boolean } {
  const isVideo = isVideoFile(file.type)
  const isImage = isImageFile(file.type)

  if (!isVideo && !isImage) {
    return {
      valid: false,
      error: `Invalid file type. Allowed images: JPEG, PNG, GIF, WebP, AVIF, HEIC, SVG, BMP, TIFF. Allowed videos: MP4, WebM, OGG, MOV, AVI, MKV`,
      isVideo: false,
    }
  }

  const maxSizeBytes = isVideo
    ? maxVideoSizeInMB * 1024 * 1024
    : maxImageSizeInMB * 1024 * 1024

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${isVideo ? maxVideoSizeInMB : maxImageSizeInMB}MB`,
      isVideo,
    }
  }

  return { valid: true, isVideo }
}

// Legacy function for backward compatibility
export function validateImageFile(
  file: { type: string; size: number },
  maxSizeInMB: number = 10
): { valid: boolean; error?: string } {
  const result = validateMediaFile(file, maxSizeInMB)
  return { valid: result.valid, error: result.error }
}
