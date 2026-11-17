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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          active_round: string
          competition_day_mode: boolean
          id: number
          locked_rounds: string[]
          number_of_teams: number
          team_submissions_locked: boolean
        }
        Insert: {
          active_round?: string
          competition_day_mode?: boolean
          id?: number
          locked_rounds?: string[]
          number_of_teams?: number
          team_submissions_locked?: boolean
        }
        Update: {
          active_round?: string
          competition_day_mode?: boolean
          id?: number
          locked_rounds?: string[]
          number_of_teams?: number
          team_submissions_locked?: boolean
        }
        Relationships: []
      }
      attendees: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          organization: string | null
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organization?: string | null
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organization?: string | null
        }
        Relationships: []
      }
      judge_assignments: {
        Row: {
          created_at: string
          id: string
          judge_email: string
          judge_name: string
          round: string
          team_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          judge_email: string
          judge_name: string
          round: string
          team_number: number
        }
        Update: {
          created_at?: string
          id?: string
          judge_email?: string
          judge_name?: string
          round?: string
          team_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "judge_assignments_team_number_fkey"
            columns: ["team_number"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_number"]
          },
        ]
      }
      judges: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          category_scores: Json
          created_at: string
          id: string
          judge_email: string
          judge_name: string
          round: string
          team_number: number
          total_score: number
        }
        Insert: {
          category_scores?: Json
          created_at?: string
          id?: string
          judge_email: string
          judge_name: string
          round: string
          team_number: number
          total_score?: number
        }
        Update: {
          category_scores?: Json
          created_at?: string
          id?: string
          judge_email?: string
          judge_name?: string
          round?: string
          team_number?: number
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_team_number_fkey"
            columns: ["team_number"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_number"]
          },
        ]
      }
      teams: {
        Row: {
          description: string | null
          id: string
          members: string[]
          project_name: string
          round_group: string
          submitted_at: string
          team_name: string
          team_number: number
        }
        Insert: {
          description?: string | null
          id?: string
          members?: string[]
          project_name: string
          round_group?: string
          submitted_at?: string
          team_name: string
          team_number?: number
        }
        Update: {
          description?: string | null
          id?: string
          members?: string[]
          project_name?: string
          round_group?: string
          submitted_at?: string
          team_name?: string
          team_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
