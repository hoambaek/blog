export interface Dictionary {
  nav: {
    journal: string
    seaLog: string
    maison: string
    culture: string
    table: string
    news: string
    about: string
    subscribe: string
  }
  hero: {
    subtitle: string
    title1: string
    title2: string
    description: string
    cta: string
    imageAlt: string
  }
  sections: {
    featured: string
    latest: string
    relatedStories: string
    category: string
    viewAll: string
    emptyTitle: string
    emptyDescription: string
  }
  post: {
    readingTime: string
    prevPost: string
    nextPost: string
    allPosts: string
    viewAllPosts: string
    noPosts: string
    noPostsDescription: string
    postsCount: string
    sortLatest: string
  }
  newsletter: {
    title: string
    description: string
    placeholder: string
    button: string
    subscribe: string
    loading: string
    processing: string
    success: string
    error: string
    errorRetry: string
    alreadySubscribed: string
    resubscribed: string
    moreStories: string
    moreStoriesDescription: string
  }
  footer: {
    journal: string
    info: string
    social: string
    brand: string
    brandDescription: string
    brandQuote: string
    privacy: string
    terms: string
    aboutJournal: string
    newsletterSubscribe: string
    privacyConsent: string
  }
  common: {
    share: string
    back: string
    loading: string
    error: string
    notFound: string
  }
  admin: {
    dashboard: string
    posts: string
    newPost: string
    editPost: string
    media: string
    subscribers: string
    settings: string
    save: string
    publish: string
    preview: string
    delete: string
    edit: string
    status: string
    draft: string
    published: string
    scheduled: string
    category: string
    selectCategory: string
    title: string
    slug: string
    excerpt: string
    coverImage: string
    featured: string
    featuredDescription: string
    seo: string
    metaTitle: string
    metaDescription: string
    totalPosts: string
    thisMonth: string
    subscriberCount: string
    totalViews: string
    recentPosts: string
    viewAll: string
    quickActions: string
    writeNewPost: string
    manageMedia: string
    manageSubscribers: string
    search: string
    allStatus: string
    allCategories: string
    actions: string
    date: string
    unpublished: string
    previous: string
    next: string
  }
}

export const ko: Dictionary = {
  // Navigation
  nav: {
    journal: '저널',
    seaLog: '바다의 일지',
    maison: '메종 이야기',
    culture: '문화와 예술',
    table: '테이블 위에서',
    news: '뉴스 & 이벤트',
    about: '소개',
    subscribe: '구독',
  },

  // Hero Section
  hero: {
    subtitle: 'Le Journal de Marée',
    title1: '심연의 시간이 조각한',
    title2: '바다의 수공예품',
    description: '프랑스 샹파뉴의 전통과 한국 바다의 시간이 만나 탄생한 해저숙성 샴페인, 뮤즈드마레의 이야기',
    cta: '최신 포스트 읽기',
    imageAlt: '바다',
  },

  // Sections
  sections: {
    featured: 'FEATURED',
    latest: 'LATEST',
    relatedStories: 'RELATED STORIES',
    category: 'CATEGORY',
    viewAll: '모든 포스트 보기',
    emptyTitle: '아직 포스트가 없습니다',
    emptyDescription: '곧 새로운 이야기로 찾아뵙겠습니다.',
  },

  // Posts
  post: {
    readingTime: '분 읽기',
    prevPost: '이전 포스트',
    nextPost: '다음 포스트',
    allPosts: '모든 포스트',
    viewAllPosts: '모든 포스트 보기',
    noPosts: '아직 포스트가 없습니다',
    noPostsDescription: '곧 새로운 이야기로 찾아뵙겠습니다.',
    postsCount: '개의 포스트',
    sortLatest: '최신순',
  },

  // Newsletter
  newsletter: {
    title: '바다의 소식을 받아보세요',
    description: '해저에서 전하는 이야기, 새로운 콘텐츠 소식을 가장 먼저 만나보세요.',
    placeholder: '이메일 주소',
    button: '구독하기',
    subscribe: '구독하기',
    loading: '처리 중...',
    processing: '처리 중...',
    success: '구독해 주셔서 감사합니다!',
    error: '오류가 발생했습니다.',
    errorRetry: '오류가 발생했습니다. 다시 시도해 주세요.',
    alreadySubscribed: '이미 구독 중인 이메일입니다.',
    resubscribed: '다시 구독되었습니다!',
    moreStories: '더 많은 이야기가 기다리고 있습니다',
    moreStoriesDescription: '뮤즈드마레의 새로운 소식을 가장 먼저 받아보세요.',
  },

  // Footer
  footer: {
    journal: '저널',
    info: '정보',
    social: '소셜',
    brand: '브랜드',
    brandDescription: '뮤즈드마레는 프랑스 샹파뉴의 전통과 한국 바다의 시간이 만나 탄생한 해저숙성 샴페인 브랜드입니다.',
    brandQuote: '파도가 기억하는 시간, 심해가 허락한 깊이\n— 샹파뉴와 한국 바다가 빚은 유일한 샴페인',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    aboutJournal: '저널 소개',
    newsletterSubscribe: '뉴스레터 구독',
    privacyConsent: '구독 신청 시 개인정보처리방침에 동의하게 됩니다.',
  },

  // Common
  common: {
    share: '공유하기',
    back: '뒤로',
    loading: '로딩 중...',
    error: '오류가 발생했습니다',
    notFound: '페이지를 찾을 수 없습니다',
  },

  // Admin
  admin: {
    dashboard: '대시보드',
    posts: '포스트',
    newPost: '새 포스트',
    editPost: '포스트 수정',
    media: '미디어',
    subscribers: '구독자',
    settings: '설정',
    save: '저장',
    publish: '발행',
    preview: '미리보기',
    delete: '삭제',
    edit: '편집',
    status: '상태',
    draft: '초안',
    published: '발행',
    scheduled: '예약',
    category: '카테고리',
    selectCategory: '카테고리 선택',
    title: '제목',
    slug: '슬러그',
    excerpt: '발췌문',
    coverImage: '커버 이미지',
    featured: '피처드 포스트로 설정',
    featuredDescription: '홈페이지 상단에 노출됩니다',
    seo: 'SEO 설정',
    metaTitle: '메타 타이틀',
    metaDescription: '메타 설명',
    totalPosts: '전체 포스트',
    thisMonth: '이번 달 발행',
    subscriberCount: '구독자 수',
    totalViews: '총 조회수',
    recentPosts: '최근 포스트',
    viewAll: '모두 보기',
    quickActions: '빠른 작업',
    writeNewPost: '새 포스트 작성',
    manageMedia: '미디어 관리',
    manageSubscribers: '구독자 관리',
    search: '검색',
    allStatus: '모든 상태',
    allCategories: '모든 카테고리',
    actions: '액션',
    date: '날짜',
    unpublished: '미발행',
    previous: '이전',
    next: '다음',
  },
}
