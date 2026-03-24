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
      apartments: {
        Row: {
          address: string
          available_date: string
          bathrooms: number
          city: string
          coordinates: number[] | null
          created_at: string
          description: string
          floor: number | null
          has_ac: boolean
          has_balcony: boolean
          has_elevator: boolean
          has_garden: boolean
          has_gym: boolean
          has_laundry: boolean
          has_parking: boolean
          has_rooftop: boolean
          has_security: boolean
          has_wifi: boolean
          id: string
          images: string[]
          is_furnished: boolean
          neighborhood: string
          pet_friendly: boolean
          price: number
          room_description: string
          room_type: string
          rooms: number
          size: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string
          available_date?: string
          bathrooms?: number
          city?: string
          coordinates?: number[] | null
          created_at?: string
          description?: string
          floor?: number | null
          has_ac?: boolean
          has_balcony?: boolean
          has_elevator?: boolean
          has_garden?: boolean
          has_gym?: boolean
          has_laundry?: boolean
          has_parking?: boolean
          has_rooftop?: boolean
          has_security?: boolean
          has_wifi?: boolean
          id?: string
          images?: string[]
          is_furnished?: boolean
          neighborhood?: string
          pet_friendly?: boolean
          price?: number
          room_description?: string
          room_type?: string
          rooms?: number
          size?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          available_date?: string
          bathrooms?: number
          city?: string
          coordinates?: number[] | null
          created_at?: string
          description?: string
          floor?: number | null
          has_ac?: boolean
          has_balcony?: boolean
          has_elevator?: boolean
          has_garden?: boolean
          has_gym?: boolean
          has_laundry?: boolean
          has_parking?: boolean
          has_rooftop?: boolean
          has_security?: boolean
          has_wifi?: boolean
          id?: string
          images?: string[]
          is_furnished?: boolean
          neighborhood?: string
          pet_friendly?: boolean
          price?: number
          room_description?: string
          room_type?: string
          rooms?: number
          size?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_hours: string
          age: number | null
          alcohol: string
          avatar_url: string | null
          bio: string
          budget: number
          city: string
          cleanliness: number
          cleanliness_expectations: number
          cooking_habits: string
          created_at: string
          desired_room_type: string
          fitness: string
          gender_preference: string
          guests: string
          id: string
          lifestyle_similarity: string
          lifestyle_vibe: string
          name: string
          noise_level: number
          occupation: string
          onboarding_complete: boolean
          partying: string
          pets: boolean
          preferred_age_max: number
          preferred_age_min: number
          religious_level: string
          shared_space_org: string
          sleep_schedule: string
          smoking: boolean
          social_level: number
          updated_at: string
          user_id: string
          wfh: boolean
        }
        Insert: {
          activity_hours?: string
          age?: number | null
          alcohol?: string
          avatar_url?: string | null
          bio?: string
          budget?: number
          city?: string
          cleanliness?: number
          cleanliness_expectations?: number
          cooking_habits?: string
          created_at?: string
          desired_room_type?: string
          fitness?: string
          gender_preference?: string
          guests?: string
          id?: string
          lifestyle_similarity?: string
          lifestyle_vibe?: string
          name?: string
          noise_level?: number
          occupation?: string
          onboarding_complete?: boolean
          partying?: string
          pets?: boolean
          preferred_age_max?: number
          preferred_age_min?: number
          religious_level?: string
          shared_space_org?: string
          sleep_schedule?: string
          smoking?: boolean
          social_level?: number
          updated_at?: string
          user_id: string
          wfh?: boolean
        }
        Update: {
          activity_hours?: string
          age?: number | null
          alcohol?: string
          avatar_url?: string | null
          bio?: string
          budget?: number
          city?: string
          cleanliness?: number
          cleanliness_expectations?: number
          cooking_habits?: string
          created_at?: string
          desired_room_type?: string
          fitness?: string
          gender_preference?: string
          guests?: string
          id?: string
          lifestyle_similarity?: string
          lifestyle_vibe?: string
          name?: string
          noise_level?: number
          occupation?: string
          onboarding_complete?: boolean
          partying?: string
          pets?: boolean
          preferred_age_max?: number
          preferred_age_min?: number
          religious_level?: string
          shared_space_org?: string
          sleep_schedule?: string
          smoking?: boolean
          social_level?: number
          updated_at?: string
          user_id?: string
          wfh?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
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
