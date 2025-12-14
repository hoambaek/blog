'use client'

import Link from 'next/link'
import { FileText, Users, Eye, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PostWithCategory } from '@/lib/supabase/types'

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  thisMonthPosts: number
  totalViews: number
}

interface SubscriberStats {
  active: number
  thisMonth: number
}

interface AdminDashboardContentProps {
  postStats: DashboardStats
  subscriberStats: SubscriberStats
  recentPosts: PostWithCategory[]
}

function formatDate(dateString: string | null) {
  if (!dateString) return '미발행'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '.').replace(/\.$/, '')
}

export function AdminDashboardContent({
  postStats,
  subscriberStats,
  recentPosts
}: AdminDashboardContentProps) {
  const t = {
    dashboard: '대시보드',
    manage: 'Le Journal de Marée 관리',
    newPost: '새 포스트',
    totalPosts: '전체 포스트',
    publishedDraft: (published: number, draft: number) => `발행 ${published} / 초안 ${draft}`,
    thisMonth: '이번 달 발행',
    newPosts: '새로운 포스트',
    subscribers: '구독자 수',
    thisMonthNew: (count: number) => `이번 달 +${count}`,
    totalViews: '총 조회수',
    allTime: '전체 기간',
    recentPosts: '최근 포스트',
    recentPostsDesc: '최근 작성 및 수정된 포스트',
    viewAll: '모두 보기',
    noPosts: '아직 포스트가 없습니다.',
    edit: '편집',
    published: '발행',
    draft: '초안',
    scheduled: '예약',
    createPost: '새 포스트 작성',
    createPostDesc: '새로운 포스트를 작성합니다',
    mediaManage: '미디어 관리',
    mediaManageDesc: '이미지와 파일을 관리합니다',
    subscribersManage: '구독자 관리',
    subscribersManageDesc: '뉴스레터 구독자를 관리합니다',
  }

  const statusLabels: Record<string, { label: string; className: string }> = {
    published: { label: t.published, className: 'bg-green-100 text-green-800' },
    draft: { label: t.draft, className: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: t.scheduled, className: 'bg-blue-100 text-blue-800' },
  }

  const stats = [
    {
      title: t.totalPosts,
      value: postStats.totalPosts.toString(),
      icon: FileText,
      description: t.publishedDraft(postStats.publishedPosts, postStats.draftPosts),
    },
    {
      title: t.thisMonth,
      value: postStats.thisMonthPosts.toString(),
      icon: TrendingUp,
      description: t.newPosts,
    },
    {
      title: t.subscribers,
      value: subscriberStats.active.toLocaleString(),
      icon: Users,
      description: t.thisMonthNew(subscriberStats.thisMonth),
    },
    {
      title: t.totalViews,
      value: postStats.totalViews.toLocaleString(),
      icon: Eye,
      description: t.allTime,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.dashboard}</h1>
          <p className="text-muted-foreground">{t.manage}</p>
        </div>
        <Link href="/admin/posts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.newPost}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.recentPosts}</CardTitle>
              <CardDescription>{t.recentPostsDesc}</CardDescription>
            </div>
            <Link href="/admin/posts">
              <Button variant="outline" size="sm">
                {t.viewAll}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t.noPosts}</p>
          ) : (
            <div className="divide-y divide-border">
              {recentPosts.map((post) => {
                const status = statusLabels[post.status] || statusLabels.draft
                return (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-medium hover:underline truncate block"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(post.published_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          {t.edit}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/admin/posts/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t.createPost}
              </CardTitle>
              <CardDescription>
                {t.createPostDesc}
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/admin/media">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t.mediaManage}
              </CardTitle>
              <CardDescription>
                {t.mediaManageDesc}
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <Link href="/admin/subscribers">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t.subscribersManage}
              </CardTitle>
              <CardDescription>
                {t.subscribersManageDesc}
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}
