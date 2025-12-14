'use client'

import Link from 'next/link'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/lib/i18n'
import { useToast } from '@/components/ui/toast'
import type { PostWithCategory, Category } from '@/lib/supabase/types'

interface AdminPostsListContentProps {
  posts: PostWithCategory[]
  total: number
  categories: Category[]
  currentPage: number
  totalPages: number
  params: {
    status?: string
    category?: string
    search?: string
    page?: string
  }
  onDelete: (id: string) => Promise<void>
}

function formatDate(dateString: string | null, locale: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '.').replace(/\.$/, '')
}

export function AdminPostsListContent({
  posts,
  total,
  categories,
  currentPage,
  totalPages,
  params,
  onDelete
}: AdminPostsListContentProps) {
  const { locale } = useLocale()
  const { showToast } = useToast()

  const text = {
    ko: {
      posts: '포스트',
      managePosts: '모든 포스트를 관리합니다',
      newPost: '새 포스트',
      searchPlaceholder: '포스트 검색...',
      allStatus: '모든 상태',
      published: '발행',
      draft: '초안',
      scheduled: '예약',
      allCategories: '모든 카테고리',
      search: '검색',
      title: '제목',
      category: '카테고리',
      status: '상태',
      date: '날짜',
      action: '액션',
      noPosts: '포스트가 없습니다.',
      edit: '편집',
      totalPosts: (count: number) => `총 ${count}개의 포스트`,
      prev: '이전',
      next: '다음',
      deleteSuccess: '포스트가 삭제되었습니다.',
      deleteError: '삭제 중 오류가 발생했습니다.',
      confirmDelete: '정말 삭제하시겠습니까?',
    },
    en: {
      posts: 'Posts',
      managePosts: 'Manage all posts',
      newPost: 'New Post',
      searchPlaceholder: 'Search posts...',
      allStatus: 'All Status',
      published: 'Published',
      draft: 'Draft',
      scheduled: 'Scheduled',
      allCategories: 'All Categories',
      search: 'Search',
      title: 'Title',
      category: 'Category',
      status: 'Status',
      date: 'Date',
      action: 'Action',
      noPosts: 'No posts found.',
      edit: 'Edit',
      totalPosts: (count: number) => `${count} posts total`,
      prev: 'Previous',
      next: 'Next',
      deleteSuccess: 'Post deleted successfully.',
      deleteError: 'An error occurred while deleting.',
      confirmDelete: 'Are you sure you want to delete?',
    },
  }

  const t = locale === 'ko' ? text.ko : text.en

  const statusLabels: Record<string, { label: string; className: string }> = {
    published: { label: t.published, className: 'bg-green-100 text-green-800' },
    draft: { label: t.draft, className: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: t.scheduled, className: 'bg-blue-100 text-blue-800' },
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return

    try {
      await onDelete(id)
      showToast(t.deleteSuccess, 'success')
    } catch {
      showToast(t.deleteError, 'error')
    }
  }

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const url = new URLSearchParams()
    const merged = { ...params, ...newParams }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) url.set(key, value)
    })
    return `/admin/posts?${url.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.posts}</h1>
          <p className="text-muted-foreground">{t.managePosts}</p>
        </div>
        <Link href="/admin/posts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.newPost}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder={t.searchPlaceholder}
            className="pl-9"
            defaultValue={params.search}
          />
        </div>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={params.status || ''}
            className="px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.allStatus}</option>
            <option value="published">{t.published}</option>
            <option value="draft">{t.draft}</option>
            <option value="scheduled">{t.scheduled}</option>
          </select>
          <select
            name="category"
            defaultValue={params.category || ''}
            className="px-3 py-2 border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{t.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">
            {t.search}
          </Button>
        </div>
      </form>

      {/* Posts Table */}
      <div className="border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                {t.title}
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                {t.category}
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                {t.status}
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                {t.date}
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                {t.action}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t.noPosts}
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const status = statusLabels[post.status] || statusLabels.draft
                return (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {post.category?.name || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                      {formatDate(post.published_at, locale)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/posts/${post.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            {t.edit}
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t.totalPosts(total)}
        </p>
        {totalPages > 1 && (
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={buildUrl({ page: String(currentPage - 1) })}>
                <Button variant="outline" size="sm">
                  {t.prev}
                </Button>
              </Link>
            )}
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link href={buildUrl({ page: String(currentPage + 1) })}>
                <Button variant="outline" size="sm">
                  {t.next}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
