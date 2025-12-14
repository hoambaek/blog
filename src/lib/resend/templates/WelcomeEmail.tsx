import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Img,
} from '@react-email/components'

interface WelcomeEmailProps {
  email: string
  locale?: 'ko' | 'en'
}

export function WelcomeEmail({ email, locale = 'ko' }: WelcomeEmailProps) {
  const content = {
    ko: {
      greeting: '환영합니다',
      intro: '뮤즈드마레의 특별한 이야기를 함께 나눌 수 있게 되어 기쁩니다.',
      description: 'Le Journal de Marée는 해저숙성 샴페인 뮤즈드마레의 이야기를 전하는 디지털 저널입니다. 바다의 신비로운 시간, 미식의 세계, 그리고 문화와 예술의 순간들을 담아 정기적으로 전해드리겠습니다.',
      whatToExpect: '앞으로 받아보실 수 있는 내용',
      bullet1: '새로운 포스트 알림',
      bullet2: '독점 비하인드 스토리',
      bullet3: '이벤트 및 프로모션 소식',
      bullet4: '특별한 페어링 레시피',
      closing: '바다가 빚어낸 시간의 예술을 함께 나누길 기대합니다.',
      signature: 'Le Journal de Marée',
      unsubscribe: '더 이상 이메일을 받고 싶지 않으시면',
      unsubscribeLink: '여기를 클릭하세요',
    },
    en: {
      greeting: 'Welcome',
      intro: 'We are delighted to share the special stories of Muse de Marée with you.',
      description: 'Le Journal de Marée is the digital journal sharing the story of Muse de Marée, the sea-aged champagne. We will regularly bring you the mysterious depths of the sea, the world of gastronomy, and moments of culture and art.',
      whatToExpect: 'What you can expect',
      bullet1: 'New post notifications',
      bullet2: 'Exclusive behind-the-scenes stories',
      bullet3: 'Event and promotion news',
      bullet4: 'Special pairing recipes',
      closing: 'We look forward to sharing the art of time, crafted by the sea.',
      signature: 'Le Journal de Marée',
      unsubscribe: 'If you no longer wish to receive emails,',
      unsubscribeLink: 'click here',
    },
  }

  const t = locale === 'ko' ? content.ko : content.en
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://blog.musedemaree.com'}/unsubscribe?email=${encodeURIComponent(email)}`

  return (
    <Html>
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            {/* Decorative top line */}
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
              <tr>
                <td style={{ width: '30%', height: '1px', backgroundColor: 'rgba(201, 169, 98, 0.3)' }}></td>
                <td style={{ width: '40%', textAlign: 'center' as const }}>
                  <Img
                    src="https://blog.musedemaree.com/images/logo-gold.png"
                    alt="◆"
                    width="12"
                    height="12"
                    style={{ display: 'inline-block' }}
                  />
                </td>
                <td style={{ width: '30%', height: '1px', backgroundColor: 'rgba(201, 169, 98, 0.3)' }}></td>
              </tr>
            </table>

            <Text style={logoStyle}>Le Journal</Text>
            <Text style={logoSubStyle}>de Marée</Text>

            <Hr style={dividerStyle} />
            <Text style={taglineStyle}>Newsletter</Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>
            {/* Greeting with decorative elements */}
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
              <tr>
                <td style={{ textAlign: 'center' as const }}>
                  <Text style={greetingStyle}>{t.greeting}</Text>
                  <div style={greetingUnderlineStyle}></div>
                </td>
              </tr>
            </table>

            <Text style={introStyle}>{t.intro}</Text>
            <Text style={paragraphStyle}>{t.description}</Text>

            {/* What to expect section */}
            <Section style={expectSectionStyle}>
              <Text style={subheadingStyle}>{t.whatToExpect}</Text>
              <Hr style={subheadingDividerStyle} />

              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td style={bulletCellStyle}>
                    <Text style={bulletIconStyle}>◆</Text>
                  </td>
                  <td style={bulletTextCellStyle}>
                    <Text style={bulletStyle}>{t.bullet1}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={bulletCellStyle}>
                    <Text style={bulletIconStyle}>◆</Text>
                  </td>
                  <td style={bulletTextCellStyle}>
                    <Text style={bulletStyle}>{t.bullet2}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={bulletCellStyle}>
                    <Text style={bulletIconStyle}>◆</Text>
                  </td>
                  <td style={bulletTextCellStyle}>
                    <Text style={bulletStyle}>{t.bullet3}</Text>
                  </td>
                </tr>
                <tr>
                  <td style={bulletCellStyle}>
                    <Text style={bulletIconStyle}>◆</Text>
                  </td>
                  <td style={bulletTextCellStyle}>
                    <Text style={bulletStyle}>{t.bullet4}</Text>
                  </td>
                </tr>
              </table>
            </Section>

            <Hr style={contentDividerStyle} />

            <Text style={closingStyle}>{t.closing}</Text>

            {/* Signature */}
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginTop: '30px' }}>
              <tr>
                <td style={{ textAlign: 'center' as const }}>
                  <Text style={signatureLabelStyle}>—</Text>
                  <Text style={signatureStyle}>{t.signature}</Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Hr style={footerDividerStyle} />
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

// Color palette
const gold = '#c9a962'
const goldLight = 'rgba(201, 169, 98, 0.15)'
const dark = '#1a1a1a'
const darkSoft = '#2d2d2d'
const textPrimary = '#333333'
const textSecondary = '#666666'
const bgLight = '#faf9f7'
const bgWarm = '#f8f6f3'

// Styles
const bodyStyle = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  backgroundColor: bgLight,
  margin: '0',
  padding: '40px 20px',
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '0',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
}

const headerStyle = {
  backgroundColor: dark,
  padding: '50px 40px 40px',
  textAlign: 'center' as const,
}

const logoStyle = {
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '300',
  letterSpacing: '6px',
  margin: '0',
  textTransform: 'uppercase' as const,
  lineHeight: '1.2',
}

const logoSubStyle = {
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  color: gold,
  fontSize: '28px',
  fontWeight: '300',
  letterSpacing: '8px',
  margin: '0',
  textTransform: 'uppercase' as const,
  lineHeight: '1.4',
}

const dividerStyle = {
  width: '60px',
  height: '1px',
  backgroundColor: gold,
  border: 'none',
  margin: '25px auto 20px',
}

const taglineStyle = {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '11px',
  letterSpacing: '3px',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const contentStyle = {
  padding: '50px 45px',
  backgroundColor: '#ffffff',
}

const greetingStyle = {
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: '36px',
  fontWeight: '400',
  color: textPrimary,
  margin: '0',
  letterSpacing: '2px',
}

const greetingUnderlineStyle = {
  width: '40px',
  height: '2px',
  backgroundColor: gold,
  margin: '15px auto 0',
}

const introStyle = {
  fontFamily: 'Georgia, serif',
  fontSize: '18px',
  lineHeight: '1.8',
  color: textPrimary,
  marginBottom: '25px',
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
}

const paragraphStyle = {
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.9',
  color: textSecondary,
  marginBottom: '25px',
  textAlign: 'left' as const,
}

const expectSectionStyle = {
  backgroundColor: bgWarm,
  padding: '30px 35px',
  margin: '30px 0',
  borderLeft: `3px solid ${gold}`,
}

const subheadingStyle = {
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: '20px',
  fontWeight: '500',
  color: textPrimary,
  margin: '0 0 5px 0',
  letterSpacing: '1px',
}

const subheadingDividerStyle = {
  width: '30px',
  height: '1px',
  backgroundColor: gold,
  border: 'none',
  margin: '12px 0 20px 0',
}

const bulletCellStyle = {
  width: '25px',
  verticalAlign: 'top' as const,
  paddingTop: '3px',
}

const bulletTextCellStyle = {
  verticalAlign: 'top' as const,
}

const bulletIconStyle = {
  color: gold,
  fontSize: '10px',
  margin: '0',
  lineHeight: '1.8',
}

const bulletStyle = {
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  lineHeight: '1.8',
  color: textSecondary,
  margin: '0 0 8px 0',
}

const contentDividerStyle = {
  borderTop: `1px solid rgba(201, 169, 98, 0.3)`,
  margin: '35px 0',
}

const closingStyle = {
  fontFamily: 'Georgia, serif',
  fontSize: '15px',
  lineHeight: '1.9',
  color: textSecondary,
  textAlign: 'center' as const,
  fontStyle: 'italic' as const,
  margin: '0',
}

const signatureLabelStyle = {
  color: gold,
  fontSize: '20px',
  margin: '0 0 10px 0',
}

const signatureStyle = {
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  fontSize: '18px',
  color: textPrimary,
  letterSpacing: '2px',
  margin: '0',
}

const footerStyle = {
  backgroundColor: bgWarm,
  padding: '25px 40px 30px',
  textAlign: 'center' as const,
}

const footerDividerStyle = {
  width: '100%',
  height: '1px',
  backgroundColor: 'rgba(201, 169, 98, 0.2)',
  border: 'none',
  margin: '0 0 20px 0',
}

const footerTextStyle = {
  fontFamily: 'Georgia, serif',
  fontSize: '12px',
  color: '#999999',
  margin: '0',
}

const linkStyle = {
  color: gold,
  textDecoration: 'underline' as const,
}
