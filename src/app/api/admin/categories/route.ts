import { NextResponse } from 'next/server'
import { guardAdminApi } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const guard = await guardAdminApi()
  if (!guard.ok) return guard.response

  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
