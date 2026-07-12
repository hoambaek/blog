import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getPresignedUploadUrl,
  generateUniqueFilename,
  getPublicUrl,
  validateMediaFile,
} from '@/lib/r2/client'

// Issues a presigned R2 upload URL so the browser can upload large files
// directly to storage. Vercel serverless functions reject request bodies
// over 4.5MB, so /api/upload cannot receive large images or videos.
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, contentType, size, folder = 'posts' } = await request.json()

    if (!filename || !contentType || typeof size !== 'number') {
      return NextResponse.json(
        { error: 'filename, contentType, size are required' },
        { status: 400 }
      )
    }

    const validation = validateMediaFile({ type: contentType, size })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const safeFolder = ['posts', 'covers'].includes(folder) ? folder : 'posts'
    const key = `${safeFolder}/${generateUniqueFilename(filename)}`
    const uploadUrl = await getPresignedUploadUrl(key, contentType)

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl: getPublicUrl(key),
      key,
    })
  } catch (error) {
    console.error('Error creating presigned upload URL:', error)
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}
