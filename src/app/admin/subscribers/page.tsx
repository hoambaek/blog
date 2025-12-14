'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, UserMinus, Download, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: string
  subscribed_at: string
  unsubscribed_at: string | null
  source: string | null
}

interface SubscriberStats {
  total: number
  active: number
  thisMonth: number
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<SubscriberStats>({ total: 0, active: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { showToast } = useToast()

  const fetchSubscribers = async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter
      const res = await fetch(`/api/admin/subscribers?status=${status || ''}`)
      const data = await res.json()
      setSubscribers(data.subscribers || [])

      const statsRes = await fetch('/api/admin/subscribers/stats')
      const statsData = await statsRes.json()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      showToast('구독자 목록을 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [filter])

  const handleExportCSV = () => {
    const csvContent = [
      ['이메일', '이름', '상태', '구독일', '출처'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.name || '',
        s.status,
        new Date(s.subscribed_at).toLocaleDateString('ko-KR'),
        s.source || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('CSV 파일이 다운로드되었습니다.', 'success')
  }

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">구독자 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">뉴스레터 구독자를 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSubscribers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">전체 구독자</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">활성 구독자</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded">
              <UserMinus className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.thisMonth}</p>
              <p className="text-xs text-muted-foreground">이번 달 신규</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-background text-sm focus:outline-none focus:border-foreground"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'unsubscribed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm border transition-colors ${
                filter === status
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              }`}
            >
              {status === 'all' ? '전체' : status === 'active' ? '활성' : '해지'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  이메일
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  이름
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  상태
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  구독일
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                  출처
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    불러오는 중...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    구독자가 없습니다
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">{subscriber.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {subscriber.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                          subscriber.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subscriber.status === 'active' ? '활성' : '해지'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(subscriber.subscribed_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {subscriber.source || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
