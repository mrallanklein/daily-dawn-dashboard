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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      contact_interactions: {
        Row: {
          body: string
          contact_id: string
          created_at: string
          id: string
          kind: string
          occurred_on: string
          user_id: string
        }
        Insert: {
          body: string
          contact_id: string
          created_at?: string
          id?: string
          kind?: string
          occurred_on?: string
          user_id: string
        }
        Update: {
          body?: string
          contact_id?: string
          created_at?: string
          id?: string
          kind?: string
          occurred_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          last_contact_date: string | null
          notes: string | null
          phone: string | null
          role: string | null
          source: string | null
          status: string
          tags: string[]
          updated_at: string
          user_id: string
          workspace: string
        }
        Insert: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id: string
          workspace?: string
        }
        Update: {
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          workspace?: string
        }
        Relationships: []
      }
      notes_items: {
        Row: {
          checked: boolean
          content: string
          created_at: string
          due_date: string | null
          id: string
          parent_id: string | null
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          checked?: boolean
          content?: string
          created_at?: string
          due_date?: string | null
          id?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          checked?: boolean
          content?: string
          created_at?: string
          due_date?: string | null
          id?: string
          parent_id?: string | null
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "notes_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alias_avatar_url: string | null
          alias_name: string | null
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          weather_city: string
          weather_lat: number
          weather_lon: number
        }
        Insert: {
          alias_avatar_url?: string | null
          alias_name?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
          weather_city?: string
          weather_lat?: number
          weather_lon?: number
        }
        Update: {
          alias_avatar_url?: string | null
          alias_name?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          weather_city?: string
          weather_lat?: number
          weather_lon?: number
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          budget_spent: number
          category: string | null
          client: string | null
          color: string
          contact_id: string | null
          cover_url: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          local_folder: string | null
          name: string
          next_step: string | null
          onedrive_url: string | null
          position: number
          priority: string
          progress: number
          start_date: string | null
          status: string
          tags: string[]
          updated_at: string
          user_id: string
          work_date: string | null
          workspace: string
        }
        Insert: {
          budget?: number | null
          budget_spent?: number
          category?: string | null
          client?: string | null
          color?: string
          contact_id?: string | null
          cover_url?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          local_folder?: string | null
          name: string
          next_step?: string | null
          onedrive_url?: string | null
          position?: number
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id: string
          work_date?: string | null
          workspace?: string
        }
        Update: {
          budget?: number | null
          budget_spent?: number
          category?: string | null
          client?: string | null
          color?: string
          contact_id?: string | null
          cover_url?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          local_folder?: string | null
          name?: string
          next_step?: string | null
          onedrive_url?: string | null
          position?: number
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          work_date?: string | null
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          calendar_ids: string[]
          created_at: string
          id: string
          mail_accounts: string[]
          name: string
          position: number
          slug: string
          tag: string
          updated_at: string
          user_id: string
          weather_city: string
          weather_lat: number
          weather_lon: number
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          calendar_ids?: string[]
          created_at?: string
          id?: string
          mail_accounts?: string[]
          name: string
          position?: number
          slug: string
          tag?: string
          updated_at?: string
          user_id: string
          weather_city?: string
          weather_lat?: number
          weather_lon?: number
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          calendar_ids?: string[]
          created_at?: string
          id?: string
          mail_accounts?: string[]
          name?: string
          position?: number
          slug?: string
          tag?: string
          updated_at?: string
          user_id?: string
          weather_city?: string
          weather_lat?: number
          weather_lon?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          parent_task_id: string | null
          position: number
          priority: string
          project_id: string | null
          scheduled_date: string | null
          start_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: string
          project_id?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: string
          project_id?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          permission: string
          role: string | null
          status: string
          updated_at: string
          user_id: string
          workspace: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          permission?: string
          role?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          permission?: string
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          invoice_number: string | null
          invoice_url: string | null
          kind: string
          occurred_on: string
          project_id: string | null
          status: string
          updated_at: string
          user_id: string
          workspace: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          kind?: string
          occurred_on?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          kind?: string
          occurred_on?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
