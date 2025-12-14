import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - 뉴스레터 상세 조회
export async function GET(
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

    const { data, error } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching newsletter:', error)
      return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    return NextResponse.json({ newsletter: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - 뉴스레터 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { subject, preview_text, html_content, plain_text_content, status, scheduled_at } = body

    const supabase = await createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (subject !== undefined) updateData.subject = subject
    if (preview_text !== undefined) updateData.preview_text = preview_text
    if (html_content !== undefined) updateData.html_content = html_content
    if (plain_text_content !== undefined) updateData.plain_text_content = plain_text_content
    if (status !== undefined) updateData.status = status
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at

    const { data, error } = await supabase
      .from('newsletters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating newsletter:', error)
      return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newsletter: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 뉴스레터 삭제
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

    // 발송된 뉴스레터는 삭제 불가
    const { data: newsletter } = await supabase
      .from('newsletters')
      .select('status')
      .eq('id', id)
      .single()

    if (newsletter?.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot delete sent newsletter' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting newsletter:', error)
      return NextResponse.json({ error: 'Failed to delete newsletter' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
