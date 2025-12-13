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
      setIsScrolled(window.scrollY > 50)
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
          : 'bg-transparent'
      }`}
    >
      <div className="container-wide">
        {/* Main Header Bar */}
        <div className="flex h-20 items-center justify-between">
          {/* Left: Mobile Menu + Navigation */}
          <div className="flex items-center gap-8">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className={`${!isScrolled ? 'text-white hover:bg-white/10' : ''}`}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] bg-background border-r border-border">
                <div className="mt-8 mb-12">
                  <h2 className="font-display text-2xl tracking-tight">LE JOURNAL DE MARÉE</h2>
                </div>
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

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className={`text-[13px] font-medium tracking-wide transition-colors link-underline ${
                    isScrolled
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className={`font-display text-xl md:text-2xl tracking-tight whitespace-nowrap transition-colors duration-300 ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}>
              LE JOURNAL DE MARÉE
            </h1>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`${!isScrolled ? 'text-white hover:bg-white/10' : ''}`}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">{t.admin.search}</span>
            </Button>

            {/* Language Selector */}
            <div className={`${!isScrolled ? '[&_button]:text-white [&_button]:hover:bg-white/10' : ''}`}>
              <LanguageSelector />
            </div>

            {/* Subscribe Button - More Prominent */}
            <Link href="/subscribe" className="hidden sm:block ml-2">
              <span className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                isScrolled
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-white text-stone-900 hover:bg-white/90'
              }`}>
                <Bell className="h-3.5 w-3.5" />
                {t.nav.subscribe}
              </span>
            </Link>
          </div>
        </div>

        {/* Search bar (expandable) */}
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
    </header>
  )
}
