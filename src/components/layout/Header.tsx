'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X } from 'lucide-react'
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
  const t = useTranslation()

  const categories = [
    { name: t.nav.seaLog, slug: 'sea-log' },
    { name: t.nav.maison, slug: 'maison' },
    { name: t.nav.culture, slug: 'culture' },
    { name: t.nav.table, slug: 'table' },
    { name: t.nav.news, slug: 'news' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="text-lg font-medium hover:text-muted-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
                <hr className="my-4 border-border" />
                <Link
                  href="/about"
                  className="text-lg font-medium hover:text-muted-foreground transition-colors"
                >
                  {t.footer.aboutJournal}
                </Link>
                <Link
                  href="/subscribe"
                  className="text-lg font-medium hover:text-muted-foreground transition-colors"
                >
                  {t.footer.newsletterSubscribe}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex-1 md:flex-none">
            <h1 className="font-display text-xl md:text-2xl tracking-tight text-center md:text-left">
              LE JOURNAL DE MARÉE
            </h1>
          </Link>

          {/* Right actions */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">{t.admin.search}</span>
            </Button>
            <LanguageSelector />
            <Link href="/subscribe">
              <span className="hidden sm:inline-flex px-4 py-1.5 text-xs tracking-wider text-muted-foreground hover:text-foreground border border-border/50 rounded-full hover:border-foreground/30 transition-all duration-300">
                {t.nav.subscribe}
              </span>
            </Link>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {isSearchOpen && (
          <div className="border-t border-border py-4">
            <form action="/search" method="GET" className="flex gap-2">
              <input
                type="search"
                name="q"
                placeholder={`${t.admin.search}...`}
                className="flex-1 bg-transparent border-b border-border px-0 py-2 text-base focus:outline-none focus:border-foreground transition-colors"
                autoFocus
              />
              <Button type="submit" variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </form>
          </div>
        )}

        {/* Desktop navigation */}
        <nav className="hidden md:flex h-12 items-center gap-8 border-t border-border">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
