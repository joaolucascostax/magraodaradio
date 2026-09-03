export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apoiadores: {
        Row: {
          cidade: string
          created_at: string
          id: string
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cidade: string
          created_at?: string
          id?: string
          uf?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cidade?: string
          created_at?: string
          id?: string
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      apoiadores_stats: {
        Row: {
          cidade: string
          total: number
          uf: string
          updated_at: string
        }
        Insert: {
          cidade: string
          total?: number
          uf?: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          total?: number
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      bairros: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string | null
          id: string
          motivo: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by?: string | null
          id?: string
          motivo: string
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string | null
          id?: string
          motivo?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          pending_cpf: string | null
          pending_lgpd: boolean
          pending_name: string | null
          phone_e164: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          pending_cpf?: string | null
          pending_lgpd?: boolean
          pending_name?: string | null
          phone_e164: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          pending_cpf?: string | null
          pending_lgpd?: boolean
          pending_name?: string | null
          phone_e164?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          cargo: string | null
          created_at: string
          foto_url: string | null
          id: string
          poll_id: string
          position: number
          text: string
          vote_count: number
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          poll_id: string
          position?: number
          text: string
          vote_count?: number
        }
        Update: {
          cargo?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          poll_id?: string
          position?: number
          text?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          device_id: string
          id: string
          option_id: string
          poll_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          option_id: string
          poll_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_multiple: boolean
          cidade: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          question: string
          tipo: string
          updated_at: string
        }
        Insert: {
          allow_multiple?: boolean
          cidade?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          question: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          allow_multiple?: boolean
          cidade?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          question?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          autor_display_name: string
          autor_id: string | null
          conteudo: string
          created_at: string
          id: string
          is_anonimo: boolean
          is_hidden: boolean
          parent_id: string | null
          post_id: string
        }
        Insert: {
          autor_display_name?: string
          autor_id?: string | null
          conteudo: string
          created_at?: string
          id?: string
          is_anonimo?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          post_id: string
        }
        Update: {
          autor_display_name?: string
          autor_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          is_anonimo?: boolean
          is_hidden?: boolean
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          post_id: string
          tipo: Database["public"]["Enums"]["reaction_tipo"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          post_id: string
          tipo: Database["public"]["Enums"]["reaction_tipo"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          post_id?: string
          tipo?: Database["public"]["Enums"]["reaction_tipo"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          after_photo_url: string | null
          audio_url: string | null
          autor_display_name: string
          autor_id: string | null
          bairro: string | null
          categoria: Database["public"]["Enums"]["complaint_category"] | null
          cidade: string | null
          comment_count: number
          corpo: string | null
          cover_url: string | null
          created_at: string
          device_id: string | null
          dislike_count: number
          enquete_opcoes: Json | null
          id: string
          is_anonimo: boolean
          is_official: boolean
          like_count: number
          media_urls: string[]
          moderation_note: string | null
          official_response: string | null
          official_response_date: string | null
          prefeitura_id: string | null
          promise_deadline: string | null
          promise_text: string | null
          published_at: string | null
          selo: Database["public"]["Enums"]["post_selo"] | null
          selo_em: string | null
          selo_por: string | null
          status: Database["public"]["Enums"]["post_status"]
          status_denuncia:
            | Database["public"]["Enums"]["complaint_status"]
            | null
          support_count: number
          tipo: Database["public"]["Enums"]["post_tipo"]
          titulo: string
          uf: string | null
          updated_at: string
          video_url: string | null
          weekly_support_count: number
        }
        Insert: {
          after_photo_url?: string | null
          audio_url?: string | null
          autor_display_name?: string
          autor_id?: string | null
          bairro?: string | null
          categoria?: Database["public"]["Enums"]["complaint_category"] | null
          cidade?: string | null
          comment_count?: number
          corpo?: string | null
          cover_url?: string | null
          created_at?: string
          device_id?: string | null
          dislike_count?: number
          enquete_opcoes?: Json | null
          id?: string
          is_anonimo?: boolean
          is_official?: boolean
          like_count?: number
          media_urls?: string[]
          moderation_note?: string | null
          official_response?: string | null
          official_response_date?: string | null
          prefeitura_id?: string | null
          promise_deadline?: string | null
          promise_text?: string | null
          published_at?: string | null
          selo?: Database["public"]["Enums"]["post_selo"] | null
          selo_em?: string | null
          selo_por?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          status_denuncia?:
            | Database["public"]["Enums"]["complaint_status"]
            | null
          support_count?: number
          tipo: Database["public"]["Enums"]["post_tipo"]
          titulo: string
          uf?: string | null
          updated_at?: string
          video_url?: string | null
          weekly_support_count?: number
        }
        Update: {
          after_photo_url?: string | null
          audio_url?: string | null
          autor_display_name?: string
          autor_id?: string | null
          bairro?: string | null
          categoria?: Database["public"]["Enums"]["complaint_category"] | null
          cidade?: string | null
          comment_count?: number
          corpo?: string | null
          cover_url?: string | null
          created_at?: string
          device_id?: string | null
          dislike_count?: number
          enquete_opcoes?: Json | null
          id?: string
          is_anonimo?: boolean
          is_official?: boolean
          like_count?: number
          media_urls?: string[]
          moderation_note?: string | null
          official_response?: string | null
          official_response_date?: string | null
          prefeitura_id?: string | null
          promise_deadline?: string | null
          promise_text?: string | null
          published_at?: string | null
          selo?: Database["public"]["Enums"]["post_selo"] | null
          selo_em?: string | null
          selo_por?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          status_denuncia?:
            | Database["public"]["Enums"]["complaint_status"]
            | null
          support_count?: number
          tipo?: Database["public"]["Enums"]["post_tipo"]
          titulo?: string
          uf?: string | null
          updated_at?: string
          video_url?: string | null
          weekly_support_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
      prefeitura_avaliacoes: {
        Row: {
          comentario: string | null
          created_at: string
          id: string
          is_anonimo: boolean
          prefeitura_id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          id?: string
          is_anonimo?: boolean
          prefeitura_id: string
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          id?: string
          is_anonimo?: boolean
          prefeitura_id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prefeitura_avaliacoes_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
      prefeituras: {
        Row: {
          brasao_url: string | null
          cidade: string
          created_at: string
          foto_url: string | null
          id: string
          mandato_fim: string | null
          mandato_inicio: string | null
          prefeito_nome: string | null
          prefeito_partido: string | null
          rating_avg: number
          rating_count: number
          slug: string
          uf: string
          updated_at: string
        }
        Insert: {
          brasao_url?: string | null
          cidade: string
          created_at?: string
          foto_url?: string | null
          id?: string
          mandato_fim?: string | null
          mandato_inicio?: string | null
          prefeito_nome?: string | null
          prefeito_partido?: string | null
          rating_avg?: number
          rating_count?: number
          slug: string
          uf: string
          updated_at?: string
        }
        Update: {
          brasao_url?: string | null
          cidade?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          mandato_fim?: string | null
          mandato_inicio?: string | null
          prefeito_nome?: string | null
          prefeito_partido?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          default_city: string | null
          default_uf: string | null
          display_name: string
          is_vereador: boolean
          lgpd_accepted_at: string | null
          notify_city_optin: boolean
          phone_e164: string | null
          phone_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          default_city?: string | null
          default_uf?: string | null
          display_name: string
          is_vereador?: boolean
          lgpd_accepted_at?: string | null
          notify_city_optin?: boolean
          phone_e164?: string | null
          phone_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          default_city?: string | null
          default_uf?: string | null
          display_name?: string
          is_vereador?: boolean
          lgpd_accepted_at?: string | null
          notify_city_optin?: boolean
          phone_e164?: string | null
          phone_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_dispatch_log: {
        Row: {
          created_at: string
          erro: string | null
          group_jid: string
          id: string
          kind: string
          ref_id: string
          status: string
          tentativas: number
        }
        Insert: {
          created_at?: string
          erro?: string | null
          group_jid: string
          id?: string
          kind: string
          ref_id: string
          status: string
          tentativas?: number
        }
        Update: {
          created_at?: string
          erro?: string | null
          group_jid?: string
          id?: string
          kind?: string
          ref_id?: string
          status?: string
          tentativas?: number
        }
        Relationships: []
      }
      whatsapp_groups: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          jid: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          jid: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          jid?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      post_comments_public: {
        Row: {
          autor_display_name: string | null
          autor_id: string | null
          conteudo: string | null
          created_at: string | null
          id: string | null
          is_anonimo: boolean | null
          is_hidden: boolean | null
          parent_id: string | null
          post_id: string | null
        }
        Insert: {
          autor_display_name?: never
          autor_id?: never
          conteudo?: string | null
          created_at?: string | null
          id?: string | null
          is_anonimo?: boolean | null
          is_hidden?: boolean | null
          parent_id?: string | null
          post_id?: string | null
        }
        Update: {
          autor_display_name?: never
          autor_id?: never
          conteudo?: string | null
          created_at?: string | null
          id?: string | null
          is_anonimo?: boolean | null
          is_hidden?: boolean | null
          parent_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_public: {
        Row: {
          after_photo_url: string | null
          audio_url: string | null
          autor_display_name: string | null
          autor_id: string | null
          bairro: string | null
          categoria: Database["public"]["Enums"]["complaint_category"] | null
          cidade: string | null
          comment_count: number | null
          corpo: string | null
          cover_url: string | null
          created_at: string | null
          dislike_count: number | null
          enquete_opcoes: Json | null
          id: string | null
          is_anonimo: boolean | null
          is_official: boolean | null
          like_count: number | null
          media_urls: string[] | null
          moderation_note: string | null
          official_response: string | null
          official_response_date: string | null
          prefeitura_id: string | null
          promise_deadline: string | null
          promise_text: string | null
          published_at: string | null
          selo: Database["public"]["Enums"]["post_selo"] | null
          selo_em: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          status_denuncia:
            | Database["public"]["Enums"]["complaint_status"]
            | null
          support_count: number | null
          tipo: Database["public"]["Enums"]["post_tipo"] | null
          titulo: string | null
          uf: string | null
          updated_at: string | null
          video_url: string | null
          weekly_support_count: number | null
        }
        Insert: {
          after_photo_url?: string | null
          audio_url?: string | null
          autor_display_name?: never
          autor_id?: never
          bairro?: string | null
          categoria?: Database["public"]["Enums"]["complaint_category"] | null
          cidade?: string | null
          comment_count?: number | null
          corpo?: string | null
          cover_url?: string | null
          created_at?: string | null
          dislike_count?: number | null
          enquete_opcoes?: Json | null
          id?: string | null
          is_anonimo?: boolean | null
          is_official?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          moderation_note?: string | null
          official_response?: string | null
          official_response_date?: string | null
          prefeitura_id?: string | null
          promise_deadline?: string | null
          promise_text?: string | null
          published_at?: string | null
          selo?: Database["public"]["Enums"]["post_selo"] | null
          selo_em?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          status_denuncia?:
            | Database["public"]["Enums"]["complaint_status"]
            | null
          support_count?: number | null
          tipo?: Database["public"]["Enums"]["post_tipo"] | null
          titulo?: string | null
          uf?: string | null
          updated_at?: string | null
          video_url?: string | null
          weekly_support_count?: number | null
        }
        Update: {
          after_photo_url?: string | null
          audio_url?: string | null
          autor_display_name?: never
          autor_id?: never
          bairro?: string | null
          categoria?: Database["public"]["Enums"]["complaint_category"] | null
          cidade?: string | null
          comment_count?: number | null
          corpo?: string | null
          cover_url?: string | null
          created_at?: string | null
          dislike_count?: number | null
          enquete_opcoes?: Json | null
          id?: string | null
          is_anonimo?: boolean | null
          is_official?: boolean | null
          like_count?: number | null
          media_urls?: string[] | null
          moderation_note?: string | null
          official_response?: string | null
          official_response_date?: string | null
          prefeitura_id?: string | null
          promise_deadline?: string | null
          promise_text?: string | null
          published_at?: string | null
          selo?: Database["public"]["Enums"]["post_selo"] | null
          selo_em?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          status_denuncia?:
            | Database["public"]["Enums"]["complaint_status"]
            | null
          support_count?: number | null
          tipo?: Database["public"]["Enums"]["post_tipo"] | null
          titulo?: string | null
          uf?: string | null
          updated_at?: string | null
          video_url?: string | null
          weekly_support_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
      prefeitura_avaliacoes_public: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string | null
          is_anonimo: boolean | null
          prefeitura_id: string | null
          stars: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string | null
          is_anonimo?: boolean | null
          prefeitura_id?: string | null
          stars?: number | null
          updated_at?: string | null
          user_id?: never
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string | null
          is_anonimo?: boolean | null
          prefeitura_id?: string | null
          stars?: number | null
          updated_at?: string | null
          user_id?: never
        }
        Relationships: [
          {
            foreignKeyName: "prefeitura_avaliacoes_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      close_expired_polls: { Args: never; Returns: number }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string
          cpf: string
          created_at: string
          default_city: string
          default_uf: string
          display_name: string
          is_vereador: boolean
          lgpd_accepted_at: string
          notify_city_optin: boolean
          phone_e164: string
          phone_verified: boolean
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_banned: { Args: { _user_id: string }; Returns: boolean }
      validar_cpf: { Args: { _cpf: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      complaint_category:
        | "saude"
        | "seguranca"
        | "infraestrutura"
        | "educacao"
        | "transporte"
        | "saneamento"
        | "iluminacao"
        | "meio_ambiente"
        | "outros"
      complaint_status: "pendente" | "em_analise" | "respondido" | "resolvido"
      post_selo: "resolvido_magrao" | "em_andamento" | "encaminhado_camara"
      post_status: "pendente" | "aprovado" | "rejeitado"
      post_tipo: "noticia" | "projeto" | "enquete" | "denuncia" | "discussao"
      reaction_tipo: "like" | "dislike" | "fire" | "angry"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "user"],
      complaint_category: [
        "saude",
        "seguranca",
        "infraestrutura",
        "educacao",
        "transporte",
        "saneamento",
        "iluminacao",
        "meio_ambiente",
        "outros",
      ],
      complaint_status: ["pendente", "em_analise", "respondido", "resolvido"],
      post_selo: ["resolvido_magrao", "em_andamento", "encaminhado_camara"],
      post_status: ["pendente", "aprovado", "rejeitado"],
      post_tipo: ["noticia", "projeto", "enquete", "denuncia", "discussao"],
      reaction_tipo: ["like", "dislike", "fire", "angry"],
    },
  },
} as const
