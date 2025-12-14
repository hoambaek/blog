'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { FolderOpen, GripVertical, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  sort_order: number
}

const CATEGORY_NAMES: Record<string, { ko: string; en: string }> = {
  'sea-log': { ko: '바다의 일지', en: 'Sea Log' },
  'maison': { ko: '메종 이야기', en: 'Maison' },
  'culture': { ko: '문화와 예술', en: 'Culture & Art' },
  'table': { ko: '테이블 위에서', en: 'At the Table' },
  'news': { ko: '뉴스 & 이벤트', en: 'News & Events' },
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ description: '' })
  const { showToast } = useToast()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      showToast('카테고리를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditForm({ description: category.description || '' })
  }

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editForm.description }),
      })

      if (res.ok) {
        showToast('카테고리가 업데이트되었습니다.', 'success')
        fetchCategories()
        setEditingId(null)
      } else {
        showToast('업데이트에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      showToast('업데이트 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ description: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display">카테고리 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">
          블로그 카테고리를 관리합니다. 카테고리는 시스템에서 미리 정의되어 있습니다.
        </p>
      </div>

      {/* Categories List */}
      <div className="border border-border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">불러오는 중...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>카테고리가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Drag Handle */}
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Cover Image */}
                <div className="w-16 h-16 bg-muted flex-shrink-0 overflow-hidden">
                  {category.cover_image_url ? (
                    <Image
                      src={category.cover_image_url}
                      alt={category.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {CATEGORY_NAMES[category.slug]?.ko || category.name}
                    </h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted">
                      {category.slug}
                    </span>
                  </div>
                  {editingId === category.id ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ description: e.target.value })}
                      placeholder="카테고리 설명을 입력하세요..."
                      className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {category.description || '설명 없음'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {editingId === category.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSave(category.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-muted/30 border border-border p-4">
        <p className="text-sm text-muted-foreground">
          <strong>참고:</strong> 카테고리는 시스템에서 미리 정의된 5개(바다의 일지, 메종 이야기, 문화와 예술, 테이블 위에서, 뉴스 & 이벤트)로 고정되어 있습니다.
          각 카테고리의 설명만 수정할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
