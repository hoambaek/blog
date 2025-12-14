import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createAdminClient()

    // This month's start date
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Run all queries in parallel
    const [totalResult, activeResult, thisMonthResult] = await Promise.all([
      supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .gte('subscribed_at', startOfMonth.toISOString()),
    ])

    return NextResponse.json({
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      thisMonth: thisMonthResult.count || 0,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
