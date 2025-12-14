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
      greeting: '환영합니다!',
      intro: '뮤즈드마레의 특별한 이야기를 함께 나눌 수 있게 되어 기쁩니다.',
      description: 'Le Journal de Marée는 해저숙성 샴페인 뮤즈드마레의 이야기를 전하는 디지털 저널입니다. 바다의 신비로운 시간, 미식의 세계, 그리고 문화와 예술의 순간들을 담아 정기적으로 전해드리겠습니다.',
      whatToExpect: '앞으로 받아보실 수 있는 내용:',
      bullet1: '◆ 새로운 포스트 알림',
      bullet2: '◆ 독점 비하인드 스토리',
      bullet3: '◆ 이벤트 및 프로모션 소식',
      bullet4: '◆ 특별한 페어링 레시피',
      closing: '바다가 빚어낸 시간의 예술을 함께 나누길 기대합니다.',
      signature: 'Le Journal de Marée 팀 드림',
      unsubscribe: '더 이상 이메일을 받고 싶지 않으시면',
      unsubscribeLink: '여기를 클릭하세요',
    },
    en: {
      greeting: 'Welcome!',
      intro: 'We are delighted to share the special stories of Muse de Marée with you.',
      description: 'Le Journal de Marée is the digital journal sharing the story of Muse de Marée, the sea-aged champagne. We will regularly bring you the mysterious depths of the sea, the world of gastronomy, and moments of culture and art.',
      whatToExpect: 'What you can expect:',
      bullet1: '◆ New post notifications',
      bullet2: '◆ Exclusive behind-the-scenes stories',
      bullet3: '◆ Event and promotion news',
      bullet4: '◆ Special pairing recipes',
      closing: 'We look forward to sharing the art of time, crafted by the sea.',
      signature: 'The Le Journal de Marée Team',
      unsubscribe: 'If you no longer wish to receive emails,',
      unsubscribeLink: 'click here',
    },
  }

  const t = locale === 'ko' ? content.ko : content.en
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://blog.musedemaree.com'}/unsubscribe?email=${encodeURIComponent(email)}`

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>Le Journal de Marée</Text>
            <Hr style={dividerStyle} />
            <Text style={taglineStyle}>Newsletter</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            <Text style={greetingStyle}>{t.greeting}</Text>
            <Text style={paragraphStyle}>{t.intro}</Text>
            <Text style={paragraphStyle}>{t.description}</Text>

            <Text style={subheadingStyle}>{t.whatToExpect}</Text>
            <Text style={bulletStyle}>{t.bullet1}</Text>
            <Text style={bulletStyle}>{t.bullet2}</Text>
            <Text style={bulletStyle}>{t.bullet3}</Text>
            <Text style={bulletStyle}>{t.bullet4}</Text>

            <Hr style={contentDividerStyle} />

            <Text style={paragraphStyle}>{t.closing}</Text>
            <Text style={signatureStyle}>{t.signature}</Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              {t.unsubscribe}{' '}
              <Link href={unsubscribeUrl} style={linkStyle}>
                {t.unsubscribeLink}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function getWelcomeEmailSubject(locale: 'ko' | 'en' = 'ko') {
  return locale === 'ko'
    ? '뮤즈드마레 뉴스레터에 오신 것을 환영합니다'
    : 'Welcome to Muse de Marée Newsletter'
}

// Styles
const bodyStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  backgroundColor: '#f5f5f0',
  margin: '0',
  padding: '40px 20px',
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e5e5',
}

const headerStyle = {
  backgroundColor: '#1a1a1a',
  padding: '40px 30px',
  textAlign: 'center' as const,
}

const logoStyle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '300',
  letterSpacing: '4px',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const dividerStyle = {
  width: '40px',
  height: '1px',
  backgroundColor: '#c9a962',
  border: 'none',
  margin: '20px auto',
}

const taglineStyle = {
  color: '#c9a962',
  fontSize: '12px',
  letterSpacing: '2px',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const contentStyle = {
  padding: '40px 30px',
}

const greetingStyle = {
  fontSize: '28px',
  fontWeight: '300',
  color: '#1a1a1a',
  marginTop: '0',
  marginBottom: '20px',
}

const paragraphStyle = {
  fontSize: '16px',
  lineHeight: '1.8',
  color: '#666666',
  marginBottom: '20px',
}

const subheadingStyle = {
  fontSize: '18px',
  fontWeight: '500',
  color: '#1a1a1a',
  marginBottom: '15px',
}

const bulletStyle = {
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#666666',
  marginBottom: '8px',
  paddingLeft: '0',
}

const contentDividerStyle = {
  borderTop: '1px solid #e5e5e5',
  margin: '30px 0',
}

const signatureStyle = {
  fontSize: '14px',
  color: '#1a1a1a',
  fontStyle: 'italic',
}

const footerStyle = {
  backgroundColor: '#f5f5f0',
  padding: '20px 30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e5e5',
}

const footerTextStyle = {
  fontSize: '12px',
  color: '#999999',
  margin: '0',
}

const linkStyle = {
  color: '#666666',
}
