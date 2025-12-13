'use client'

import { useState } from 'react'
import { subscribe } from '@/lib/actions/subscribers'
import { useTranslation } from '@/lib/i18n'

interface NewsletterFormProps {
  source?: string
}

export function NewsletterForm({ source = 'website' }: NewsletterFormProps) {
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

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-medium">{message}</p>
      </div>
    )
  }

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
        className="bg-foreground text-background px-6 py-3 uppercase text-sm tracking-wider font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? t.newsletter.processing : t.newsletter.subscribe}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2 sm:col-span-2">{message}</p>
      )}
    </form>
  )
}
