'use client'

import { useState } from 'react'
import { Settings, Globe, Mail, Bell, Palette, Save, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export default function SettingsPage() {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    showToast('설정이 저장되었습니다.', 'success')
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">사이트 설정을 관리합니다</p>
      </div>

      {/* General Settings */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">일반 설정</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">사이트 이름</label>
            <input
              type="text"
              defaultValue="Le Journal de Marée"
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">사이트 설명</label>
            <textarea
              defaultValue="해저숙성 샴페인 뮤즈드마레의 이야기를 전하는 디지털 저널"
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">기본 언어</label>
            <select className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground">
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">이메일 설정</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">발신자 이메일</label>
            <input
              type="email"
              defaultValue="info@musedemaree.com"
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              뉴스레터 발송에 사용되는 이메일 주소입니다.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">발신자 이름</label>
            <input
              type="text"
              defaultValue="Le Journal"
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">알림 설정</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">새 구독자 알림</p>
              <p className="text-xs text-muted-foreground">새로운 구독자가 등록되면 이메일로 알림을 받습니다.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-foreground peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">예약 발행 알림</p>
              <p className="text-xs text-muted-foreground">예약된 포스트가 발행되면 알림을 받습니다.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-foreground peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">외관 설정</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">포스트당 표시 개수</label>
            <select className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground">
              <option value="6">6개</option>
              <option value="9">9개</option>
              <option value="12" selected>12개</option>
              <option value="15">15개</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">관련 포스트 표시 개수</label>
            <select className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground">
              <option value="2">2개</option>
              <option value="3" selected>3개</option>
              <option value="4">4개</option>
            </select>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <ExternalLink className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-medium">외부 서비스</h2>
        </div>
        <div className="p-6 space-y-3">
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border border-border hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">Clerk Dashboard</p>
              <p className="text-xs text-muted-foreground">사용자 인증 관리</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border border-border hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">Supabase Dashboard</p>
              <p className="text-xs text-muted-foreground">데이터베이스 관리</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="https://resend.com/emails"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border border-border hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">Resend Dashboard</p>
              <p className="text-xs text-muted-foreground">이메일 발송 관리</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 border border-border hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">Vercel Dashboard</p>
              <p className="text-xs text-muted-foreground">배포 및 도메인 관리</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}
