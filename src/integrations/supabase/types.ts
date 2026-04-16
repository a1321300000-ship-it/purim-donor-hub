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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bachurim: {
        Row: {
          address: string
          city: string
          created_at: string
          father_name: string
          floor: string
          full_name: string
          id: number
          is_new: boolean
          notes: string
          phone: string
          shiur: string
          title: string
          updated_at: string
          yeshiva: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          father_name?: string
          floor?: string
          full_name?: string
          id?: never
          is_new?: boolean
          notes?: string
          phone?: string
          shiur?: string
          title?: string
          updated_at?: string
          yeshiva?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          father_name?: string
          floor?: string
          full_name?: string
          id?: never
          is_new?: boolean
          notes?: string
          phone?: string
          shiur?: string
          title?: string
          updated_at?: string
          yeshiva?: string
        }
        Relationships: []
      }
      donor_groups: {
        Row: {
          created_at: string
          id: number
          name: string
          task_type: string
          transport_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          name?: string
          task_type?: string
          transport_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          task_type?: string
          transport_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      donors: {
        Row: {
          address: string
          archived_at: string | null
          city: string
          created_at: string
          donation_notes: Json
          donations: Json
          father_name: string
          floor: string
          full_name: string
          house_number: string
          id: number
          is_new: boolean
          notes: string
          phone: string
          title: string
          updated_at: string
        }
        Insert: {
          address?: string
          archived_at?: string | null
          city?: string
          created_at?: string
          donation_notes?: Json
          donations?: Json
          father_name?: string
          floor?: string
          full_name?: string
          house_number?: string
          id?: never
          is_new?: boolean
          notes?: string
          phone?: string
          title?: string
          updated_at?: string
        }
        Update: {
          address?: string
          archived_at?: string | null
          city?: string
          created_at?: string
          donation_notes?: Json
          donations?: Json
          father_name?: string
          floor?: string
          full_name?: string
          house_number?: string
          id?: never
          is_new?: boolean
          notes?: string
          phone?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_bachur_assignments: {
        Row: {
          bachur_id: number
          created_at: string
          group_id: number
          id: number
        }
        Insert: {
          bachur_id: number
          created_at?: string
          group_id: number
          id?: never
        }
        Update: {
          bachur_id?: number
          created_at?: string
          group_id?: number
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "group_bachur_assignments_bachur_id_fkey"
            columns: ["bachur_id"]
            isOneToOne: false
            referencedRelation: "bachurim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_bachur_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "donor_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          donor_id: number
          group_id: number
          id: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          donor_id: number
          group_id: number
          id?: never
          sort_order?: number
        }
        Update: {
          created_at?: string
          donor_id?: number
          group_id?: number
          id?: never
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_members_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "donor_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      select_options: {
        Row: {
          created_at: string
          id: string
          list_name: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_name: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          list_name?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_bachur_sequence: { Args: never; Returns: undefined }
      reset_donor_sequence: { Args: never; Returns: undefined }
      reset_group_sequence: { Args: never; Returns: undefined }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
