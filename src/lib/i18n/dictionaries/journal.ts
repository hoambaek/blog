/*
 * 저널(공개 화면) 문구 — Paper 'Blog — Le Journal de Marée' 시안의 한국어가 정본이다.
 * 영문은 같은 자리의 번역. 브랜드 번역 규칙: 풀네임 "Muse de Marée", we/our 대명사 쓰지 않음.
 * {n}·{t}·{email}·{q} 자리는 fillText()로 채운다.
 */

export interface JournalDictionary {
  nav: {
    allRecords: string
    about: string
    search: string
    menuOpen: string
    menuClose: string
    menuLabel: string
    home: string
  }
  masthead: {
    tagline: string
    recordCount: string
    recordCountOne: string
  }
  record: {
    read: string
    seaAvg: string
    minutes: string
    minutesUpper: string
    published: string
    seaAvgLabel: string
    reading: string
    photo: string
    next: string
    empty: string
    emptyDescription: string
    older: string
    newer: string
  }
  series: {
    label: string
    others: string
    count: string
    countOne: string
    seriesCount: string
  }
  newsletter: {
    label: string
    title: string
    email: string
    placeholder: string
    submit: string
    subtitle: string
    name: string
    namePlaceholder: string
    consent: string
    privacy: string
    unsubscribeNote: string
    processing: string
    consentRequired: string
    invalidEmail: string
    error: string
    doneTitle: string
    doneBody: string
    doneNote: string
    back: string
    alreadyTitle: string
    alreadyBody: string
    alreadyNote: string
    close: string
  }
  search: {
    label: string
    placeholder: string
    enter: string
    close: string
    clear: string
    count: string
    countOne: string
    emptyTitle: string
    emptyBody: string
    allRecords: string
  }
  menu: {
    brandLine: string
    recLocation: string
    recTemp: string
    recDays: string
  }
  footer: {
    privacy: string
    terms: string
    motto: string
  }
  about: {
    kicker: string
    subtitle: string
    intro: string
    location: string
    locationValue: string
    retrieval: string
    retrievalValue: string
    records: string
    seriesLabel: string
    storyKicker: string
    storyTitle: string
    storyLead: string
    storyBody: string
    beliefKicker: string
    beliefTitle: string
    beliefs: { title: string; desc: string }[]
  }
  unsubscribe: {
    confirmTitle: string
    confirmBody: string
    cancel: string
    submit: string
    processing: string
    doneTitle: string
    doneBody: string
    resubscribe: string
    toJournal: string
    expiredTitle: string
    expiredBody: string
    error: string
  }
}

export const journalKo: JournalDictionary = {
  nav: {
    allRecords: '전체 기록',
    about: '소개',
    search: '검색',
    menuOpen: '메뉴 열기',
    menuClose: '닫기',
    menuLabel: '내비게이션 메뉴',
    home: '저널 첫 화면',
  },
  masthead: {
    tagline: '바다가 쓴 시간을 옮겨 적습니다.',
    recordCount: '기록 {n}편',
    recordCountOne: '기록 {n}편',
  },
  record: {
    read: '기록 읽기',
    seaAvg: '연평균 수온 {t}°C',
    minutes: '{n}분',
    minutesUpper: '{n} MIN',
    published: 'PUBLISHED',
    seaAvgLabel: 'SEA · 1Y AVG',
    reading: 'READING',
    photo: 'PHOTO',
    next: '다음 기록',
    empty: '아직 기록이 없습니다',
    emptyDescription: '곧 새 기록으로 찾아뵙겠습니다.',
    older: '이전 기록',
    newer: '최근 기록',
  },
  series: {
    label: 'SERIES',
    others: '다른 연재',
    count: '{n}편',
    countOne: '{n}편',
    seriesCount: '{n}개 연재',
  },
  newsletter: {
    label: 'NEWSLETTER',
    title: '새 기록을 메일로 받아 보세요',
    email: 'EMAIL',
    placeholder: '이메일 주소',
    submit: '구독하기',
    subtitle: '새 기록이 올라올 때만 보내 드립니다.',
    name: 'NAME · 선택',
    namePlaceholder: '이름',
    consent: '뉴스레터 발송을 위한 이메일 수집·이용에 동의합니다.',
    privacy: '개인정보처리방침',
    unsubscribeNote: '메일 하단의 링크로 언제든 구독을 해지할 수 있습니다.',
    processing: '보내는 중',
    consentRequired: '이메일 수집에 동의해 주셔야 구독할 수 있습니다.',
    invalidEmail: '이메일 주소를 다시 확인해 주세요.',
    error: '구독을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    doneTitle: '구독이 완료되었습니다',
    doneBody: '{email}으로 환영 메일을 보냈습니다.\n새 기록이 올라오면 뉴스레터로 알려 드립니다.',
    doneNote: '메일이 보이지 않으면 스팸함도 확인해 주세요.',
    back: '기록으로 돌아가기',
    alreadyTitle: '이미 구독 중인 이메일입니다',
    alreadyBody: '{email}은 이미 뉴스레터를 받고 있습니다.\n새 기록이 올라오면 이 주소로 보내 드립니다.',
    alreadyNote: '구독 해지는 메일 하단의 링크에서 할 수 있습니다.',
    close: '닫기',
  },
  search: {
    label: 'SEARCH',
    placeholder: '기록 검색',
    enter: 'ENTER',
    close: '검색 닫기',
    clear: '검색어 지우기',
    count: '{n}건의 기록',
    countOne: '{n}건의 기록',
    emptyTitle: "'{q}'에 맞는 기록이 아직 없습니다",
    emptyBody: '다른 단어로 찾아보시거나 전체 기록을 둘러보세요.',
    allRecords: '전체 기록',
  },
  menu: {
    brandLine: '모든 병에 담긴, 바다에서 보낸 시간의 기록.',
    recLocation: '남해 34°N',
    recTemp: '수온 {t}°C',
    recDays: '측정 {n}일째',
  },
  footer: {
    privacy: '개인정보처리방침',
    terms: '이용약관',
    motto: 'Written by the Sea.',
  },
  about: {
    kicker: 'ABOUT THE JOURNAL',
    subtitle: '바다가 쓴 시간',
    intro: '뮤즈드마레의 저널입니다. 병이 바다에서 보낸 날들의 기록을 옮겨 적습니다.',
    location: 'LOCATION',
    locationValue: '한국 남해',
    retrieval: 'RETRIEVAL',
    retrievalValue: '연 1회',
    records: 'RECORDS',
    seriesLabel: 'SERIES',
    storyKicker: 'OUR STORY',
    storyTitle: '우리의 이야기',
    storyLead:
      '뮤즈드마레는 바다의 시간을 기록하는 브랜드입니다. 프랑스 샹파뉴가 빚은 샴페인이 한국 남해에 잠겨 보내는 모든 날을, 입수일부터 인양까지 지켜보고 기록합니다.',
    storyBody:
      '이 저널은 그 기록을 나누는 자리입니다. 입수일과 좌표, 수온과 해류 같은 바다의 데이터부터 샴페인을 만든 메종의 이야기까지 담습니다.',
    beliefKicker: 'WHAT WE BELIEVE',
    beliefTitle: '우리가 믿는 것',
    beliefs: [
      { title: '기록이 헤리티지다', desc: '모든 병에는 입수일부터 인양까지, 그 병이 보낸 모든 날의 기록이 동봉됩니다.' },
      { title: '바다가 결정한다', desc: '수량도, 출시도, 가격도 사람이 아니라 바다가 정합니다. 인양된 만큼만 세상에 나옵니다.' },
      { title: '인양은 의식이다', desc: '입수에서 인양까지, 한 사이클은 달력에 적힌 연례 의식입니다.' },
      { title: '소유는 맡아둠이다', desc: '마시는 것이 아니라, 바다가 만든 시간을 맡아두는 일입니다.' },
    ],
  },
  unsubscribe: {
    confirmTitle: '구독을 해지할까요',
    confirmBody: '{email}으로 보내는 뉴스레터를 멈춥니다.\n저널의 기록은 언제든 여기에서 읽으실 수 있습니다.',
    cancel: '취소',
    submit: '구독 해지',
    processing: '처리 중',
    doneTitle: '구독을 해지했습니다',
    doneBody: '{email}으로 더 이상 뉴스레터를 보내지 않습니다.\n저널의 기록은 언제든 여기에서 읽으실 수 있습니다.',
    resubscribe: '다시 구독하기',
    toJournal: '저널로 가기',
    expiredTitle: '링크가 만료되었습니다',
    expiredBody: '최근 메일의 링크를 이용해 주세요.',
    error: '구독 해지를 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
  },
}

export const journalEn: JournalDictionary = {
  nav: {
    allRecords: 'All Records',
    about: 'About',
    search: 'Search',
    menuOpen: 'Open menu',
    menuClose: 'Close',
    menuLabel: 'Navigation menu',
    home: 'Journal home',
  },
  masthead: {
    tagline: 'Transcribing the time the sea has written.',
    recordCount: '{n} records',
    recordCountOne: '{n} record',
  },
  record: {
    read: 'Read the record',
    seaAvg: 'Sea 1Y avg {t}°C',
    minutes: '{n} min',
    minutesUpper: '{n} MIN',
    published: 'PUBLISHED',
    seaAvgLabel: 'SEA · 1Y AVG',
    reading: 'READING',
    photo: 'PHOTO',
    next: 'NEXT RECORD',
    empty: 'No records yet',
    emptyDescription: 'New records are on their way.',
    older: 'Older records',
    newer: 'Newer records',
  },
  series: {
    label: 'SERIES',
    others: 'OTHER SERIES',
    count: '{n} records',
    countOne: '{n} record',
    seriesCount: '{n} series',
  },
  newsletter: {
    label: 'NEWSLETTER',
    title: 'Receive new records by email',
    email: 'EMAIL',
    placeholder: 'Email address',
    submit: 'Subscribe',
    subtitle: 'Sent only when a new record is published.',
    name: 'NAME · OPTIONAL',
    namePlaceholder: 'Name',
    consent: 'I agree to the collection and use of my email address for sending the newsletter.',
    privacy: 'Privacy Policy',
    unsubscribeNote: 'You can unsubscribe at any time from the link at the bottom of each email.',
    processing: 'Sending',
    consentRequired: 'Please agree to the collection of your email address to subscribe.',
    invalidEmail: 'Please check your email address.',
    error: 'The subscription could not be processed. Please try again shortly.',
    doneTitle: 'You are subscribed',
    doneBody: 'A welcome email has been sent to {email}.\nThe newsletter will let you know when a new record is published.',
    doneNote: "If you don't see the email, please check your spam folder.",
    back: 'Back to the records',
    alreadyTitle: 'This email is already subscribed',
    alreadyBody: '{email} already receives the newsletter.\nNew records will be sent to this address.',
    alreadyNote: 'You can unsubscribe from the link at the bottom of each email.',
    close: 'Close',
  },
  search: {
    label: 'SEARCH',
    placeholder: 'Search the records',
    enter: 'ENTER',
    close: 'Close search',
    clear: 'Clear search',
    count: '{n} records',
    countOne: '{n} record',
    emptyTitle: "No records match '{q}' yet",
    emptyBody: 'Try another word, or browse all records.',
    allRecords: 'All Records',
  },
  menu: {
    brandLine: 'The record of time at sea, carried in every bottle.',
    recLocation: 'Namhae 34°N',
    recTemp: 'Temp {t}°C',
    recDays: 'Day {n} of measurement',
  },
  footer: {
    privacy: 'Privacy Policy',
    terms: 'Terms',
    motto: 'Written by the Sea.',
  },
  about: {
    kicker: 'ABOUT THE JOURNAL',
    subtitle: 'Time Written by the Sea',
    intro: 'The journal of Muse de Marée, transcribing the record of the days each bottle spends at sea.',
    location: 'LOCATION',
    locationValue: 'South Sea, Korea',
    retrieval: 'RETRIEVAL',
    retrievalValue: 'Once a year',
    records: 'RECORDS',
    seriesLabel: 'SERIES',
    storyKicker: 'THE STORY',
    storyTitle: 'The Story',
    storyLead:
      'Muse de Marée is a brand that records the time of the sea. Champagne crafted in Champagne, France rests in the South Sea of Korea, and every day it spends there is watched and recorded, from submersion to retrieval.',
    storyBody:
      'This journal is where that record is shared, from the data of the sea such as submersion dates, coordinates, temperature and currents, to the stories of the maison that made the champagne.',
    beliefKicker: 'WHAT THE RECORD HOLDS',
    beliefTitle: 'What Muse de Marée Believes',
    beliefs: [
      { title: 'The Record Is the Heritage', desc: 'Every bottle ships with the record of each day it lived, from submersion to retrieval.' },
      { title: 'The Sea Decides', desc: 'Quantity, release and price are decided by the sea, not by people. Only what is retrieved is released.' },
      { title: 'Retrieval Is a Ritual', desc: 'From submersion to retrieval, one cycle is an annual ritual marked on the calendar.' },
      { title: 'Custody, Not Consumption', desc: 'Not to drink, but to keep the time the sea made.' },
    ],
  },
  unsubscribe: {
    confirmTitle: 'Unsubscribe from the newsletter?',
    confirmBody: 'The newsletter to {email} will stop.\nThe records of the journal remain here to read at any time.',
    cancel: 'Cancel',
    submit: 'Unsubscribe',
    processing: 'Processing',
    doneTitle: 'You have unsubscribed',
    doneBody: 'The newsletter will no longer be sent to {email}.\nThe records of the journal remain here to read at any time.',
    resubscribe: 'Subscribe again',
    toJournal: 'Go to the journal',
    expiredTitle: 'This link has expired',
    expiredBody: 'Please use the link in the most recent email.',
    error: 'The request could not be processed. Please try again shortly.',
  },
}

/** 1이면 단수형 템플릿, 아니면 복수형 템플릿으로 {n}을 채운다 */
export function countText(one: string, many: string, n: number): string {
  return fillText(n === 1 ? one : many, { n })
}

/** '{n}편' 같은 자리 표시를 채운다 */
export function fillText(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`))
}
