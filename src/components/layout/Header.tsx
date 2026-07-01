'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, Menu, X, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useTranslation } from '@/lib/i18n'

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const lastScrollY = useRef(0)
  const router = useRouter()
  const t = useTranslation()

  // Transparent over the dark hero until scrolled (post hero is now full-bleed)
  const showScrolledStyle = isScrolled

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 100)
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHidden(true)
      } else {
        setIsHidden(false)
      }
      lastScrollY.current = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close search on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }
    if (isSearchOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isSearchOpen])

  const categories = [
    { name: t.nav.seaLog, slug: 'sea-log' },
    { name: t.nav.maison, slug: 'maison' },
    { name: t.nav.culture, slug: 'culture' },
    { name: t.nav.table, slug: 'table' },
    { name: t.nav.news, slug: 'news' },
  ]

  // Handle mobile navigation - close menu on link click
  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          showScrolledStyle
            ? 'bg-background/98 backdrop-blur-md shadow-[0_1px_0_0_var(--border),0_1px_3px_0_rgba(0,0,0,0.05)]'
            : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent shadow-none'
        } ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="container-wide">
          {/* Mobile Header - Single line when scrolled */}
          <div className="flex lg:hidden h-12 items-center justify-between">
            {/* Left: Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${!showScrolledStyle ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">MENU</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[340px] p-0 border-0 bg-[#000000]" onOpenAutoFocus={(e) => e.preventDefault()}>
                {/* Dark Luxury Mobile Menu */}
                <div className="h-full flex flex-col">
                  {/* Header with Logo */}
                  <div className="relative px-8 pt-10 pb-8">
                    {/* Decorative corner */}
                    <div className="absolute top-6 right-6 w-10 h-10 border-r border-t border-white/[0.08]" />

                    <Image
                      src="/images/logo/logo_text_trans_W.png"
                      alt="Muse de Marée"
                      width={170}
                      height={26}
                      className="h-[26px] w-auto"
                      priority
                    />
                    <p className="text-[10px] text-white/40 mt-3 tracking-[0.3em] uppercase">뮤즈드마레</p>
                  </div>

                  {/* Search */}
                  <form action="/search" method="GET" className="px-8 mb-6" onSubmit={handleMobileNavClick}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                      <input
                        type="search"
                        name="q"
                        placeholder={`${t.admin.search}...`}
                        className="w-full bg-white/[0.05] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all"
                        autoFocus={false}
                      />
                    </div>
                  </form>

                  {/* Navigation */}
                  <nav className="flex-1 px-4 overflow-y-auto">
                    {/* Primary Links - Categories */}
                    <div className="space-y-0.5">
                      {categories.map((category, index) => (
                        <Link
                          key={category.slug}
                          href={`/category/${category.slug}`}
                          onClick={handleMobileNavClick}
                          className="group flex items-center gap-4 px-4 py-4 hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-[10px] text-white/20 font-light">{String(index + 1).padStart(2, '0')}</span>
                          <span className="font-display text-base text-white/80 group-hover:text-white transition-colors">
                            {category.name}
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="my-6 mx-4 h-px bg-white/[0.08]" />

                    {/* Secondary Links */}
                    <div className="space-y-0.5">
                      <Link
                        href="/about"
                        onClick={handleMobileNavClick}
                        className="group flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                          {t.footer.aboutJournal}
                        </span>
                      </Link>
                      <Link
                        href="/category/all"
                        onClick={handleMobileNavClick}
                        className="group flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                          {t.post.allPosts}
                        </span>
                      </Link>
                    </div>
                  </nav>

                  {/* Bottom CTA */}
                  <div className="p-8 border-t border-white/[0.06]">
                    <Link
                      href="/subscribe"
                      onClick={handleMobileNavClick}
                      className="group block relative overflow-hidden"
                    >
                      <div className="relative bg-white py-4 text-center">
                        <span className="relative z-10 text-sm font-medium tracking-[0.15em] uppercase text-black">
                          {t.footer.newsletterSubscribe}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                      </div>
                    </Link>
                    <p className="mt-4 text-[10px] text-white/30 text-center tracking-wider">
                      {t.newsletter.description}
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Center: Logo (always visible on mobile) */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2" aria-label="Muse de Marée">
              <span className="relative block h-[18px] w-[118px]">
                <Image
                  src="/images/logo/logo_text_trans_W.png"
                  alt="Muse de Marée"
                  fill
                  sizes="118px"
                  className={`object-contain transition-opacity duration-300 ${showScrolledStyle ? 'opacity-0' : 'opacity-100'}`}
                  priority
                />
                <Image
                  src="/images/logo/logo_text_trans.png"
                  alt=""
                  aria-hidden
                  fill
                  sizes="118px"
                  className={`object-contain transition-opacity duration-300 ${showScrolledStyle ? 'opacity-100' : 'opacity-0'}`}
                />
              </span>
            </Link>

            {/* Right: Language only on mobile */}
            <div className={`${!showScrolledStyle ? '[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10' : '[&_button]:text-muted-foreground'}`}>
              <LanguageSelector />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            {/* Main Header - Logo Centered */}
            <div className="flex h-14 items-center justify-center">
              <Link href="/" className="group" aria-label="Muse de Marée">
                <span className="relative block h-[26px] w-[172px]">
                  <Image
                    src="/images/logo/logo_text_trans_W.png"
                    alt="Muse de Marée"
                    fill
                    sizes="172px"
                    className={`object-contain transition-opacity duration-300 ${showScrolledStyle ? 'opacity-0' : 'opacity-100'}`}
                    priority
                  />
                  <Image
                    src="/images/logo/logo_text_trans.png"
                    alt=""
                    aria-hidden
                    fill
                    sizes="172px"
                    className={`object-contain transition-opacity duration-300 ${showScrolledStyle ? 'opacity-100' : 'opacity-0'}`}
                  />
                </span>
                <div className={`h-px w-0 group-hover:w-full transition-all duration-500 mx-auto mt-1 ${
                  showScrolledStyle ? 'bg-foreground' : 'bg-white/50'
                }`} />
              </Link>
            </div>

            {/* Action + Navigation row — subscribe (left) · categories (center) · search/language (right) */}
            <div className={`flex items-center pb-4 transition-all duration-300 ${
              showScrolledStyle ? 'pb-3' : ''
            }`}>
              {/* Left: Subscribe */}
              <div className="flex-1 flex justify-start">
                <Link
                  href="/subscribe"
                  className={`inline-flex items-center gap-1.5 text-[11px] tracking-wider transition-colors ${
                    showScrolledStyle
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Bell className="h-3 w-3" />
                  <span>{t.nav.subscribe}</span>
                </Link>
              </div>

              {/* Center: Categories */}
              <nav className="flex items-center justify-center gap-10">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className={`text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 relative group ${
                      showScrolledStyle
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {category.name}
                    <span className={`absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300 ${
                      showScrolledStyle ? 'bg-foreground' : 'bg-white/50'
                    }`} />
                  </Link>
                ))}
              </nav>

              {/* Right: Search + Language */}
              <div className="flex-1 flex justify-end items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(true)}
                  className={`h-8 px-2 ${!showScrolledStyle ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Search className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs tracking-wide">{t.admin.search}</span>
                </Button>

                <div className={`${!showScrolledStyle ? '[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10' : '[&_button]:text-muted-foreground'}`}>
                  <LanguageSelector />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSearchOpen(false)}
          />

          {/* Search Container */}
          <div className="relative h-full flex items-start justify-center pt-32 md:pt-40 px-6">
            <div className="w-full max-w-2xl animate-fade-in-up">
              {/* Close Button */}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Search Form */}
              <div className="text-center mb-8">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white mb-4">Search</p>
                <p className="text-white/50 text-sm">{t.admin.search}</p>
              </div>

              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t.admin.search}...`}
                    className="w-full bg-white/[0.05] border border-white/[0.15] px-6 py-5 pr-14 text-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Quick Links */}
              <div className="mt-8 pt-8 border-t border-white/[0.08]">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">카테고리</p>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="text-sm text-white/50 hover:text-white hover:bg-white/[0.05] px-4 py-2 border border-white/[0.08] transition-all"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
