'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Undo,
  Redo,
  Minus,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// 카테고리별 예시 프롬프트
const CATEGORY_EXAMPLES: Record<string, string[]> = {
  'sea-log': [
    'Champagne bottles resting on sandy ocean floor with soft light rays from above',
    'Abstract ocean surface from below, looking up at diffused sunlight',
    'Underwater bubbles rising in deep blue water',
  ],
  'maison': [
    'Champagne vineyard at golden hour with misty atmosphere',
    'Ancient cellar with chalk walls and bottles aging in darkness',
    'Close-up of weathered hands holding a champagne bottle',
  ],
  'culture': [
    'Artisan hands shaping ceramic in minimalist workshop',
    'Mother-of-pearl inlay work in progress on dark lacquer',
    'Minimalist gallery space with champagne bottle displayed as art',
  ],
  'table': [
    'Champagne bubbles rising in crystal flute glass with backlight',
    'Elegant table setting with champagne and oysters',
    'Champagne being poured into a coupe glass',
  ],
  'news': [
    'Intimate event space with candles and champagne display',
    'Silhouettes of guests raising glasses in toast',
    'Luxury invitation card with embossed lettering',
  ],
}

export function TiptapEditor({ content, onChange, placeholder = '본문을 작성하세요...' }: TiptapEditorProps) {
  const [showAIImageDialog, setShowAIImageDialog] = useState(false)
  const [aiImagePrompt, setAIImagePrompt] = useState('')
  const [aiImageLoading, setAIImageLoading] = useState(false)
  const [aiImageError, setAIImageError] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('16:9')
  const [imageCategory, setImageCategory] = useState<string>('sea-log')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isExternalUpdate = useRef(false)
  const prevContent = useRef(content)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-navy underline underline-offset-4',
        },
      }),
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when it changes externally (e.g., AI generation)
  useEffect(() => {
    if (editor && content !== prevContent.current) {
      // Check if this is an external update (content changed but not from editor)
      const currentEditorContent = editor.getHTML()
      if (content !== currentEditorContent) {
        isExternalUpdate.current = true
        editor.commands.setContent(content)
        isExternalUpdate.current = false
      }
      prevContent.current = content
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const addImageFromUrl = () => {
    const url = window.prompt('이미지 URL을 입력하세요')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'image/svg+xml', 'image/bmp', 'image/tiff']
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    const isVideo = validVideoTypes.includes(file.type)
    const isImage = validImageTypes.includes(file.type)

    if (!isImage && !isVideo) {
      alert('지원되지 않는 파일 형식입니다.\n이미지: JPEG, PNG, GIF, WebP, AVIF, HEIC, SVG, BMP, TIFF\n영상: MP4, WebM, OGG, MOV, AVI, MKV')
      return
    }

    // Validate file size (images: 10MB, videos: 100MB)
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`파일 크기가 ${isVideo ? '100MB' : '10MB'}를 초과합니다.`)
      return
    }

    setIsUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'posts')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
        if (data.optimization) {
          console.log(`Image optimized: ${data.optimization.savings}% size reduction`)
        }
      } else {
        alert(data.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('링크 URL을 입력하세요', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleAIImageGenerate = async () => {
    if (!aiImagePrompt.trim()) {
      setAIImageError('이미지 설명을 입력해주세요.')
      return
    }

    setAIImageLoading(true)
    setAIImageError(null)

    try {
      // Step 1: Generate image with AI
      const generateResponse = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiImagePrompt,
          category: imageCategory,
          aspectRatio,
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateData.success || !generateData.image?.base64) {
        setAIImageError(generateData.error || '이미지 생성에 실패했습니다.')
        return
      }

      // Step 2: Upload to R2 with optimization
      const uploadResponse = await fetch('/api/upload-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: generateData.image.base64,
          folder: 'ai-images',
          type: 'content',
          filename: `ai-content-${Date.now()}`,
        }),
      })

      const uploadData = await uploadResponse.json()

      if (uploadData.success && uploadData.url) {
        // Insert optimized image at cursor position
        editor.chain().focus().setImage({ src: uploadData.url }).run()

        // Close dialog and reset
        setShowAIImageDialog(false)
        setAIImagePrompt('')
        setAIImageError(null)
        console.log(`Content image optimized: ${uploadData.optimization?.savings}% size reduction`)
      } else {
        setAIImageError(uploadData.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (err) {
      console.error('Error generating AI image:', err)
      setAIImageError('이미지 생성 중 오류가 발생했습니다.')
    } finally {
      setAIImageLoading(false)
    }
  }

  return (
    <div className="border border-border bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          data-active={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={setLink}
          data-active={editor.isActive('link')}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fileInputRef.current?.click()}
          title="이미지 업로드"
          disabled={isUploadingImage}
        >
          {isUploadingImage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={addImageFromUrl}
          title="이미지 URL 추가"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif,image/svg+xml,image/bmp,image/tiff,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowAIImageDialog(true)}
          title="AI 이미지 생성"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Image Dialog */}
      {showAIImageDialog && (
        <div className="border-b border-border bg-muted/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI 이미지 생성
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowAIImageDialog(false)
                setAIImagePrompt('')
                setAIImageError(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {aiImageError && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 mb-3 border border-destructive/20">
              {aiImageError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                이미지 설명 (영어 권장)
              </label>
              <textarea
                value={aiImagePrompt}
                onChange={(e) => setAIImagePrompt(e.target.value)}
                placeholder="예: A bottle of champagne resting on the ocean floor, surrounded by soft blue light and bubbles, elegant and luxurious atmosphere"
                rows={3}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                disabled={aiImageLoading}
              />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  카테고리
                </label>
                <select
                  value={imageCategory}
                  onChange={(e) => setImageCategory(e.target.value)}
                  className="border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:border-foreground"
                  disabled={aiImageLoading}
                >
                  <option value="sea-log">바다의 일지</option>
                  <option value="maison">메종 이야기</option>
                  <option value="culture">문화와 예술</option>
                  <option value="table">테이블 위에서</option>
                  <option value="news">뉴스 & 이벤트</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  비율
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
                  className="border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:border-foreground"
                  disabled={aiImageLoading}
                >
                  <option value="16:9">16:9 (가로)</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1 (정사각형)</option>
                  <option value="3:4">3:4</option>
                  <option value="9:16">9:16 (세로)</option>
                </select>
              </div>

              <div className="flex-1" />

              <Button
                type="button"
                size="sm"
                onClick={handleAIImageGenerate}
                disabled={aiImageLoading || !aiImagePrompt.trim()}
              >
                {aiImageLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    이미지 생성
                  </>
                )}
              </Button>
            </div>

            {/* Example prompts */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">예시 프롬프트 (클릭하여 사용):</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_EXAMPLES[imageCategory]?.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAIImagePrompt(example)}
                    className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted border border-border/50 transition-colors text-left"
                    disabled={aiImageLoading}
                  >
                    {example.length > 50 ? example.slice(0, 50) + '...' : example}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Imagen 4를 사용하여 뮤즈드마레 브랜드 스타일의 이미지를 생성합니다.
              커서 위치에 이미지가 삽입됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror:focus {
          outline: none;
        }

        [data-active="true"] {
          background-color: var(--muted);
        }
      `}</style>
    </div>
  )
}
