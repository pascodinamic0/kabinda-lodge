export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          category: string | null
          created_at: string
          icon_name: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          icon_name?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          icon_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string | null
          value?: Json
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          end_date: string
          id: number
          notes: string | null
          room_id: number
          start_date: string
          status: string
          total_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: number
          notes?: string | null
          room_id: number
          start_date: string
          status?: string
          total_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: number
          notes?: string | null
          room_id?: number
          start_date?: string
          status?: string
          total_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_bookings: {
        Row: {
          conference_room_id: number
          created_at: string | null
          end_datetime: string
          id: number
          notes: string | null
          start_datetime: string
          status: string
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conference_room_id: number
          created_at?: string | null
          end_datetime: string
          id?: number
          notes?: string | null
          start_datetime: string
          status?: string
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conference_room_id?: number
          created_at?: string | null
          end_datetime?: string
          id?: number
          notes?: string | null
          start_datetime?: string
          status?: string
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_bookings_conference_room_id_fkey"
            columns: ["conference_room_id"]
            isOneToOne: false
            referencedRelation: "conference_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_room_images: {
        Row: {
          alt_text: string | null
          conference_room_id: number
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
        }
        Insert: {
          alt_text?: string | null
          conference_room_id: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
        }
        Update: {
          alt_text?: string | null
          conference_room_id?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "conference_room_images_conference_room_id_fkey"
            columns: ["conference_room_id"]
            isOneToOne: false
            referencedRelation: "conference_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      conference_rooms: {
        Row: {
          capacity: number
          created_at: string | null
          description: string | null
          features: string[] | null
          hourly_rate: number
          id: number
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          hourly_rate: number
          id?: number
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          hourly_rate?: number
          id?: number
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dining_reservations: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_type: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          id: number
          party_size: number
          reservation_date: string
          reservation_time: string
          restaurant_id: number
          special_requests: string | null
          status: string
          table_id: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_type?: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          id?: number
          party_size: number
          reservation_date: string
          reservation_time: string
          restaurant_id: number
          special_requests?: string | null
          status?: string
          table_id?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_type?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          id?: number
          party_size?: number
          reservation_date?: string
          reservation_time?: string
          restaurant_id?: number
          special_requests?: string | null
          status?: string
          table_id?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dining_reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dining_reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          booking_id: number
          created_at: string
          id: string
          message: string | null
          rating: number
          user_id: string
        }
        Insert: {
          booking_id: number
          created_at?: string
          id?: string
          message?: string | null
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: number
          created_at?: string
          id?: string
          message?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          menu_item_id: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          menu_item_id: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          menu_item_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_images_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          restaurant_id: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          restaurant_id?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          restaurant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: number
          menu_item_id: number
          notes: string | null
          order_id: number
          quantity: number
        }
        Insert: {
          id?: number
          menu_item_id: number
          notes?: string | null
          order_id: number
          quantity: number
        }
        Update: {
          id?: number
          menu_item_id?: number
          notes?: string | null
          order_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          order_id: number
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id: number
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          estimated_completion_time: string | null
          id: number
          kitchen_notes: string | null
          payment_method: string | null
          status: string
          table_number: number | null
          total_price: number
          tracking_number: string
          waiter_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_completion_time?: string | null
          id?: number
          kitchen_notes?: string | null
          payment_method?: string | null
          status?: string
          table_number?: number | null
          total_price: number
          tracking_number: string
          waiter_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_completion_time?: string | null
          id?: number
          kitchen_notes?: string | null
          payment_method?: string | null
          status?: string
          table_number?: number | null
          total_price?: number
          tracking_number?: string
          waiter_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: number | null
          created_at: string
          id: number
          method: string
          order_id: number | null
          status: string
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          booking_id?: number | null
          created_at?: string
          id?: number
          method: string
          order_id?: number | null
          status?: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          booking_id?: number | null
          created_at?: string
          id?: number
          method?: string
          order_id?: number | null
          status?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number
          end_date: string
          id: number
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent: number
          end_date: string
          id?: number
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number
          end_date?: string
          id?: number
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      restaurant_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          restaurant_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          restaurant_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          restaurant_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: number
          kitchen_printer_id: string | null
          location_description: string | null
          restaurant_id: number
          status: string
          table_number: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id?: number
          kitchen_printer_id?: string | null
          location_description?: string | null
          restaurant_id: number
          status?: string
          table_number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: number
          kitchen_printer_id?: string | null
          location_description?: string | null
          restaurant_id?: number
          status?: string
          table_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string | null
          cuisine: string
          description: string | null
          id: number
          location: string
          name: string
          price_range: string
          rating: number | null
          specialties: string[] | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cuisine: string
          description?: string | null
          id?: number
          location: string
          name: string
          price_range?: string
          rating?: number | null
          specialties?: string[] | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cuisine?: string
          description?: string | null
          id?: number
          location?: string
          name?: string
          price_range?: string
          rating?: number | null
          specialties?: string[] | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          booking_id: number
          created_at: string
          id: string
          sent_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: number
          created_at?: string
          id?: string
          sent_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: number
          created_at?: string
          id?: string
          sent_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      room_amenities: {
        Row: {
          amenity_id: string
          created_at: string
          id: string
          room_id: number
        }
        Insert: {
          amenity_id: string
          created_at?: string
          id?: string
          room_id: number
        }
        Update: {
          amenity_id?: string
          created_at?: string
          id?: string
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_amenities_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          room_id: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          room_id: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          price: number
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          price: number
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          price?: number
          status?: string
          type?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          language: Database["public"]["Enums"]["language_code"]
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          language: Database["public"]["Enums"]["language_code"]
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          language?: Database["public"]["Enums"]["language_code"]
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          revoked_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          revoked_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          revoked_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          language: Database["public"]["Enums"]["language_code"]
          section: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          section: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_bookings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      handle_review_request_insert: {
        Args: { p_booking_id: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "Admin" | "Receptionist" | "RestaurantLead" | "Guest"
      language_code: "en" | "fr" | "es" | "pt" | "ar"
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
    Enums: {
      app_role: ["Admin", "Receptionist", "RestaurantLead", "Guest"],
      language_code: ["en", "fr", "es", "pt", "ar"],
    },
  },
} as const
