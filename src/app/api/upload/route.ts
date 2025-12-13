import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  uploadToR2,
  generateUniqueFilename,
  validateMediaFile,
  isVideoFile,
} from '@/lib/r2/client'
import {
  optimizeCoverImage,
  optimizeContentImage,
  getExtensionForContentType,
} from '@/lib/image/optimize'

// Types that should skip optimization
const SKIP_OPTIMIZATION_TYPES = [
  'image/gif',
  'image/svg+xml',
  'video/',
]

function shouldSkipOptimization(type: string): boolean {
  return SKIP_OPTIMIZATION_TYPES.some(t => type.startsWith(t)) || isVideoFile(type)
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'posts'
    const skipOptimization = formData.get('skipOptimization') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file (images up to 10MB, videos up to 100MB)
    const validation = validateMediaFile({
      type: file.type,
      size: file.size,
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(arrayBuffer)
    let contentType = file.type
    let optimizationInfo = null

    // Optimize image unless skipped (videos, GIFs, SVGs are skipped)
    if (!skipOptimization && !shouldSkipOptimization(file.type)) {
      try {
        // Use cover optimization for cover images, content optimization for others
        const optimized = folder === 'covers'
          ? await optimizeCoverImage(buffer)
          : await optimizeContentImage(buffer)

        buffer = optimized.buffer
        contentType = optimized.contentType

        optimizationInfo = {
          originalSize: optimized.originalSize,
          optimizedSize: optimized.optimizedSize,
          savings: Math.round((1 - optimized.optimizedSize / optimized.originalSize) * 100),
          width: optimized.width,
          height: optimized.height,
          format: optimized.format,
        }

        console.log(`Image optimized: ${optimizationInfo.originalSize} → ${optimizationInfo.optimizedSize} bytes (${optimizationInfo.savings}% savings)`)
      } catch (optimizeError) {
        console.warn('Image optimization failed, uploading original:', optimizeError)
        // Continue with original if optimization fails
      }
    }

    // Generate unique filename with correct extension
    const ext = getExtensionForContentType(contentType)
    const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove original extension
    const filename = generateUniqueFilename(`${baseName}.${ext}`)
    const key = `${folder}/${filename}`

    // Upload to R2
    const url = await uploadToR2(buffer, key, contentType)

    return NextResponse.json({
      success: true,
      url,
      key,
      filename,
      optimization: optimizationInfo,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

