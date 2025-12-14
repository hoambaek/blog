import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = await createAdminClient()

    let query = supabase
      .from('subscribers')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })

    if (status && status !== '') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching subscribers:', error)
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    return NextResponse.json({
      subscribers: data,
      total: count || 0,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
