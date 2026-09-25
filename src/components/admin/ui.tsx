import type { ButtonHTMLAttributes, ReactNode } from 'react'

/*
 * 관리자 공용 조각 — Paper 'Blog Admin'의 반복 요소.
 * 모서리 없음, 선은 earth(#312E2A) 투명도, 라벨은 IBM Plex Mono 대문자 + 넓은 자간.
 */

/** 섹션 머리: 앰버 영문 킥커 + 명조 32px 제목 */
export function PageHead({ kicker, title, actions }: { kicker: string; title: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-plex text-[10.5px] leading-[14px] tracking-[0.18em] text-amber-deep">{kicker}</span>
        <h1 className="font-serif-kr text-[32px] font-light leading-10 text-earth">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  )
}

/** 작은 대문자 라벨 (9.5~10px Plex) */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-plex text-[9.5px] leading-3 tracking-[0.16em] text-stone-light ${className}`}>{children}</span>
  )
}

type ButtonTone = 'dark' | 'outline' | 'amber' | 'outlineDark' | 'ghostDark'

const TONES: Record<ButtonTone, string> = {
  // 종이 위
  dark: 'bg-void text-paper hover:bg-earth',
  outline: 'border border-earth/40 text-earth hover:border-earth',
  // void 바 위
  amber: 'bg-amber text-void hover:bg-amber-light',
  outlineDark: 'border border-paper/40 text-paper hover:border-paper/80',
  ghostDark: 'border border-paper/25 text-paper/85 hover:border-paper/60',
}

export function Button({
  tone = 'outline',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 text-[13.5px] leading-[18px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${TONES[tone]} ${className}`}
    >
      {children}
    </button>
  )
}

/** 밑줄 탭 (전체 5 · 발행 4 …) */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-[26px]" role="tablist">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`pb-1.5 text-[13.5px] leading-[18px] transition-colors ${
              active ? 'border-b border-earth text-earth' : 'border-b border-transparent font-light text-stone hover:text-earth'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

/** 표 머리 칸 */
export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <span className={`font-plex text-[10px] leading-3 tracking-[0.16em] text-stone-light ${className}`}>{children}</span>
  )
}

/** 확인 창 — window.confirm 대신 관리자 톤으로 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean
  title: string
  body?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-void/40 px-5" role="dialog" aria-modal="true">
      <div className="w-full max-w-[420px] border border-earth/20 bg-paper p-7 shadow-[0_18px_40px_rgb(10_9_8/0.14)]">
        <p className="font-serif-kr text-[20px] font-light leading-7 text-earth">{title}</p>
        {body && <div className="mt-3 text-[13.5px] font-light leading-6 text-stone-dark">{body}</div>}
        <div className="mt-7 flex justify-end gap-3">
          <Button tone="outline" className="px-5 py-2.5" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button tone="dark" className="px-5 py-2.5" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
