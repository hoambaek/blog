'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Check, ArrowLeft, Mail, X } from 'lucide-react'
import { unsubscribe } from '@/lib/actions/subscribers'
import { useLocale } from '@/lib/i18n'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const { locale } = useLocale()

  useEffect(() => {
    setIsVisible(true)
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [emailParam])

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
      eyebrow: 'Newsletter',
      title: '구독 취소',
      subtitle: '아쉽지만, 언제든 다시 만나길 바랍니다',
      description: '뉴스레터 구독을 취소하시면 더 이상 Le Journal de Marée의 소식을 받아보실 수 없습니다.',
      emailLabel: '이메일 주소',
      emailPlaceholder: '구독 취소할 이메일',
      button: '구독 취소',
      processing: '처리 중...',
      cancel: '취소',
      successTitle: '구독이 취소되었습니다',
      successSubtitle: '다시 만날 날을 기다리겠습니다',
      successDesc: '언제든 다시 구독하실 수 있습니다. 바다의 이야기는 항상 여기에 있습니다.',
      resubscribe: '다시 구독하기',
      backHome: '저널로 돌아가기',
      error: '구독 취소 처리 중 오류가 발생했습니다.',
    },
    en: {
      eyebrow: 'Newsletter',
      title: 'Unsubscribe',
      subtitle: 'We hope to see you again',
      description: 'If you unsubscribe, you will no longer receive updates from Le Journal de Marée.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Email to unsubscribe',
      button: 'Unsubscribe',
      processing: 'Processing...',
      cancel: 'Cancel',
      successTitle: 'You have been unsubscribed',
      successSubtitle: 'We hope to see you again',
      successDesc: 'You can always resubscribe. The stories of the sea will always be here.',
      resubscribe: 'Resubscribe',
      backHome: 'Return to Journal',
      error: 'An error occurred while processing your request.',
    },
  }

  const c = content[locale] || content.ko

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-30 bg-[#050505] text-white overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0">
          <Image
            src="/bg.png"
            alt=""
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60" />
        </div>

        {/* Success Content */}
        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <div className="text-center max-w-lg animate-fade-in-up">
            {/* Success Icon */}
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 border border-white/20 rotate-45" />
              <div className="absolute inset-2 border border-white/30 rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-8 h-8 text-white/60" strokeWidth={1.5} />
              </div>
            </div>

            {/* Success Text */}
            <p className="text-[10px] uppercase tracking-[0.5em] text-white/50 mb-4">
              Unsubscribed
            </p>
            <h1 className="font-display text-3xl md:text-4xl mb-3">
              {c.successTitle}
            </h1>
            <p className="font-display text-lg text-white/50 italic mb-4">
              {c.successSubtitle}
            </p>
            <p className="text-sm text-white/40 mb-8 max-w-sm mx-auto leading-relaxed">
              {c.successDesc}
            </p>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/20" />
              <Mail className="w-4 h-4 text-white/30" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/subscribe"
                className="group inline-flex items-center gap-2 px-6 py-3 border border-rose-gold/40 text-sm text-rose-gold hover:bg-rose-gold/10 transition-colors"
              >
                {c.resubscribe}
              </Link>
              <Link
                href="/"
                className="group inline-flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {c.backHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="relative min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/bg.png"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80" />
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-6 left-6 w-16 h-16 border-l border-t border-white/[0.06] hidden lg:block" />
      <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-white/[0.06] hidden lg:block" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-white/[0.06] hidden lg:block" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-white/[0.06] hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-20 px-5">
        <div
          className={`w-full max-w-md transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-px bg-gradient-to-r from-transparent to-white/20" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                {c.eyebrow}
              </span>
              <div className="w-10 h-px bg-gradient-to-l from-transparent to-white/20" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl mb-3">
              {c.title}
            </h1>
            <p className="font-display text-lg text-white/50 italic mb-4">
              {c.subtitle}
            </p>
            <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
              {c.description}
            </p>
          </div>

          {/* Form */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] via-transparent to-white/[0.08] pointer-events-none" />

            <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] p-6 md:p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 border border-white/20 rotate-45" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">
                    {c.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={c.emailPlaceholder}
                    className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
                    required
                    disabled={status === 'loading'}
                  />
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <p className="text-red-400/80 text-xs text-center">{message}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Link
                    href="/"
                    className="flex-1 py-3 text-center border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-colors"
                  >
                    {c.cancel}
                  </Link>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="flex-1 py-3 bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    {status === 'loading' ? c.processing : c.button}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              {c.backHome}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
