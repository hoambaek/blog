import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadToR2, generateUniqueFilename } from '@/lib/r2/client'
import {
  optimizeCoverImage,
  optimizeContentImage,
  base64ToBuffer,
  getExtensionForContentType,
} from '@/lib/image/optimize'

interface UploadBase64Request {
  base64: string
  folder?: string
  type?: 'cover' | 'content'
  filename?: string
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

    const body: UploadBase64Request = await request.json()
    const { base64, folder = 'ai-images', type = 'content', filename = 'ai-generated' } = body

    if (!base64) {
      return NextResponse.json(
        { error: 'No base64 data provided' },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const originalBuffer = base64ToBuffer(base64)

    // Optimize the image
    const optimized = type === 'cover'
      ? await optimizeCoverImage(originalBuffer)
      : await optimizeContentImage(originalBuffer)

    const optimizationInfo = {
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      savings: Math.round((1 - optimized.optimizedSize / optimized.originalSize) * 100),
      width: optimized.width,
      height: optimized.height,
      format: optimized.format,
    }

    console.log(`AI Image optimized: ${optimizationInfo.originalSize} → ${optimizationInfo.optimizedSize} bytes (${optimizationInfo.savings}% savings)`)

    // Generate unique filename with correct extension
    const ext = getExtensionForContentType(optimized.contentType)
    const uniqueFilename = generateUniqueFilename(`${filename}.${ext}`)
    const key = `${folder}/${uniqueFilename}`

    // Upload to R2
    const url = await uploadToR2(optimized.buffer, key, optimized.contentType)

    return NextResponse.json({
      success: true,
      url,
      key,
      filename: uniqueFilename,
      optimization: optimizationInfo,
    })
  } catch (error) {
    console.error('Error uploading base64 image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
