import type { ReactNode } from 'react'
import type { ArticleBlock, InlineNode } from '@/lib/article/types'
import './article-body.css'

/*
 * 글 본문 렌더러 — docs/content/article-format.md 1절의 블록을 Paper 시안대로 그린다.
 * 상태·효과가 없는 순수 렌더 컴포넌트다. 공개 글 화면과 (다음 단계) 관리자 미리보기가 같이 쓴다.
 *
 * - 소제목 번호: h2·h3 순서대로 01, 02…
 * - FIG 번호: 사진이 들어간 그림은 전부 나오는 순서대로 {글번호}–01, 02… (2026-09-26 대표 결정 — 캡션 유무와 무관).
 *   이미지 자리(slot)는 번호를 받지 않는다. 사진이 채워지면 그때 순서에 들어간다.
 * - 이미지 자리(slot)는 공개 화면에서 그리지 않는다. 관리자 미리보기(showSlots)에서만 점선 상자로 보인다.
 * - 영상은 muted·playsInline·loop로만 그린다. 자동재생(화면에 보일 때만)은 감싸는 쪽이 data-autoplay를 보고 건다.
 */

export interface ArticleBodyProps {
  blocks: ArticleBlock[]
  /** 글 번호 N° (발행 순서). 초안처럼 번호가 없으면 null — FIG는 순서만 쓴다 */
  postNumber: number | null
  className?: string
  /** 관리자 미리보기 — 비어 있는 이미지 자리를 점선 상자로 그린다 */
  showSlots?: boolean
}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

function isExternal(href: string) {
  return /^https?:/i.test(href) && !/^https?:\/\/blog\.musedemaree\.com/i.test(href)
}

export function renderInline(nodes: InlineNode[], keyPrefix = ''): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}${i}`
    if (node.t === 'text') return node.v
    if (node.t === 'br') return <br key={key} />
    const children = renderInline(node.children, `${key}.`)
    switch (node.tag) {
      case 'a':
        return isExternal(node.href ?? '') ? (
          <a key={key} href={node.href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ) : (
          <a key={key} href={node.href}>
            {children}
          </a>
        )
      case 'strong':
        return <strong key={key}>{children}</strong>
      case 'em':
        return <em key={key}>{children}</em>
      case 'u':
        return <u key={key}>{children}</u>
      case 's':
        return <s key={key}>{children}</s>
      case 'code':
        return <code key={key}>{children}</code>
      case 'sup':
        return <sup key={key}>{children}</sup>
      case 'sub':
        return <sub key={key}>{children}</sub>
      case 'mark':
        return <mark key={key}>{children}</mark>
    }
  })
}

/** 블록마다 붙일 번호를 미리 매긴다 — 소제목 순번, 캡션·크레딧이 있는 그림의 순번 */
function numberBlocks(blocks: ArticleBlock[]): (number | null)[] {
  let heading = 0
  let fig = 0
  return blocks.map((block) => {
    if (block.type === 'heading') return ++heading
    if (block.type === 'figure') return ++fig
    return null
  })
}

export function ArticleBody({ blocks, postNumber, className, showSlots = false }: ArticleBodyProps) {
  const numbers = numberBlocks(blocks)
  const figPrefix = postNumber ? `${pad(postNumber, 3)}–` : ''

  return (
    <div className={`post-content article-body${className ? ` ${className}` : ''}`}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'lead':
            return (
              <p key={i} className="ab-lead">
                {renderInline(block.content)}
              </p>
            )
          case 'paragraph':
            return (
              <p key={i} className="ab-p">
                {renderInline(block.content)}
              </p>
            )
          case 'heading':
            return (
              <h2 key={i} className="ab-heading">
                <span className="ab-heading-num" aria-hidden="true">
                  {pad(numbers[i] ?? 0, 2)}
                </span>
                <span className="ab-heading-text">{renderInline(block.content)}</span>
              </h2>
            )
          case 'subheading':
            return (
              <h3 key={i} className="ab-subheading">
                {renderInline(block.content)}
              </h3>
            )
          case 'figure': {
            const labelled = numbers[i] !== null
            return (
              <figure key={i} className="ab-figure">
                {/* 본문 이미지는 비율이 제각각이라 원본 비율 그대로 그린다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
                {labelled && (
                  <figcaption>
                    <span className="ab-fig-num">FIG. {figPrefix}{pad(numbers[i] ?? 0, 2)}</span>
                    {block.caption && <span className="ab-fig-caption">{renderInline(block.caption)}</span>}
                    {block.credit && <span className="ab-fig-credit">PHOTO {block.credit}</span>}
                  </figcaption>
                )}
              </figure>
            )
          }
          case 'slot': {
            if (!showSlots) return null
            const [w, h] = (block.ratio ?? '').split(':').map(Number)
            return (
              <figure key={i} className="ab-figure ab-slot">
                <div className="ab-slot-box" style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined}>
                  <span className="ab-slot-label">IMAGE SLOT{block.ratio ? ` · ${block.ratio}` : ''} · 공개 화면에는 보이지 않음</span>
                  {block.hint && <span className="ab-slot-hint">{block.hint}</span>}
                </div>
                {block.caption && (
                  <figcaption>
                    <span className="ab-fig-caption">{block.caption}</span>
                  </figcaption>
                )}
              </figure>
            )
          }
          case 'quote':
            return (
              <blockquote key={i} className="ab-quote">
                {block.paragraphs.map((p, j) => (
                  <p key={j}>{renderInline(p)}</p>
                ))}
                {block.cite && <cite>{renderInline(block.cite)}</cite>}
              </blockquote>
            )
          case 'terms':
            return (
              <dl key={i} className="ab-terms">
                {block.items.map((item, j) => (
                  <div key={j}>
                    <dt>{renderInline(item.term)}</dt>
                    <dd>{renderInline(item.desc)}</dd>
                  </div>
                ))}
              </dl>
            )
          case 'list': {
            const items = block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)
            return block.ordered ? (
              <ol key={i} className="ab-list">
                {items}
              </ol>
            ) : (
              <ul key={i} className="ab-list">
                {items}
              </ul>
            )
          }
          case 'video':
            return (
              <div key={i} className="ab-video">
                <video
                  src={block.src}
                  poster={block.poster ?? undefined}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  data-autoplay=""
                />
              </div>
            )
          case 'rule':
            return <hr key={i} className="ab-rule" />
          case 'html':
            return <div key={i} className="ab-html" dangerouslySetInnerHTML={{ __html: block.html }} />
        }
      })}
    </div>
  )
}
