import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - 뉴스레터 목록 조회
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = await createAdminClient()

    let query = supabase
      .from('newsletters')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && ['draft', 'scheduled', 'sent', 'failed'].includes(status)) {
      query = query.eq('status', status as 'draft' | 'scheduled' | 'sent' | 'failed')
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching newsletters:', error)
      return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 })
    }

    return NextResponse.json({ newsletters: data, total: count })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 새 뉴스레터 생성
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subject, preview_text, html_content, plain_text_content, status } = body

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('newsletters')
      .insert({
        subject,
        preview_text,
        html_content,
        plain_text_content,
        status: status || 'draft',
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating newsletter:', error)
      return NextResponse.json({ error: 'Failed to create newsletter' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newsletter: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
