import * as React from 'react'

interface WelcomeEmailProps {
  email: string
  locale?: 'ko' | 'en'
}

export function WelcomeEmail({ email, locale = 'ko' }: WelcomeEmailProps) {
  const content = {
    ko: {
      subject: '뮤즈드마레 뉴스레터에 오신 것을 환영합니다',
      greeting: '환영합니다!',
      intro: '뮤즈드마레의 특별한 이야기를 함께 나눌 수 있게 되어 기쁩니다.',
      description: 'Le Journal de Marée는 해저숙성 샴페인 뮤즈드마레의 이야기를 전하는 디지털 저널입니다. 바다의 신비로운 시간, 미식의 세계, 그리고 문화와 예술의 순간들을 담아 정기적으로 전해드리겠습니다.',
      whatToExpect: '앞으로 받아보실 수 있는 내용:',
      bullet1: '새로운 포스트 알림',
      bullet2: '독점 비하인드 스토리',
      bullet3: '이벤트 및 프로모션 소식',
      bullet4: '특별한 페어링 레시피',
      closing: '바다가 빚어낸 시간의 예술을 함께 나누길 기대합니다.',
      signature: 'Le Journal de Marée 팀 드림',
      unsubscribe: '더 이상 이메일을 받고 싶지 않으시면',
      unsubscribeLink: '여기를 클릭하세요',
    },
    en: {
      subject: 'Welcome to Muse de Marée Newsletter',
      greeting: 'Welcome!',
      intro: 'We are delighted to share the special stories of Muse de Marée with you.',
      description: 'Le Journal de Marée is the digital journal sharing the story of Muse de Marée, the sea-aged champagne. We will regularly bring you the mysterious depths of the sea, the world of gastronomy, and moments of culture and art.',
      whatToExpect: 'What you can expect:',
      bullet1: 'New post notifications',
      bullet2: 'Exclusive behind-the-scenes stories',
      bullet3: 'Event and promotion news',
      bullet4: 'Special pairing recipes',
      closing: 'We look forward to sharing the art of time, crafted by the sea.',
      signature: 'The Le Journal de Marée Team',
      unsubscribe: 'If you no longer wish to receive emails,',
      unsubscribeLink: 'click here',
    },
  }

  const t = locale === 'ko' ? content.ko : content.en

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backgroundColor: '#f5f5f0',
        margin: 0,
        padding: '40px 20px',
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '40px 30px',
            textAlign: 'center' as const,
          }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 300,
              letterSpacing: '4px',
              margin: 0,
              textTransform: 'uppercase' as const,
            }}>
              Le Journal de Marée
            </h1>
            <div style={{
              width: '40px',
              height: '1px',
              backgroundColor: '#c9a962',
              margin: '20px auto',
            }} />
            <p style={{
              color: '#c9a962',
              fontSize: '12px',
              letterSpacing: '2px',
              margin: 0,
              textTransform: 'uppercase' as const,
            }}>
              Newsletter
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: '40px 30px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 300,
              color: '#1a1a1a',
              marginTop: 0,
              marginBottom: '20px',
            }}>
              {t.greeting}
            </h2>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.8,
              color: '#666666',
              marginBottom: '20px',
            }}>
              {t.intro}
            </p>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.8,
              color: '#666666',
              marginBottom: '30px',
            }}>
              {t.description}
            </p>

            <h3 style={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#1a1a1a',
              marginBottom: '15px',
            }}>
              {t.whatToExpect}
            </h3>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 30px 0',
            }}>
              {[t.bullet1, t.bullet2, t.bullet3, t.bullet4].map((item, index) => (
                <li key={index} style={{
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: '#666666',
                  paddingLeft: '20px',
                  position: 'relative' as const,
                  marginBottom: '8px',
                }}>
                  <span style={{
                    position: 'absolute' as const,
                    left: 0,
                    color: '#c9a962',
                  }}>◆</span>
                  {item}
                </li>
              ))}
            </ul>

            <div style={{
              borderTop: '1px solid #e5e5e5',
              paddingTop: '30px',
              marginTop: '30px',
            }}>
              <p style={{
                fontSize: '16px',
                lineHeight: 1.8,
                color: '#666666',
                marginBottom: '20px',
              }}>
                {t.closing}
              </p>

              <p style={{
                fontSize: '14px',
                color: '#1a1a1a',
                fontStyle: 'italic',
              }}>
                {t.signature}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            backgroundColor: '#f5f5f0',
            padding: '20px 30px',
            textAlign: 'center' as const,
            borderTop: '1px solid #e5e5e5',
          }}>
            <p style={{
              fontSize: '12px',
              color: '#999999',
              margin: 0,
            }}>
              {t.unsubscribe}{' '}
              <a href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`} style={{ color: '#666666' }}>
                {t.unsubscribeLink}
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

export function getWelcomeEmailSubject(locale: 'ko' | 'en' = 'ko') {
  return locale === 'ko'
    ? '뮤즈드마레 뉴스레터에 오신 것을 환영합니다'
    : 'Welcome to Muse de Marée Newsletter'
}
