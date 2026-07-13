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

/** 발송 메일의 이미지(로고)용 절대 URL */
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blog.musedemaree.com'

/**
 * 구독 환영 메일 — Email v2 (Paper 시안: 그레이지 프레임 + 카드 + 다크 법적 푸터).
 * landing의 ApplicantEmail과 같은 디자인 언어를 공유한다.
 */
export function WelcomeEmail({ email, locale = 'ko' }: WelcomeEmailProps) {
  const content = {
    ko: {
      eyebrow: 'LE JOURNAL',
      title: '환영합니다',
      intro: '뮤즈드마레의 기록을 함께할 수 있게 되어 기쁩니다.',
      description:
        'Muse de Marée의 저널에서 수심 30m에서 기록되는 바다의 시간을 전해드립니다. 관측 일지와 인양 소식, 미식, 문화와 예술의 순간들을 담아 보내드립니다.',
      whatToExpect: '받아보실 수 있는 소식',
      bullets: [
        '새로운 포스트 알림',
        '바다의 관측 일지',
        '인양 소식',
        '페어링 레시피',
      ],
      closing: '바다가 쓴 시간을 함께 나누길 기대합니다.',
      unsubscribe: '더 이상 메일을 받고 싶지 않으시면 수신거부',
    },
    en: {
      eyebrow: 'LE JOURNAL',
      title: 'Welcome',
      intro: 'We are delighted to share the records of Muse de Marée with you.',
      description:
        'The journal of Muse de Marée brings you the time of the sea, recorded at 30m below — observation logs, retrieval news, gastronomy, culture and art.',
      whatToExpect: 'What to expect',
      bullets: [
        'New post notifications',
        "The sea's observation log",
        'Retrieval news',
        'Pairing recipes',
      ],
      closing: 'We look forward to sharing the time written by the sea.',
      unsubscribe: 'Unsubscribe',
    },
  }

  const t = locale === 'ko' ? content.ko : content.en
  const unsubscribeUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}`

  return (
    <Html lang={locale}>
      <Head>
        {/* 모바일: 인라인 스타일보다 우선하도록 !important 필수 (지원 안 하는 클라이언트는 상향된 기본값으로 동작) */}
        <style>{`
          @media only screen and (max-width: 480px) {
            .email-header { padding: 40px 0 34px !important; }
            .email-content { padding: 40px 24px 44px !important; }
            .email-title { font-size: 28px !important; line-height: 36px !important; }
            .email-footer { padding: 36px 24px 40px !important; }
          }
        `}</style>
      </Head>
      <Body style={styles.body}>
        <Container style={styles.card}>
          {/* ── 헤더 (로고 + 워드마크) ── */}
          <Section className="email-header" style={styles.header}>
            <Img
              src={`${BASE_URL}/images/logo/logo_trans_W.png`}
              width="132"
              height="110"
              alt=""
              style={styles.symbol}
            />
            <Img
              src={`${BASE_URL}/images/logo/logo_text_trans_W.png`}
              width="95"
              height="14"
              alt="MUSE DE MARÉE"
              style={styles.wordmark}
            />
          </Section>

          {/* ── 본문 ── */}
          <Section className="email-content" style={styles.content}>
            <Text style={styles.eyebrow}>{t.eyebrow}</Text>
            <Text className="email-title" style={styles.title}>
              {t.title}
            </Text>
            <Text style={styles.hello}>{t.intro}</Text>
            <Text style={styles.para}>{t.description}</Text>

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

            <Text style={styles.para}>{t.closing}</Text>

            <Hr style={styles.rule} />
            <Img
              src={`${BASE_URL}/images/logo/logo_text_trans.png`}
              width="150"
              height="23"
              alt="Muse de Marée"
              style={styles.sign}
            />
          </Section>

          {/* ── 법적 푸터 (다크) ── */}
          <Section className="email-footer" style={styles.footer}>
            <Img
              src={`${BASE_URL}/images/logo/logo_text_trans_W.png`}
              width="112"
              height="16"
              alt="MUSE DE MARÉE"
              style={styles.fName}
            />
            <Text style={styles.fInfo}>
              주식회사 오크니 · 대표 정설화 · 사업자등록번호 859-85-03139
            </Text>
            <Text style={styles.fInfo}>서울특별시 강남구 압구정로 306, B1 #6-J14</Text>
            <Text style={styles.fInfo}>고객 문의 info@musedemaree.com</Text>
            <Hr style={styles.fRule} />
            <Link href={unsubscribeUrl} style={styles.fUnsub}>
              {t.unsubscribe}
            </Link>
            <Text style={styles.fCopy}>
              © 2026 MUSE DE MARÉE. ALL RIGHTS RESERVED.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function getWelcomeEmailSubject(locale: 'ko' | 'en' = 'ko') {
  return locale === 'ko'
    ? 'Muse de Marée에 오신 것을 환영합니다'
    : 'Welcome to Muse de Marée'
}

/* ── 스타일 (Email v2 토큰, landing ApplicantEmail과 공유) ── */
const serif = '"Cormorant Garamond", Georgia, "Times New Roman", serif'
const sans = '"Noto Sans KR", -apple-system, "Apple SD Gothic Neo", sans-serif'
const mono = '"IBM Plex Mono", "Courier New", monospace'

const styles = {
  body: {
    margin: '0',
    padding: '40px 0',
    backgroundColor: '#DDD8D2',
    fontFamily: sans,
  },
  card: {
    // 고정 width 금지: max-width 미지원 클라이언트가 600px 폭을 유지한 채
    // 전체를 축소 렌더링해 글자가 작아지는 원인이 됨 (fluid 방식)
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#C4BFBB',
  },
  header: {
    padding: '52px 0 44px',
    textAlign: 'center' as const,
    borderBottom: '1px solid rgba(49,46,42,0.12)',
  },
  symbol: {
    display: 'block',
    margin: '0 auto',
    opacity: 0.95,
  },
  wordmark: {
    display: 'block',
    margin: '18px auto 0',
    opacity: 0.92,
  },
  content: {
    padding: '48px 56px 52px',
  },
  eyebrow: {
    margin: '0 0 18px',
    fontFamily: mono,
    fontSize: '12px',
    letterSpacing: '0.22em',
    color: '#8C6B33',
  },
  title: {
    margin: '0 0 26px',
    fontFamily: serif,
    fontSize: '34px',
    fontWeight: 300,
    lineHeight: '40px',
    letterSpacing: '-0.01em',
    color: '#312E2A',
    wordBreak: 'keep-all' as const,
  },
  hello: {
    margin: '0 0 18px',
    fontFamily: sans,
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '26px',
    color: '#312E2A',
    wordBreak: 'keep-all' as const,
  },
  para: {
    margin: '0 0 14px',
    fontFamily: sans,
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '28px',
    color: '#4A453F',
    wordBreak: 'keep-all' as const,
  },
  sectionTitle: {
    margin: '10px 0 12px',
    fontFamily: sans,
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '0.12em',
    color: '#8C6B33',
  },
  bulletTable: {
    margin: '0 0 18px',
  },
  bulletDot: {
    width: '20px',
    fontFamily: sans,
    fontSize: '16px',
    lineHeight: '28px',
    color: '#8C6B33',
    verticalAlign: 'top' as const,
  },
  bulletText: {
    fontFamily: sans,
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '28px',
    color: '#4A453F',
    paddingBottom: '6px',
  },
  rule: {
    width: '36px',
    margin: '30px 0 22px',
    border: 'none',
    borderTop: '1px solid #8C6B33',
  },
  sign: {
    display: 'block',
    margin: '0',
  },
  footer: {
    padding: '40px 48px 44px',
    backgroundColor: '#14110F',
    textAlign: 'center' as const,
  },
  fName: {
    display: 'block',
    margin: '0 auto 12px',
    opacity: 0.92,
  },
  fInfo: {
    margin: '0 0 5px',
    fontFamily: sans,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '19px',
    color: 'rgba(242,239,233,0.55)',
  },
  fRule: {
    width: '300px',
    margin: '18px auto',
    border: 'none',
    borderTop: '1px solid rgba(242,239,233,0.12)',
  },
  fUnsub: {
    display: 'block',
    margin: '0 0 10px',
    fontFamily: sans,
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '19px',
    color: 'rgba(242,239,233,0.55)',
    textDecoration: 'underline',
  },
  fCopy: {
    margin: '0',
    fontFamily: mono,
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: 'rgba(242,239,233,0.4)',
  },
}
