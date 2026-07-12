// Client-side media upload helper.
//
// Small images go through /api/upload so the server can optimize them (sharp).
// Large files and videos upload directly to R2 via a presigned URL, because
// Vercel serverless functions reject request bodies over 4.5MB with a 413.
const DIRECT_UPLOAD_THRESHOLD = 4 * 1024 * 1024

export interface UploadResult {
  url: string
  optimization?: {
    originalSize: number
    optimizedSize: number
    savings: number
  } | null
}

async function parseJsonSafe(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function uploadMediaFile(file: File, folder: string): Promise<UploadResult> {
  const isVideo = file.type.startsWith('video/')

  if (!isVideo && file.size <= DIRECT_UPLOAD_THRESHOLD) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await parseJsonSafe(res)

    if (!res.ok || !data?.success) {
      throw new Error((data?.error as string) || `업로드에 실패했습니다. (${res.status})`)
    }
    return {
      url: data.url as string,
      optimization: (data.optimization as UploadResult['optimization']) ?? null,
    }
  }

  // Direct-to-R2 path for videos and large images
  const presignRes = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder,
    }),
  })
  const presign = await parseJsonSafe(presignRes)

  if (!presignRes.ok || !presign?.success) {
    throw new Error((presign?.error as string) || `업로드 URL 발급에 실패했습니다. (${presignRes.status})`)
  }

  const putRes = await fetch(presign.uploadUrl as string, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  if (!putRes.ok) {
    throw new Error(`스토리지 업로드에 실패했습니다. (${putRes.status})`)
  }

  return { url: presign.publicUrl as string }
}
