/**
 * Supabase 数据库类型定义
 * 后续可用 supabase gen types 自动生成
 */

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
      user_profiles: {
        Row: {
          id: string
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: number
          user_id: string
          prompt_slug: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          prompt_slug: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          prompt_slug?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: number
          user_id: string
          prompt_slug: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          prompt_slug: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          prompt_slug?: string
          created_at?: string
        }
      }
    }
    Views: {
      prompt_stats: {
        Row: {
          prompt_slug: string | null
          like_count: number | null
          favorite_count: number | null
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
