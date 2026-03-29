export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bio: string | null
          role: 'user' | 'admin' | 'moderator'
          is_banned: boolean
          ban_reason: string | null
          banned_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'admin' | 'moderator'
          is_banned?: boolean
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'admin' | 'moderator'
          is_banned?: boolean
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          likes_count: number
          comments_count: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          likes_count?: number
          comments_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          likes_count?: number
          comments_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          content: string
          likes_count: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_id?: string | null
          content: string
          likes_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          parent_id?: string | null
          content?: string
          likes_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          likeable_id: string
          likeable_type: 'post' | 'comment'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          likeable_id: string
          likeable_type: 'post' | 'comment'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          likeable_id?: string
          likeable_type?: 'post' | 'comment'
          created_at?: string
        }
      }
      sensitive_words: {
        Row: {
          id: string
          word: string
          category: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          replacement: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          word: string
          category?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          replacement?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          word?: string
          category?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          replacement?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: 'info' | 'warning' | 'important' | 'event'
          priority: number
          is_active: boolean
          start_at: string | null
          end_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: 'info' | 'warning' | 'important' | 'event'
          priority?: number
          is_active?: boolean
          start_at?: string | null
          end_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'info' | 'warning' | 'important' | 'event'
          priority?: number
          is_active?: boolean
          start_at?: string | null
          end_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_topics: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image: string | null
          week_start: string
          week_end: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image?: string | null
          week_start: string
          week_end: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image?: string | null
          week_start?: string
          week_end?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_keywords: {
        Row: {
          id: string
          user_id: string
          keyword: string
          weight: number
          source: 'manual' | 'post' | 'like' | 'comment'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keyword: string
          weight?: number
          source?: 'manual' | 'post' | 'like' | 'comment'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keyword?: string
          weight?: number
          source?: 'manual' | 'post' | 'like' | 'comment'
          created_at?: string
          updated_at?: string
        }
      }
      post_keywords: {
        Row: {
          id: string
          post_id: string
          keyword: string
          relevance: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          keyword: string
          relevance?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          keyword?: string
          relevance?: number
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: 'post' | 'user' | 'announcement' | 'topic' | 'sensitive_word'
          target_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type: 'post' | 'user' | 'announcement' | 'topic' | 'sensitive_word'
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: 'post' | 'user' | 'announcement' | 'topic' | 'sensitive_word'
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      posts_with_author: {
        Row: {
          id: string
          title: string
          content: string
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
          author_id: string
          author_name: string
          author_avatar: string | null
        }
      }
      comments_with_author: {
        Row: {
          id: string
          post_id: string
          parent_id: string | null
          content: string
          likes_count: number
          created_at: string
          updated_at: string
          author_id: string
          author_name: string
          author_avatar: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type SensitiveWord = Database['public']['Tables']['sensitive_words']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type WeeklyTopic = Database['public']['Tables']['weekly_topics']['Row']
export type UserKeyword = Database['public']['Tables']['user_keywords']['Row']
export type PostKeyword = Database['public']['Tables']['post_keywords']['Row']
export type AdminLog = Database['public']['Tables']['admin_logs']['Row']

export type PostWithAuthor = Database['public']['Views']['posts_with_author']['Row']
export type CommentWithAuthor = Database['public']['Views']['comments_with_author']['Row']

export type PostWithKeywords = PostWithAuthor & {
  keywords?: string[]
}
