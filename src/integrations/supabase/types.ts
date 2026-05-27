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
      apartment_views: {
        Row: {
          apartment_id: string
          id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          apartment_id: string
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          apartment_id?: string
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartment_views_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          address: string
          available_date: string
          bathrooms: number
          city: string
          coordinates: number[] | null
          created_at: string
          description: string
          featured_until: string | null
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
          is_featured: boolean
          is_furnished: boolean
          neighborhood: string
          pet_friendly: boolean
          price: number
          room_description: string
          listing_type: string
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
          featured_until?: string | null
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
          is_featured?: boolean
          is_furnished?: boolean
          neighborhood?: string
          listing_type?: string
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
          featured_until?: string | null
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
          is_featured?: boolean
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
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
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
      liked_profiles: {
        Row: {
          created_at: string
          id: string
          liked_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_user_id?: string
          user_id?: string
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
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: []
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
          gender: string | null
          gender_preference: string
          gold_boost_used_at: string | null
          guests: string
          highlighted_until: string | null
          id: string
          instant_message_credits: number
          is_admin: boolean
          is_banned: boolean
          lifestyle_similarity: string
          lifestyle_vibe: string
          move_in_date: string | null
          name: string
          neighborhood: string
          noise_level: number
          notify_on_match: boolean
          notify_on_message: boolean
          notify_on_squad_invite: boolean
          occupation: string
          onboarding_complete: boolean
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          partying: string
          pet_preference: string
          pets: boolean
          phone_number: string | null
          phone_verified: boolean
          photos: string[]
          platinum_boost_used_at_1: string | null
          platinum_boost_used_at_2: string | null
          platinum_boost_used_at_3: string | null
          preferred_age_max: number
          preferred_age_min: number
          profile_visibility: string | null
          religious_level: string
          shared_space_org: string
          sleep_schedule: string
          smoking: boolean
          smoking_preference: string
          social_level: number
          subscription_expires_at: string | null
          subscription_tier: string
          updated_at: string
          user_id: string
          weekly_boosts_remaining: number
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
          gender?: string | null
          gender_preference?: string
          gold_boost_used_at?: string | null
          guests?: string
          highlighted_until?: string | null
          id?: string
          instant_message_credits?: number
          is_admin?: boolean
          is_banned?: boolean
          lifestyle_similarity?: string
          lifestyle_vibe?: string
          move_in_date?: string | null
          name?: string
          neighborhood?: string
          noise_level?: number
          notify_on_match?: boolean
          notify_on_message?: boolean
          notify_on_squad_invite?: boolean
          occupation?: string
          onboarding_complete?: boolean
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          partying?: string
          pet_preference?: string
          pets?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          photos?: string[]
          platinum_boost_used_at_1?: string | null
          platinum_boost_used_at_2?: string | null
          platinum_boost_used_at_3?: string | null
          preferred_age_max?: number
          preferred_age_min?: number
          profile_visibility?: string | null
          religious_level?: string
          shared_space_org?: string
          sleep_schedule?: string
          smoking?: boolean
          smoking_preference?: string
          social_level?: number
          subscription_expires_at?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id: string
          weekly_boosts_remaining?: number
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
          gender?: string | null
          gender_preference?: string
          gold_boost_used_at?: string | null
          guests?: string
          highlighted_until?: string | null
          id?: string
          instant_message_credits?: number
          is_admin?: boolean
          is_banned?: boolean
          lifestyle_similarity?: string
          lifestyle_vibe?: string
          move_in_date?: string | null
          name?: string
          neighborhood?: string
          noise_level?: number
          notify_on_match?: boolean
          notify_on_message?: boolean
          notify_on_squad_invite?: boolean
          occupation?: string
          onboarding_complete?: boolean
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          partying?: string
          pet_preference?: string
          pets?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          photos?: string[]
          platinum_boost_used_at_1?: string | null
          platinum_boost_used_at_2?: string | null
          platinum_boost_used_at_3?: string | null
          preferred_age_max?: number
          preferred_age_min?: number
          profile_visibility?: string | null
          religious_level?: string
          shared_space_org?: string
          sleep_schedule?: string
          smoking?: boolean
          smoking_preference?: string
          social_level?: number
          subscription_expires_at?: string | null
          subscription_tier?: string
          updated_at?: string
          user_id?: string
          weekly_boosts_remaining?: number
          wfh?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saved_apartments: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_apartments_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_invites: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string
          squad_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id: string
          squad_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          squad_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_invites_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_likes: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          liked: boolean
          squad_id: string
          user_id: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          liked?: boolean
          squad_id: string
          user_id: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          liked?: boolean
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_likes_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_likes_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          squad_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          squad_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          squad_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          squad_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          squad_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          squad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_messages_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          budget_max: number
          budget_min: number
          created_at: string
          creator_id: string
          id: string
          min_cleanliness: number
          name: string
          no_smoking: boolean
          pet_friendly: boolean
          preferred_locations: string[]
          status: string
          target_size: number
          updated_at: string
        }
        Insert: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          creator_id: string
          id?: string
          min_cleanliness?: number
          name?: string
          no_smoking?: boolean
          pet_friendly?: boolean
          preferred_locations?: string[]
          status?: string
          target_size?: number
          updated_at?: string
        }
        Update: {
          budget_max?: number
          budget_min?: number
          created_at?: string
          creator_id?: string
          id?: string
          min_cleanliness?: number
          name?: string
          no_smoking?: boolean
          pet_friendly?: boolean
          preferred_locations?: string[]
          status?: string
          target_size?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
        }
        Insert: {
          event_type: string
          id: string
          processed_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          activity_hours: string | null
          age: number | null
          alcohol: string | null
          avatar_url: string | null
          bio: string | null
          budget: number | null
          city: string | null
          cleanliness: number | null
          cleanliness_expectations: number | null
          cooking_habits: string | null
          created_at: string | null
          desired_room_type: string | null
          fitness: string | null
          gender_preference: string | null
          guests: string | null
          lifestyle_similarity: string | null
          lifestyle_vibe: string | null
          name: string | null
          noise_level: number | null
          occupation: string | null
          onboarding_complete: boolean | null
          partying: string | null
          pets: boolean | null
          phone_verified: boolean | null
          photos: string[] | null
          preferred_age_max: number | null
          preferred_age_min: number | null
          religious_level: string | null
          shared_space_org: string | null
          sleep_schedule: string | null
          smoking: boolean | null
          social_level: number | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
          wfh: boolean | null
        }
        Insert: {
          activity_hours?: string | null
          age?: number | null
          alcohol?: string | null
          avatar_url?: string | null
          bio?: string | null
          budget?: number | null
          city?: string | null
          cleanliness?: number | null
          cleanliness_expectations?: number | null
          cooking_habits?: string | null
          created_at?: string | null
          desired_room_type?: string | null
          fitness?: string | null
          gender_preference?: string | null
          guests?: string | null
          lifestyle_similarity?: string | null
          lifestyle_vibe?: string | null
          name?: string | null
          noise_level?: number | null
          occupation?: string | null
          onboarding_complete?: boolean | null
          partying?: string | null
          pets?: boolean | null
          phone_verified?: boolean | null
          photos?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          religious_level?: string | null
          shared_space_org?: string | null
          sleep_schedule?: string | null
          smoking?: boolean | null
          social_level?: number | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          wfh?: boolean | null
        }
        Update: {
          activity_hours?: string | null
          age?: number | null
          alcohol?: string | null
          avatar_url?: string | null
          bio?: string | null
          budget?: number | null
          city?: string | null
          cleanliness?: number | null
          cleanliness_expectations?: number | null
          cooking_habits?: string | null
          created_at?: string | null
          desired_room_type?: string | null
          fitness?: string | null
          gender_preference?: string | null
          guests?: string | null
          lifestyle_similarity?: string | null
          lifestyle_vibe?: string | null
          name?: string | null
          noise_level?: number | null
          occupation?: string | null
          onboarding_complete?: boolean | null
          partying?: string | null
          pets?: boolean | null
          phone_verified?: boolean | null
          photos?: string[] | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          religious_level?: string | null
          shared_space_org?: string | null
          sleep_schedule?: string | null
          smoking?: boolean | null
          social_level?: number | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          wfh?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      call_email_function: { Args: { payload: Json }; Returns: undefined }
      call_notify_function: { Args: { payload: Json }; Returns: undefined }
      create_conversation_with_participant: {
        Args: { other_user_id: string }
        Returns: string
      }
      find_or_create_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      increment_instant_message_credits: {
        Args: { p_amount?: number; p_user_id: string }
        Returns: undefined
      }
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_squad_creator: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
      is_squad_member: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
      mark_phone_verified: {
        Args: { p_phone: string; p_user_id: string }
        Returns: undefined
      }
      use_free_boost: { Args: { p_apartment_id: string }; Returns: Json }
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
