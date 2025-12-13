'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
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
  const [isScrolled, setIsScrolled] = useState(false)
  const t = useTranslation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const categories = [
    { name: t.nav.seaLog, slug: 'sea-log' },
    { name: t.nav.maison, slug: 'maison' },
    { name: t.nav.culture, slug: 'culture' },
    { name: t.nav.table, slug: 'table' },
    { name: t.nav.news, slug: 'news' },
  ]

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? 'bg-background/98 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-gradient-to-b from-black/60 via-black/30 to-transparent'
      }`}
    >
      <div className="container-wide">
        {/* Mobile Header - Single line when scrolled */}
        <div className={`flex lg:hidden h-12 items-center justify-between transition-all duration-300 ${
          !isScrolled ? 'border-b border-white/10' : ''
        }`}>
          {/* Left: Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${!isScrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">MENU</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] bg-background border-r border-border">
              <div className="mt-6 mb-8">
                <h2 className="font-display text-2xl tracking-tight">LE JOURNAL DE MARÉE</h2>
                <p className="text-xs text-muted-foreground mt-2 tracking-wider">뮤즈드마레</p>
              </div>

              {/* Search inside hamburger menu */}
              <form action="/search" method="GET" className="mb-6">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    name="q"
                    placeholder={`${t.admin.search}...`}
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </form>

              <nav className="flex flex-col gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="text-base font-medium py-3 px-4 hover:bg-muted transition-colors border-l-2 border-transparent hover:border-rose-gold"
                  >
                    {category.name}
                  </Link>
                ))}
                <div className="h-px bg-border my-6" />
                <Link
                  href="/about"
                  className="text-base font-medium py-3 px-4 hover:bg-muted transition-colors text-muted-foreground"
                >
                  {t.footer.aboutJournal}
                </Link>
                <Link
                  href="/subscribe"
                  className="mt-4 mx-4 py-3 bg-foreground text-background text-center text-sm font-medium tracking-wide hover:bg-foreground/90 transition-colors"
                >
                  {t.footer.newsletterSubscribe}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Center: Logo (always visible on mobile) */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className={`font-display text-base tracking-tight whitespace-nowrap transition-all duration-300 ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}>
              LE JOURNAL DE MARÉE
            </h1>
          </Link>

          {/* Right: Language only on mobile */}
          <div className={`${!isScrolled ? '[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10' : '[&_button]:text-muted-foreground'}`}>
            <LanguageSelector />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          {/* Top Bar - Actions */}
          <div className={`flex h-10 items-center justify-between text-xs transition-all duration-300 ${
            isScrolled ? 'border-b border-border/50' : 'border-b border-white/10'
          }`}>
            {/* Left: Subscribe */}
            <Link
              href="/subscribe"
              className={`inline-flex items-center gap-1.5 tracking-wider transition-colors ${
                isScrolled
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Bell className="h-3 w-3" />
              <span>{t.nav.subscribe}</span>
            </Link>

            {/* Right: Search + Language */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`h-8 px-2 ${!isScrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Search className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs tracking-wide">{t.admin.search}</span>
              </Button>

              <div className={`${!isScrolled ? '[&_button]:text-white/80 [&_button]:hover:text-white [&_button]:hover:bg-white/10' : '[&_button]:text-muted-foreground'}`}>
                <LanguageSelector />
              </div>
            </div>
          </div>

          {/* Main Header - Logo Centered */}
          <div className="flex h-14 items-center justify-center">
            <Link href="/" className="group">
              <h1 className={`font-display text-2xl tracking-tight whitespace-nowrap transition-all duration-300 ${
                isScrolled ? 'text-foreground' : 'text-white'
              }`}>
                LE JOURNAL DE MARÉE
              </h1>
              <div className={`h-px w-0 group-hover:w-full transition-all duration-500 mx-auto ${
                isScrolled ? 'bg-rose-gold' : 'bg-white/50'
              }`} />
            </Link>
          </div>

          {/* Desktop Navigation - Below Logo */}
          <nav className={`flex items-center justify-center gap-12 pb-4 transition-all duration-300 ${
            isScrolled ? 'pb-3' : ''
          }`}>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-300 relative group ${
                  isScrolled
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {category.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-px group-hover:w-full transition-all duration-300 ${
                  isScrolled ? 'bg-rose-gold' : 'bg-white/50'
                }`} />
              </Link>
            ))}
          </nav>

          {/* Search bar (expandable) - Desktop only */}
          {isSearchOpen && (
            <div className={`border-t py-4 animate-fade-in ${isScrolled ? 'border-border' : 'border-white/20'}`}>
              <form action="/search" method="GET" className="flex gap-2 max-w-xl mx-auto">
                <input
                  type="search"
                  name="q"
                  placeholder={`${t.admin.search}...`}
                  className={`flex-1 bg-transparent border-b px-0 py-2 text-base focus:outline-none transition-colors ${
                    isScrolled
                      ? 'border-border focus:border-foreground text-foreground placeholder:text-muted-foreground'
                      : 'border-white/30 focus:border-white text-white placeholder:text-white/50'
                  }`}
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className={`${!isScrolled ? 'text-white hover:bg-white/10' : ''}`}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                  className={`${!isScrolled ? 'text-white hover:bg-white/10' : ''}`}
                >
                  <X className="h-5 w-5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
