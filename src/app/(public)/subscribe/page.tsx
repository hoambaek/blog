'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ArrowLeft, Sparkles } from 'lucide-react'
import { subscribe } from '@/lib/actions/subscribers'
import { useTranslation, useLocale } from '@/lib/i18n'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslation()
  const { locale } = useLocale()

  useEffect(() => {
    setIsVisible(true)
  }, [])

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

  const content = {
    ko: {
      eyebrow: 'Exclusive Newsletter',
      title: '바다의 초대장',
      subtitle: '심연에서 전해지는 이야기',
      description: '뮤즈드마레의 새로운 컬렉션, 해저숙성의 비밀, 그리고 특별한 순간들을 가장 먼저 만나보세요.',
      feature1: '새로운 빈티지 출시 소식',
      feature2: '해저숙성 다이어리',
      feature3: '프라이빗 이벤트 초대',
      namePlaceholder: '이름',
      emailPlaceholder: '이메일',
      button: '초대받기',
      processing: '처리 중...',
      privacy: '개인정보는 안전하게 보호됩니다',
      successTitle: '환영합니다',
      successSubtitle: '바다의 이야기가 곧 찾아갑니다',
      successDesc: '첫 번째 뉴스레터를 기대해 주세요.',
      backHome: '저널로 돌아가기',
    },
    en: {
      eyebrow: 'Exclusive Newsletter',
      title: 'An Invitation from the Sea',
      subtitle: 'Stories from the depths',
      description: 'Be the first to discover new collections, secrets of sea-aging, and exclusive moments from Muse de Marée.',
      feature1: 'New vintage releases',
      feature2: 'Sea-aging diaries',
      feature3: 'Private event invitations',
      namePlaceholder: 'Name',
      emailPlaceholder: 'Email',
      button: 'Accept Invitation',
      processing: 'Processing...',
      privacy: 'Your information is protected',
      successTitle: 'Welcome',
      successSubtitle: 'Stories from the sea await',
      successDesc: 'Expect your first newsletter soon.',
      backHome: 'Return to Journal',
    },
  }

  const c = locale === 'ko' ? content.ko : content.en

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0">
          <Image
            src="/bg.png"
            alt=""
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/60 via-transparent to-[#050505]/60" />
        </div>

        {/* Animated particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-rose-gold/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Success Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-lg animate-fade-in-up">
            {/* Success Icon */}
            <div className="relative w-24 h-24 mx-auto mb-10">
              <div className="absolute inset-0 border border-rose-gold/30 rotate-45" />
              <div className="absolute inset-2 border border-rose-gold/50 rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-10 h-10 text-rose-gold" strokeWidth={1.5} />
              </div>
            </div>

            {/* Success Text */}
            <p className="text-[10px] uppercase tracking-[0.5em] text-rose-gold/80 mb-6">
              Subscription Confirmed
            </p>
            <h1 className="font-display text-4xl md:text-5xl mb-4">
              {c.successTitle}
            </h1>
            <p className="font-display text-xl text-white/60 italic mb-6">
              {c.successSubtitle}
            </p>
            <p className="text-sm text-white/40 mb-12 max-w-sm mx-auto leading-relaxed">
              {c.successDesc}
            </p>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-rose-gold/40" />
              <Sparkles className="w-4 h-4 text-rose-gold/60" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-rose-gold/40" />
            </div>

            {/* Back Button */}
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
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Layered Background */}
      <div className="fixed inset-0">
        {/* Base Image */}
        <Image
          src="/bg.png"
          alt=""
          fill
          className="object-cover opacity-50 scale-110"
          priority
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80" />

        {/* Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-gold/[0.03] rounded-full blur-[150px]" />

        {/* Subtle Grain */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative Corner Elements */}
      <div className="fixed top-8 left-8 w-24 h-24 border-l border-t border-white/[0.06] hidden lg:block" />
      <div className="fixed top-8 right-8 w-24 h-24 border-r border-t border-white/[0.06] hidden lg:block" />
      <div className="fixed bottom-8 left-8 w-24 h-24 border-l border-b border-white/[0.06] hidden lg:block" />
      <div className="fixed bottom-8 right-8 w-24 h-24 border-r border-b border-white/[0.06] hidden lg:block" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row pt-24 lg:pt-32">

        {/* Left: Visual & Brand Story */}
        <div className="flex-1 flex items-start justify-center p-8 lg:p-16 lg:pt-20">
          <div
            className={`max-w-xl transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-rose-gold to-transparent" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-rose-gold/80">
                {c.eyebrow}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-4 leading-[1.1]">
              {c.title}
            </h1>

            {/* Subtitle */}
            <p className="font-display text-xl md:text-2xl text-white/50 italic mb-8">
              {c.subtitle}
            </p>

            {/* Description */}
            <p className="text-base text-white/40 leading-relaxed mb-12 max-w-md">
              {c.description}
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {[c.feature1, c.feature2, c.feature3].map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${600 + index * 150}ms` }}
                >
                  <div className="w-8 h-px bg-white/20" />
                  <span className="text-sm text-white/60">{feature}</span>
                </div>
              ))}
            </div>

            {/* Brand Quote - Desktop Only */}
            <div className="hidden lg:block mt-16 pt-8 border-t border-white/[0.06]">
              <blockquote className="relative">
                <span className="absolute -top-4 -left-2 text-4xl text-rose-gold/20 font-display">"</span>
                <p className="font-display text-lg italic text-white/40 pl-6">
                  심연의 시간이 조각한<br />바다의 수공예품
                </p>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Right: Form Section */}
        <div className="flex-1 flex items-start justify-center p-8 lg:p-16 lg:pt-20">
          <div
            className={`w-full max-w-md transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Form Container */}
            <div className="relative">
              {/* Decorative Border */}
              <div className="absolute -inset-px bg-gradient-to-b from-white/[0.08] via-transparent to-white/[0.08] pointer-events-none" />

              {/* Form Card */}
              <div className="relative bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] p-8 md:p-10">
                {/* Form Header */}
                <div className="text-center mb-10">
                  <div className="w-12 h-12 mx-auto mb-6 relative">
                    <div className="absolute inset-0 border border-rose-gold/40 rotate-45" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-rose-gold/80" />
                    </div>
                  </div>
                  <h2 className="font-display text-2xl mb-2">
                    {locale === 'ko' ? '뉴스레터 구독' : 'Newsletter'}
                  </h2>
                  <p className="text-xs text-white/40">
                    {locale === 'ko' ? '특별한 이야기를 가장 먼저' : 'Be the first to know'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">
                      {c.namePlaceholder}
                      <span className="text-white/20 ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={c.namePlaceholder}
                      className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-rose-gold/30 focus:bg-white/[0.05] transition-all"
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">
                      {c.emailPlaceholder}
                      <span className="text-rose-gold/60 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.emailPlaceholder}
                      className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-rose-gold/30 focus:bg-white/[0.05] transition-all"
                      required
                      disabled={status === 'loading'}
                    />
                  </div>

                  {/* Error Message */}
                  {status === 'error' && (
                    <p className="text-red-400/80 text-sm text-center">{message}</p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="group relative w-full overflow-hidden mt-4"
                  >
                    <div className="relative bg-rose-gold/90 py-4 text-center transition-all duration-300 group-hover:bg-rose-gold">
                      <span className="relative z-10 text-sm font-medium tracking-[0.2em] uppercase text-black">
                        {status === 'loading' ? c.processing : c.button}
                      </span>
                    </div>
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>

                  {/* Privacy Notice */}
                  <p className="text-[10px] text-white/30 text-center tracking-wide">
                    {c.privacy}
                  </p>
                </form>

                {/* Decorative Bottom */}
                <div className="flex items-center justify-center gap-3 mt-10 pt-8 border-t border-white/[0.04]">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent to-white/20" />
                  <span className="text-rose-gold/40 text-[8px]">◆</span>
                  <div className="w-8 h-px bg-gradient-to-l from-transparent to-white/20" />
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div className="text-center mt-8">
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
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
