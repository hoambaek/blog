import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components'

interface WelcomeEmailProps {
  email: string
  locale?: 'ko' | 'en'
}

export function WelcomeEmail({ email, locale = 'ko' }: WelcomeEmailProps) {
  const content = {
    ko: {
      greeting: '환영합니다',
      intro: '뮤즈드마레의 이야기를 함께할 수 있게 되어 기쁩니다.',
      description:
        'Le Journal de Marée는 해저숙성 샴페인 뮤즈드마레의 이야기를 전하는 디지털 저널입니다. 바다의 시간, 미식, 문화와 예술의 순간들을 담아 전해드립니다.',
      whatToExpect: '받아보실 수 있는 소식',
      bullets: [
        '새로운 포스트 알림',
        '비하인드 스토리',
        '이벤트 소식',
        '페어링 레시피',
      ],
      closing: '바다가 빚어낸 시간의 예술을 함께 나누길 기대합니다.',
      signature: 'Le Journal de Marée',
      unsubscribe: '수신거부',
    },
    en: {
      greeting: 'Welcome',
      intro: 'We are delighted to share the stories of Muse de Marée with you.',
      description:
        'Le Journal de Marée is the digital journal of Muse de Marée, the sea-aged champagne. We bring you tales of the sea, gastronomy, culture and art.',
      whatToExpect: 'What to expect',
      bullets: [
        'New post notifications',
        'Behind-the-scenes stories',
        'Event updates',
        'Pairing recipes',
      ],
      closing: 'We look forward to sharing the art of time, crafted by the sea.',
      signature: 'Le Journal de Marée',
      unsubscribe: 'Unsubscribe',
    },
  }

  const t = locale === 'ko' ? content.ko : content.en
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://blog.musedemaree.com'}/unsubscribe?email=${encodeURIComponent(email)}`

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>LE JOURNAL DE MARÉE</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <Hr style={styles.greetingLine} />

            <Text style={styles.intro}>{t.intro}</Text>
            <Text style={styles.paragraph}>{t.description}</Text>

            <Text style={styles.sectionTitle}>{t.whatToExpect}</Text>
            <table cellPadding="0" cellSpacing="0" style={styles.bulletTable}>
              <tbody>
                {t.bullets.map((bullet, index) => (
                  <tr key={index}>
                    <td style={styles.bulletDot}>·</td>
                    <td style={styles.bulletText}>{bullet}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Hr style={styles.divider} />

            <Text style={styles.closing}>{t.closing}</Text>
            <Text style={styles.signature}>{t.signature}</Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Link href={unsubscribeUrl} style={styles.unsubscribeLink}>
              {t.unsubscribe}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function getWelcomeEmailSubject(locale: 'ko' | 'en' = 'ko') {
  return locale === 'ko'
    ? 'Le Journal de Marée에 오신 것을 환영합니다'
    : 'Welcome to Le Journal de Marée'
}

// Design tokens matching the blog
const colors = {
  background: '#FAFAF9',
  foreground: '#1C1917',
  muted: '#78716C',
  border: '#E7E5E4',
  roseGold: '#B7916E',
  dark: '#0a0a0a',
}

const styles = {
  body: {
    margin: '0',
    padding: '0',
    backgroundColor: colors.background,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  container: {
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
  },

  // Header - matches blog dark header
  header: {
    backgroundColor: colors.dark,
    padding: '32px 40px',
    textAlign: 'center' as const,
  },

  logo: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '18px',
    fontWeight: '400' as const,
    letterSpacing: '0.15em',
    color: '#ffffff',
    margin: '0',
  },

  // Content
  content: {
    padding: '48px 40px 40px',
  },

  greeting: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '28px',
    fontWeight: '400' as const,
    color: colors.foreground,
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },

  greetingLine: {
    width: '32px',
    height: '2px',
    backgroundColor: colors.roseGold,
    border: 'none',
    margin: '0 0 32px 0',
  },

  intro: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: colors.foreground,
    margin: '0 0 24px 0',
  },

  paragraph: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: colors.muted,
    margin: '0 0 32px 0',
  },

  sectionTitle: {
    fontSize: '12px',
    fontWeight: '500' as const,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: colors.muted,
    margin: '0 0 16px 0',
  },

  bulletTable: {
    margin: '0 0 32px 0',
  },

  bulletDot: {
    width: '20px',
    fontSize: '14px',
    color: colors.roseGold,
    verticalAlign: 'top' as const,
    paddingTop: '2px',
  },

  bulletText: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: colors.muted,
    paddingBottom: '4px',
  },

  divider: {
    height: '1px',
    backgroundColor: colors.border,
    border: 'none',
    margin: '0 0 32px 0',
  },

  closing: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: colors.muted,
    fontStyle: 'italic' as const,
    margin: '0 0 24px 0',
  },

  signature: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: '14px',
    color: colors.foreground,
    margin: '0',
    letterSpacing: '0.05em',
  },

  // Footer
  footer: {
    backgroundColor: colors.background,
    padding: '24px 40px',
    textAlign: 'center' as const,
    borderTop: `1px solid ${colors.border}`,
  },

  unsubscribeLink: {
    fontSize: '11px',
    color: colors.muted,
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
}
