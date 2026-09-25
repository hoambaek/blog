/*
 * 글 본문 블록 — docs/content/article-format.md 1절(저장 형식)을 렌더용으로 옮긴 모양.
 * 파서(parse.ts)가 HTML을 이 블록 배열로 바꾸고, ArticleBody가 그린다.
 * 서버→클라이언트로 넘기므로 전부 JSON 직렬화 가능한 값만 둔다.
 * 번호(소제목 01·02, FIG 004–01)는 저장하지 않고 렌더 시 순서로 매긴다.
 */

export type InlineTag = 'a' | 'strong' | 'em' | 'u' | 's' | 'code' | 'sup' | 'sub' | 'mark'

export type InlineNode =
  | { t: 'text'; v: string }
  | { t: 'br' }
  | { t: 'el'; tag: InlineTag; href?: string; children: InlineNode[] }

export type ArticleBlock =
  /** 리드 문단 — <p class="lead"> */
  | { type: 'lead'; content: InlineNode[] }
  /** 일반 문단 */
  | { type: 'paragraph'; content: InlineNode[] }
  /** 번호 소제목 — <h2>/<h3> (렌더러가 01, 02… 부여) */
  | { type: 'heading'; content: InlineNode[] }
  /** 번호 없는 작은 소제목 — <h4>~<h6> */
  | { type: 'subheading'; content: InlineNode[] }
  /** 그림 — 캡션·크레딧이 있으면 FIG 번호가 붙는다 */
  | { type: 'figure'; src: string; alt: string; caption: InlineNode[] | null; credit: string | null }
  /** 이미지 자리 — 공개 화면에서는 그리지 않는다(관리자 미리보기용) */
  | { type: 'slot'; hint: string; ratio: string | null; caption: string | null }
  /** 인용·출처 */
  | { type: 'quote'; paragraphs: InlineNode[][]; cite: InlineNode[] | null }
  /** 용어 목록 — <dl data-block="terms"> */
  | { type: 'terms'; items: { term: InlineNode[]; desc: InlineNode[] }[] }
  /** 목록 */
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }
  /** 영상 — 무음·인라인·루프, 화면에 보일 때만 자동재생 */
  | { type: 'video'; src: string; poster: string | null }
  /** 구분선 */
  | { type: 'rule' }
  /** 규격 밖 요소(표·임베드 등) — 원문 HTML 그대로 */
  | { type: 'html'; html: string }
