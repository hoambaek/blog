import { Resend } from 'resend'

// Create Resend client only if API key is available
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Default sender email - update this to your verified domain
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Le Journal <info@musedemaree.com>'

// Check if Resend is configured
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
