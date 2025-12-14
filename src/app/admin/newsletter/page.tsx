'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Plus,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  Loader2,
  Sparkles,
  Users,
  MousePointerClick,
  MailOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Newsletter {
  id: string
  subject: string
  preview_text: string | null
  html_content: string
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  unsubscribed_count: number
  created_at: string
  updated_at: string
}

type TabType = 'all' | 'draft' | 'sent'

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null)
  const { showToast } = useToast()

  // 생성 폼 상태
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    keyMessage: '',
    ctaText: '',
    ctaUrl: '',
    specialInstructions: '',
  })
  const [generatedContent, setGeneratedContent] = useState({
    subject: '',
    preview_text: '',
    html_content: '',
  })
  const [testEmail, setTestEmail] = useState('')

  const fetchNewsletters = async () => {
    setLoading(true)
    try {
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`
      const res = await fetch(`/api/admin/newsletter${statusParam}`)
      const data = await res.json()
      setNewsletters(data.newsletters || [])
    } catch (error) {
      console.error('Error fetching newsletters:', error)
      showToast('뉴스레터를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsletters()
  }, [activeTab])

  const handleGenerate = async () => {
    if (!formData.topic || !formData.keyMessage) {
      showToast('주제와 핵심 메시지를 입력해주세요.', 'error')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/admin/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setGeneratedContent({
        subject: data.subject,
        preview_text: data.preview_text,
        html_content: data.html_content,
      })
      showToast('뉴스레터가 생성되었습니다.', 'success')
    } catch (error) {
      console.error('Error generating:', error)
      showToast('뉴스레터 생성에 실패했습니다.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent.subject || !generatedContent.html_content) {
      showToast('먼저 뉴스레터를 생성해주세요.', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: generatedContent.subject,
          preview_text: generatedContent.preview_text,
          html_content: generatedContent.html_content,
          status: 'draft',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Save failed')
      }

      showToast('뉴스레터가 저장되었습니다.', 'success')
      setShowCreateModal(false)
      resetForm()
      fetchNewsletters()
    } catch (error) {
      console.error('Error saving:', error)
      showToast('저장에 실패했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSendTest = async (newsletterId: string) => {
    if (!testEmail) {
      showToast('테스트 이메일 주소를 입력해주세요.', 'error')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId, testEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Send failed')
      }

      showToast(data.message, 'success')
    } catch (error) {
      console.error('Error sending test:', error)
      showToast('테스트 발송에 실패했습니다.', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSend = async (newsletterId: string) => {
    if (!confirm('정말 이 뉴스레터를 모든 구독자에게 발송하시겠습니까?')) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Send failed')
      }

      showToast(data.message, 'success')
      fetchNewsletters()
    } catch (error) {
      console.error('Error sending:', error)
      showToast('발송에 실패했습니다.', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 뉴스레터를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/newsletter/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('뉴스레터가 삭제되었습니다.', 'success')
        fetchNewsletters()
      } else {
        showToast('삭제에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      topic: '',
      keyMessage: '',
      ctaText: '',
      ctaUrl: '',
      specialInstructions: '',
    })
    setGeneratedContent({
      subject: '',
      preview_text: '',
      html_content: '',
    })
    setTestEmail('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: Newsletter['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted text-muted-foreground">
            <FileText className="h-3 w-3" />
            임시저장
          </span>
        )
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3" />
            예약됨
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" />
            발송완료
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700">
            <AlertCircle className="h-3 w-3" />
            실패
          </span>
        )
    }
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'draft', label: '임시저장' },
    { key: 'sent', label: '발송완료' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">뉴스레터</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI로 뉴스레터를 생성하고 구독자에게 발송합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNewsletters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 뉴스레터
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">뉴스레터가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(newsletter.status)}
                    <span className="text-xs text-muted-foreground">
                      {newsletter.status === 'sent' && newsletter.sent_at
                        ? formatDate(newsletter.sent_at)
                        : formatDate(newsletter.created_at)}
                    </span>
                  </div>
                  <h3 className="font-medium truncate">{newsletter.subject}</h3>
                  {newsletter.preview_text && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {newsletter.preview_text}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNewsletter(newsletter)
                      setShowPreviewModal(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {newsletter.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(newsletter.id)}
                        disabled={sending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(newsletter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Analytics (for sent newsletters) */}
              {newsletter.status === 'sent' && (
                <div className="flex gap-4 pt-3 border-t border-border text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{newsletter.total_recipients} 명</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <span>{newsletter.delivered_count} 전달</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MailOpen className="h-4 w-4" />
                    <span>{newsletter.opened_count} 열람</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MousePointerClick className="h-4 w-4" />
                    <span>{newsletter.clicked_count} 클릭</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-lg">새 뉴스레터 만들기</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* AI 생성 폼 */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI로 뉴스레터 생성
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">주제 *</label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) =>
                        setFormData({ ...formData, topic: e.target.value })
                      }
                      placeholder="예: 2025년 첫 인양 소식"
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">핵심 메시지 *</label>
                    <input
                      type="text"
                      value={formData.keyMessage}
                      onChange={(e) =>
                        setFormData({ ...formData, keyMessage: e.target.value })
                      }
                      placeholder="예: 6개월간의 해저 숙성을 마친 첫 빈티지 출시"
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">CTA 버튼 텍스트</label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaText: e.target.value })
                      }
                      placeholder="예: 자세히 보기"
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">CTA 링크 URL</label>
                    <input
                      type="url"
                      value={formData.ctaUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">특별 지시사항</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, specialInstructions: e.target.value })
                    }
                    rows={2}
                    placeholder="추가로 포함하고 싶은 내용이나 특별한 지시사항"
                    className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none"
                  />
                </div>

                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {generating ? '생성 중...' : 'AI로 생성하기'}
                </Button>
              </div>

              {/* 생성된 콘텐츠 */}
              {generatedContent.html_content && (
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-medium">생성된 뉴스레터</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">제목</label>
                      <input
                        type="text"
                        value={generatedContent.subject}
                        onChange={(e) =>
                          setGeneratedContent({
                            ...generatedContent,
                            subject: e.target.value,
                          })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">미리보기 텍스트</label>
                      <input
                        type="text"
                        value={generatedContent.preview_text}
                        onChange={(e) =>
                          setGeneratedContent({
                            ...generatedContent,
                            preview_text: e.target.value,
                          })
                        }
                        className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                      />
                    </div>
                  </div>

                  {/* HTML 프리뷰 */}
                  <div>
                    <label className="text-sm font-medium block mb-2">미리보기</label>
                    <div className="border border-border bg-white max-h-96 overflow-y-auto">
                      <iframe
                        srcDoc={generatedContent.html_content}
                        className="w-full h-96"
                        title="Newsletter Preview"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {saving ? '저장 중...' : '임시저장'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg">{selectedNewsletter.subject}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedNewsletter.preview_text}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setSelectedNewsletter(null)
                  setTestEmail('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 테스트 발송 (draft만) */}
              {selectedNewsletter.status === 'draft' && (
                <div className="flex gap-2 items-end pb-4 border-b border-border">
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-2">
                      테스트 발송
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleSendTest(selectedNewsletter.id)}
                    disabled={sending || !testEmail}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    테스트 발송
                  </Button>
                </div>
              )}

              {/* HTML 프리뷰 */}
              <div className="border border-border bg-white">
                <iframe
                  srcDoc={selectedNewsletter.html_content}
                  className="w-full h-[60vh]"
                  title="Newsletter Preview"
                />
              </div>

              {/* 발송 버튼 (draft만) */}
              {selectedNewsletter.status === 'draft' && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() => handleSend(selectedNewsletter.id)}
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    모든 구독자에게 발송
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
