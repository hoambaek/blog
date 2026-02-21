export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          cover_image_url: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          cover_image_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          cover_image_url?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          id: string
          filename: string
          original_filename: string | null
          file_path: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          width: number | null
          height: number | null
          alt_text: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          filename: string
          original_filename?: string | null
          file_path: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          alt_text?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          filename?: string
          original_filename?: string | null
          file_path?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          width?: number | null
          height?: number | null
          alt_text?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          id: string
          subject: string
          preview_text: string | null
          html_content: string
          plain_text_content: string | null
          status: 'draft' | 'scheduled' | 'sent' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          total_recipients: number
          delivered_count: number
          opened_count: number
          clicked_count: number
          bounced_count: number
          unsubscribed_count: number
          resend_batch_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject: string
          preview_text?: string | null
          html_content: string
          plain_text_content?: string | null
          status?: 'draft' | 'scheduled' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          total_recipients?: number
          delivered_count?: number
          opened_count?: number
          clicked_count?: number
          bounced_count?: number
          unsubscribed_count?: number
          resend_batch_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject?: string
          preview_text?: string | null
          html_content?: string
          plain_text_content?: string | null
          status?: 'draft' | 'scheduled' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          total_recipients?: number
          delivered_count?: number
          opened_count?: number
          clicked_count?: number
          bounced_count?: number
          unsubscribed_count?: number
          resend_batch_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: Json
          cover_image_url: string | null
          category_id: string | null
          status: string
          is_featured: boolean
          published_at: string | null
          scheduled_at: string | null
          meta_title: string | null
          meta_description: string | null
          meta_title_en: string | null
          meta_description_en: string | null
          title_en: string | null
          excerpt_en: string | null
          content_en: Json | null
          og_image_url: string | null
          reading_time_minutes: number | null
          view_count: number
          author_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: Json
          cover_image_url?: string | null
          category_id?: string | null
          status?: string
          is_featured?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          meta_title?: string | null
          meta_description?: string | null
          meta_title_en?: string | null
          meta_description_en?: string | null
          title_en?: string | null
          excerpt_en?: string | null
          content_en?: Json | null
          og_image_url?: string | null
          reading_time_minutes?: number | null
          view_count?: number
          author_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: Json
          cover_image_url?: string | null
          category_id?: string | null
          status?: string
          is_featured?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          meta_title?: string | null
          meta_description?: string | null
          meta_title_en?: string | null
          meta_description_en?: string | null
          title_en?: string | null
          excerpt_en?: string | null
          content_en?: Json | null
          og_image_url?: string | null
          reading_time_minutes?: number | null
          view_count?: number
          author_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      subscribers: {
        Row: {
          id: string
          email: string
          name: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          source: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          source?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          source?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: {
          post_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      post_status: 'draft' | 'published' | 'scheduled'
      subscriber_status: 'active' | 'unsubscribed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Post = Tables<'posts'>
export type Category = Tables<'categories'>
export type Tag = Tables<'tags'>
export type Media = Tables<'media'>
export type Subscriber = Tables<'subscribers'>
export type Newsletter = Tables<'newsletters'>

// Extended types with relations
export type PostWithCategory = Post & {
  category: Category | null
}

export type PostWithTags = Post & {
  tags: Tag[]
}

export type PostFull = Post & {
  category: Category | null
  tags: Tag[]
}
