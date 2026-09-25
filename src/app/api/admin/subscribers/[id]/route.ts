import { NextRequest, NextResponse } from 'next/server'
import { guardAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'

// DELETE - 구독자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardAdminApi()
  if (!guard.ok) return guard.response

  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting subscriber:', error)
      return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
