'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { subscribe } from '@/lib/actions/subscribers'
import { useTranslation, useLocale } from '@/lib/i18n'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const t = useTranslation()
  const { locale } = useLocale()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    setStatus('loading')

    try {
      const result = await subscribe(email, name || undefined, 'subscribe-page', locale as 'ko' | 'en')

      if (result.success) {
        setStatus('success')
        setMessage(result.message || t.newsletter.success)
      } else {
        setStatus('error')
        setMessage(result.error || t.newsletter.error)
      }
    } catch {
      setStatus('error')
      setMessage(t.newsletter.errorRetry)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/bg.png"
          alt="Muse de Marée"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />

        {/* Decorative Quote */}
        <div className="absolute bottom-16 left-16 right-16 text-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-px bg-rose-gold" />
            <span className="text-rose-gold text-xs">◆</span>
          </div>
          <blockquote className="font-display text-2xl xl:text-3xl italic leading-relaxed text-white/90">
            "심연의 시간이 조각한<br />바다의 수공예품"
          </blockquote>
          <p className="mt-4 text-sm text-white/60 uppercase tracking-wider">
            Muse de Marée
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </Link>

          {status === 'success' ? (
            /* Success State */
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-display text-3xl mb-4">{t.newsletter.success}</h1>
              <p className="text-muted-foreground mb-8">
                {t.newsletter.moreStoriesDescription}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                홈으로 돌아가기
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Header */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-rose-gold text-xs">◆</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Newsletter</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl mb-4">
                  {t.newsletter.title}
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {t.newsletter.description}
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-10 space-y-4">
                {[
                  { ko: '새로운 포스트 알림', en: 'New post notifications' },
                  { ko: '독점 콘텐츠 & 비하인드 스토리', en: 'Exclusive content & behind the scenes' },
                  { ko: '특별 이벤트 초대', en: 'Special event invitations' },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-rose-gold flex items-center justify-center">
                      <Check className="w-3 h-3 text-rose-gold" />
                    </div>
                    <span className="text-sm">{t.nav.journal === '저널' ? benefit.ko : benefit.en}</span>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {t.nav.journal === '저널' ? '이름 (선택)' : 'Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.nav.journal === '저널' ? '홍길동' : 'John Doe'}
                    className="w-full bg-transparent border border-border px-4 py-3 text-base focus:outline-none focus:border-foreground transition-colors"
                    disabled={status === 'loading'}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {t.nav.journal === '저널' ? '이메일 주소' : 'Email Address'} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.newsletter.placeholder}
                    className="w-full bg-transparent border border-border px-4 py-3 text-base focus:outline-none focus:border-foreground transition-colors"
                    required
                    disabled={status === 'loading'}
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-500 text-sm">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-foreground text-background py-4 uppercase text-sm tracking-wider font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 mt-6"
                >
                  {status === 'loading' ? t.newsletter.processing : t.newsletter.subscribe}
                </button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  {t.footer.privacyConsent}
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
