import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/*
 * 2026-07-27 — 쿠키 배선을 걷어냈다. 이게 블로그가 느렸던 진짜 이유다.
 *
 * 전에는 두 클라이언트 모두 @supabase/ssr의 createServerClient에 cookies()를
 * 물려 두고 있었다. 그런데 이 레포의 인증은 Clerk이고 Supabase Auth는 어디에도
 * 쓰이지 않는다 — 그 쿠키에는 담길 세션 자체가 없었다.
 *
 * 대가는 컸다. 서버 컴포넌트가 cookies()를 읽으면 Next는 그 라우트를 동적으로
 * 판정하고, 그러면 페이지에 적어 둔 revalidate = 3600이 아무 일도 하지 않는다.
 * 실제로 배포된 블로그는 모든 요청이 x-vercel-cache: MISS / age: 0이었고
 * (TTFB 0.8~1.2초), 캐시가 한 번도 쓰이지 않았다.
 *
 * 세션이 없으니 익명 역할은 그대로다 — RLS 관점에서 달라지는 것은 없다.
 * Supabase Auth를 도입하게 되면 그때는 쿠키를 읽는 클라이언트를 따로 만들고,
 * 그걸 쓰는 페이지는 캐시를 포기한다는 것을 알고 써야 한다.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const noPersist = { auth: { persistSession: false, autoRefreshToken: false } }

/** 공개 읽기용 (anon 키) — 발행된 글만 읽는다. 정적 캐시를 막지 않는다. */
export async function createClient() {
  return createSupabaseClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, noPersist)
}

/** 관리자·쓰기용 (service role) — RLS 우회. 호출부에서 권한을 먼저 확인할 것. */
export async function createAdminClient() {
  return createSupabaseClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, noPersist)
}
