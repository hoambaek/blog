/*
 * 에디터 출력(editor.getHTML()) → 저장 HTML 정리.
 * 스키마가 자리만 채워 둔 빈 요소를 걷어 내 docs/content/article-format.md 1절 모양으로 맞춘다.
 * 입력이 우리 스키마의 직렬화 결과라 모양이 일정하다 — 그래서 정규식으로 충분하다.
 */

const EMPTY_INNER = '(?:\\s|&nbsp;|<br\\s*/?>)*'

export function cleanArticleHtml(html: string): string {
  return (
    html
      // 스키마 속성 표기 정리: data-caption="" → data-caption
      .replace(/ data-(caption|credit|slot)=""/g, ' data-$1')
      // 빈 캡션·크레딧 칸
      .replace(/<span data-caption><\/span>/g, '')
      .replace(/<span data-credit><\/span>/g, '')
      .replace(/<figcaption><\/figcaption>/g, '')
      // 빈 출처
      .replace(/<cite><\/cite>/g, '')
      // 간격용 빈 문단 (규격: 빈 <p>로 간격을 만들지 않는다)
      .replace(new RegExp(`<p(?: class="lead")?>${EMPTY_INNER}</p>`, 'g'), '')
  )
}
