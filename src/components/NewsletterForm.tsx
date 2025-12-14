'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { subscribe } from '@/lib/actions/subscribers'
import { useTranslation } from '@/lib/i18n'

interface NewsletterFormProps {
  source?: string
  variant?: 'light' | 'dark'
}

export function NewsletterForm({ source = 'website', variant = 'light' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const t = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    setStatus('loading')

    try {
      const result = await subscribe(email, undefined, source)

      if (result.success) {
        setStatus('success')
        setMessage(result.message || t.newsletter.success)
        setEmail('')
      } else {
        setStatus('error')
        setMessage(result.error || t.newsletter.error)
      }
    } catch {
      setStatus('error')
      setMessage(t.newsletter.errorRetry)
    }
  }

  const isDark = variant === 'dark'

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className={`w-12 h-12 mb-4 border flex items-center justify-center ${
          isDark ? 'border-rose-gold' : 'border-rose-gold'
        }`}>
          <Check className={`w-6 h-6 ${isDark ? 'text-rose-gold' : 'text-rose-gold'}`} />
        </div>
        <p className={`font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
          {message}
        </p>
      </div>
    )
  }

  if (isDark) {
    // Dark variant for footer/dark sections
    return (
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.newsletter.placeholder}
              className="w-full bg-white/[0.05] border border-white/[0.1] px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all"
              required
              disabled={status === 'loading'}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group relative overflow-hidden bg-rose-gold/90 px-6 py-3 sm:px-8 sm:py-4 uppercase text-xs sm:text-sm tracking-[0.15em] font-medium text-black hover:bg-rose-gold transition-colors disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {status === 'loading' ? t.newsletter.processing : t.newsletter.subscribe}
              {status !== 'loading' && (
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </span>
          </button>
        </div>
        {status === 'error' && (
          <p className="text-red-400 text-xs sm:text-sm mt-3 sm:mt-4 text-center">{message}</p>
        )}
      </form>
    )
  }

  // Light variant (default)
  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.newsletter.placeholder}
        className="flex-1 bg-background border border-border px-4 py-3 text-base focus:outline-none focus:border-foreground transition-colors"
        required
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="group flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 uppercase text-sm tracking-wider font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? t.newsletter.processing : t.newsletter.subscribe}
        {status !== 'loading' && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        )}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2 sm:col-span-2">{message}</p>
      )}
    </form>
  )
}
