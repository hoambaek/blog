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
    // Dark variant - subtle and refined
    return (
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.newsletter.placeholder}
              className="w-full bg-transparent border border-rose-gold/30 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-white/60 placeholder:text-rose-gold/40 focus:outline-none focus:border-rose-gold/50 transition-colors"
              required
              disabled={status === 'loading'}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group bg-rose-gold/10 border border-rose-gold/40 px-4 py-2.5 sm:px-5 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.15em] text-rose-gold/70 hover:bg-rose-gold/20 hover:text-rose-gold hover:border-rose-gold/60 transition-all disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-1.5">
              {status === 'loading' ? t.newsletter.processing : t.newsletter.subscribe}
              {status !== 'loading' && (
                <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              )}
            </span>
          </button>
        </div>
        {status === 'error' && (
          <p className="text-red-400/70 text-[10px] sm:text-xs mt-3 text-center">{message}</p>
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
