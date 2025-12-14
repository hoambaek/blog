'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Upload, Trash2, Copy, Search, RefreshCw, Grid, List, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface MediaFile {
  id: string
  filename: string
  original_filename: string | null
  file_url: string
  file_size: number | null
  mime_type: string | null
  width: number | null
  height: number | null
  created_at: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching media:', error)
      showToast('미디어를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = e.target.files
    if (!uploadFiles || uploadFiles.length === 0) return

    setUploading(true)

    try {
      for (const file of Array.from(uploadFiles)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'media')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          throw new Error('Upload failed')
        }
      }

      showToast('파일이 업로드되었습니다.', 'success')
      fetchMedia()
    } catch (error) {
      console.error('Error uploading:', error)
      showToast('업로드에 실패했습니다.', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return

    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('파일이 삭제되었습니다.', 'success')
        setSelectedFile(null)
        fetchMedia()
      } else {
        showToast('삭제에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      showToast('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    showToast('URL이 복사되었습니다.', 'success')
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredFiles = files.filter(f =>
    f.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.original_filename && f.original_filename.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display">미디어 라이브러리</h1>
          <p className="text-sm text-muted-foreground mt-1">업로드된 이미지와 파일을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMedia}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            업로드
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="파일명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-background text-sm focus:outline-none focus:border-foreground"
          />
        </div>
        <div className="flex gap-1 border border-border p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Files */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">업로드된 파일이 없습니다</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`group cursor-pointer border transition-all ${
                    selectedFile?.id === file.id
                      ? 'border-foreground ring-2 ring-foreground/20'
                      : 'border-border hover:border-foreground/50'
                  }`}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <Image
                      src={file.file_url}
                      alt={file.filename}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs truncate">{file.original_filename || file.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border divide-y divide-border">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-4 p-3 cursor-pointer transition-colors ${
                    selectedFile?.id === file.id ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="w-12 h-12 bg-muted relative overflow-hidden flex-shrink-0">
                    <Image
                      src={file.file_url}
                      alt={file.filename}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.original_filename || file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {selectedFile && (
          <div className="w-72 border border-border bg-card p-4 space-y-4 hidden lg:block">
            <div className="aspect-video bg-muted relative overflow-hidden">
              <Image
                src={selectedFile.file_url}
                alt={selectedFile.filename}
                fill
                className="object-contain"
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">파일명</p>
                <p className="text-sm truncate">{selectedFile.original_filename || selectedFile.filename}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">크기</p>
                  <p className="text-sm">{formatFileSize(selectedFile.file_size)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">타입</p>
                  <p className="text-sm">{selectedFile.mime_type?.split('/')[1] || '-'}</p>
                </div>
              </div>

              {selectedFile.width && selectedFile.height && (
                <div>
                  <p className="text-xs text-muted-foreground">해상도</p>
                  <p className="text-sm">{selectedFile.width} × {selectedFile.height}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">업로드일</p>
                <p className="text-sm">{formatDate(selectedFile.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleCopyUrl(selectedFile.file_url)}
              >
                <Copy className="h-4 w-4 mr-2" />
                URL 복사
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedFile.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
