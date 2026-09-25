import { NextRequest, NextResponse } from 'next/server'
import { guardAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardAdminApi()
  if (!guard.ok) return guard.response

  const { id } = await params

  try {
    const body = await request.json()
    const { description } = body

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('categories')
      .update({
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
