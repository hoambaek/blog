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

    const { count: total } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })

    const { count: active } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // This month's new subscribers
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: thisMonth } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('subscribed_at', startOfMonth.toISOString())

    return NextResponse.json({
      total: total || 0,
      active: active || 0,
      thisMonth: thisMonth || 0,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
