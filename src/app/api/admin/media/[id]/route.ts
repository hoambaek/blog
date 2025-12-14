import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const supabase = await createAdminClient()

    // Get the file info first
    const { data: file } = await supabase
      .from('media')
      .select('file_path')
      .eq('id', id)
      .single()

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from database
    const { error } = await supabase
      .from('media')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting media:', error)
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
    }

    // Note: R2 file deletion would go here if needed

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
