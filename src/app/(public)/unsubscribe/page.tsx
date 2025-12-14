'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, ArrowLeft } from 'lucide-react'
import { unsubscribe } from '@/lib/actions/subscribers'
import { useLocale } from '@/lib/i18n'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const { locale } = useLocale()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    try {
      const result = await unsubscribe(email)
      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setMessage(result.error || content[locale].error)
      }
    } catch {
      setStatus('error')
      setMessage(content[locale].error)
    }
  }

  const content = {
    ko: {
      title: '구독 취소',
      description: '뉴스레터 수신을 중단합니다',
      emailPlaceholder: '이메일 주소',
      button: '구독 취소',
      processing: '처리 중...',
      cancel: '취소',
      successTitle: '구독이 취소되었습니다',
      successDesc: '언제든 다시 구독하실 수 있습니다.',
      resubscribe: '다시 구독하기',
      backHome: '돌아가기',
      error: '오류가 발생했습니다.',
    },
    en: {
      title: 'Unsubscribe',
      description: 'Stop receiving our newsletter',
      emailPlaceholder: 'Email address',
      button: 'Unsubscribe',
      processing: 'Processing...',
      cancel: 'Cancel',
      successTitle: 'You have been unsubscribed',
      successDesc: 'You can resubscribe anytime.',
      resubscribe: 'Resubscribe',
      backHome: 'Go back',
      error: 'An error occurred.',
    },
  }

  const c = content[locale] || content.ko

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 mx-auto mb-6 rounded-full border border-rose-gold/40 flex items-center justify-center">
            <Check className="w-5 h-5 text-rose-gold" strokeWidth={1.5} />
          </div>

          <h1 className="font-display text-2xl text-white mb-2">
            {c.successTitle}
          </h1>
          <p className="text-sm text-white/40 mb-8">
            {c.successDesc}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/subscribe"
              className="py-2.5 px-5 bg-rose-gold/10 border border-rose-gold/30 text-sm text-rose-gold hover:bg-rose-gold/20 transition-colors"
            >
              {c.resubscribe}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {c.backHome}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-white mb-2">
            {c.title}
          </h1>
          <p className="text-sm text-white/40">
            {c.description}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.emailPlaceholder}
            className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
            required
            disabled={status === 'loading'}
          />

          {status === 'error' && (
            <p className="text-red-400/80 text-xs text-center">{message}</p>
          )}

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 text-center border border-white/10 text-sm text-white/50 hover:bg-white/5 transition-colors"
            >
              {c.cancel}
            </Link>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-1 py-2.5 bg-white/10 text-sm text-white hover:bg-white/15 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? c.processing : c.button}
            </button>
          </div>
        </form>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {c.backHome}
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
