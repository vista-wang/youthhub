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
          points: number
          experience: number
          level: number
          is_premium: boolean
          premium_expires_at: string | null
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
          points?: number
          experience?: number
          level?: number
          is_premium?: boolean
          premium_expires_at?: string | null
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
          points?: number
          experience?: number
          level?: number
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          likes_count: number
          comments_count: number
          image_urls: string[]
          attachment_urls: string[]
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
          image_urls?: string[]
          attachment_urls?: string[]
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
          image_urls?: string[]
          attachment_urls?: string[]
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      point_transactions: {
        Row: {
          id: string
          user_id: string
          action: string
          points: number
          experience: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          points: number
          experience: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          points?: number
          experience?: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
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
          image_urls: string[]
          attachment_urls: string[]
          created_at: string
          updated_at: string
          author_id: string
          author_name: string
          author_avatar: string | null
          author_level: number
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Functions: {}
    Enums: {
      [_ in never]: never
    }
  }
}

export interface SupabasePostResponse {
  id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  image_urls: string[];
  attachment_urls: string[];
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    level: number;
  } | null;
}

export interface SupabaseCommentResponse {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
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
export type PointTransaction = Database['public']['Tables']['point_transactions']['Row']

export type PostWithAuthor = Database['public']['Views']['posts_with_author']['Row']
export type CommentWithAuthor = Database['public']['Views']['comments_with_author']['Row']

export type PostWithKeywords = PostWithAuthor & {
  keywords?: string[]
}

export type LevelInfo = {
  level: number
  experience: number
  nextLevelExp: number
  progress: number
}

export const LEVEL_THRESHOLDS = [0, 25, 50, 100, 200, 400, 800, 1600, 3200, 6400] as const

export function getLevelInfo(experience: number): LevelInfo {
  const thresholds = [...LEVEL_THRESHOLDS]
  let level = 1
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (experience >= thresholds[i]) {
      level = i + 1
      break
    }
  }
  const currentThreshold = thresholds[level - 1] ?? 0
  const nextThreshold = thresholds[level] ?? (currentThreshold * 2)
  const progress = (experience - currentThreshold) / (nextThreshold - currentThreshold)
  return { level, experience, nextLevelExp: nextThreshold, progress: Math.min(progress, 1) }
}
