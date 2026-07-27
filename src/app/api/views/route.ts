import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/*
 * 조회수 집계 — 브라우저가 부른다.
 *
 * 전에는 /post/[slug] 렌더 중에 서버에서 세었다. 그때는 페이지가 매 요청 새로
 * 그려졌으니 "요청 = 조회"가 맞았지만, 이제 그 페이지는 한 시간짜리 캐시를
 * 탄다. 같은 자리에 두면 한 시간에 한 번만 올라가서 조회수가 아니라
 * "재생성 횟수"가 된다 — 관리자 목록에 그 숫자가 그대로 나오므로
 * 조용히 틀린 데이터가 쌓인다. 그래서 세는 자리를 브라우저로 옮겼다.
 *
 * 남는 한계: 공개 엔드포인트라 반복 호출로 부풀릴 수 있다. 다만 예전에도
 * 새로고침으로 똑같이 부풀릴 수 있었으니 더 나빠지지는 않았다. 이 숫자가
 * 판단 근거가 될 정도로 중요해지면 IP·기간 기준 중복 제거를 붙일 것.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  /* 같은 사이트에서 온 요청만 — 브라우저는 POST에 Origin을 항상 붙인다 */
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let postId: unknown
  try {
    postId = (await request.json())?.postId
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (typeof postId !== 'string' || !UUID.test(postId)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.rpc('increment_view_count', { post_id: postId })

  if (error) {
    /* RPC가 없는 환경 대비 — 읽고 더해서 쓴다(경합 시 유실 가능, 조회수라 감수) */
    const { data: post } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', postId)
      .single()
    if (post) {
      await supabase
        .from('posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', postId)
    }
  }

  return new NextResponse(null, { status: 204 })
}
