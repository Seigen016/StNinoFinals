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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Admin: {
        Row: {
          created_at: string
          Email: string | null
          id: number
          Name: string | null
          Password: string | null
          "RFID-id": string | null
        }
        Insert: {
          created_at?: string
          Email?: string | null
          id?: number
          Name?: string | null
          Password?: string | null
          "RFID-id"?: string | null
        }
        Update: {
          created_at?: string
          Email?: string | null
          id?: number
          Name?: string | null
          Password?: string | null
          "RFID-id"?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          published_at: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          published_at?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          location: string | null
          notes: string | null
          rfid_card: string | null
          rfid_tag: string | null
          scan_datetime: string | null
          scan_time: string | null
          scan_type: string
          status: string | null
          student_id: string | null
          temperature: number | null
          time_in: string | null
          time_out: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          rfid_card?: string | null
          rfid_tag?: string | null
          scan_datetime?: string | null
          scan_time?: string | null
          scan_type: string
          status?: string | null
          student_id?: string | null
          temperature?: number | null
          time_in?: string | null
          time_out?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          rfid_card?: string | null
          rfid_tag?: string | null
          scan_datetime?: string | null
          scan_time?: string | null
          scan_type?: string
          status?: string | null
          student_id?: string | null
          temperature?: number | null
          time_in?: string | null
          time_out?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      class_enrollments: {
        Row: {
          class_id: string
          created_at: string | null
          enrollment_date: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          enrollment_date: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          enrollment_date?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          class_name: string
          created_at: string | null
          description: string | null
          grade_level: string | null
          id: string
          is_active: boolean | null
          room: string | null
          schedule: string | null
          school_year: string
          section: string | null
          semester: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_code: string
          class_name: string
          created_at?: string | null
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          room?: string | null
          schedule?: string | null
          school_year: string
          section?: string | null
          semester: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_code?: string
          class_name?: string
          created_at?: string | null
          description?: string | null
          grade_level?: string | null
          id?: string
          is_active?: boolean | null
          room?: string | null
          schedule?: string | null
          school_year?: string
          section?: string | null
          semester?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          alternate_phone: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_primary_contact: boolean | null
          last_name: string
          middle_name: string | null
          occupation: string | null
          phone_number: string
          relationship: string
          sms_notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_primary_contact?: boolean | null
          last_name: string
          middle_name?: string | null
          occupation?: string | null
          phone_number: string
          relationship: string
          sms_notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_primary_contact?: boolean | null
          last_name?: string
          middle_name?: string | null
          occupation?: string | null
          phone_number?: string
          relationship?: string
          sms_notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rfid_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string
          device_type: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          location: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          location: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          location?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_notification_logs: {
        Row: {
          id: string
          message: string
          notification_id: string
          phone_number: string
          response_data: Json | null
          sent_at: string | null
          status: string
        }
        Insert: {
          id?: string
          message: string
          notification_id: string
          phone_number: string
          response_data?: Json | null
          sent_at?: string | null
          status: string
        }
        Update: {
          id?: string
          message?: string
          notification_id?: string
          phone_number?: string
          response_data?: Json | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notification_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "sms_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_notifications: {
        Row: {
          attendance_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          notification_type: string
          parent_id: string
          phone_number: string
          retry_count: number | null
          sent_at: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          attendance_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          notification_type: string
          parent_id: string
          phone_number: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          attendance_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          notification_type?: string
          parent_id?: string
          phone_number?: string
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          can_pickup: boolean | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          parent_id: string
          relationship_type: string
          student_id: string
        }
        Insert: {
          can_pickup?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id: string
          relationship_type: string
          student_id: string
        }
        Update: {
          can_pickup?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string
          relationship_type?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          blood_type: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string
          email: string | null
          emergency_contact: string | null
          enrollment_date: string
          first_name: string
          gender: string
          grade_level: string
          id: string
          last_name: string
          medical_notes: string | null
          middle_name: string | null
          Password: string | null
          phone_number: string | null
          photo_url: string | null
          province: string | null
          rfid_card: string | null
          rfid_tag: string
          section: string | null
          status: string | null
          student_number: string
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact?: string | null
          enrollment_date: string
          first_name: string
          gender: string
          grade_level: string
          id?: string
          last_name: string
          medical_notes?: string | null
          middle_name?: string | null
          Password?: string | null
          phone_number?: string | null
          photo_url?: string | null
          province?: string | null
          rfid_card?: string | null
          rfid_tag: string
          section?: string | null
          status?: string | null
          student_number: string
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact?: string | null
          enrollment_date?: string
          first_name?: string
          gender?: string
          grade_level?: string
          id?: string
          last_name?: string
          medical_notes?: string | null
          middle_name?: string | null
          Password?: string | null
          phone_number?: string | null
          photo_url?: string | null
          province?: string | null
          rfid_card?: string | null
          rfid_tag?: string
          section?: string | null
          status?: string | null
          student_number?: string
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          date_hired: string | null
          department: string | null
          email: string
          employee_number: string
          first_name: string
          id: string
          last_name: string
          middle_name: string | null
          Password: string | null
          phone_number: string | null
          rfid_card: string | null
          rfid_tag: string | null
          specialization: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_hired?: string | null
          department?: string | null
          email: string
          employee_number: string
          first_name: string
          id?: string
          last_name: string
          middle_name?: string | null
          Password?: string | null
          phone_number?: string | null
          rfid_card?: string | null
          rfid_tag?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_hired?: string | null
          department?: string | null
          email?: string
          employee_number?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          Password?: string | null
          phone_number?: string | null
          rfid_card?: string | null
          rfid_tag?: string | null
          specialization?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          role: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: { Args: { params?: Json; query_text: string }; Returns: Json }
      get_attendance_records: {
        Args: { record_limit?: number; since_time?: string }
        Returns: {
          created_at: string
          device_id: string
          id: string
          rfid_card: string
          rfid_tag: string
          scan_time: string
          scan_type: string
          status: string
          student_id: string
          time_in: string
          time_out: string
        }[]
      }
      get_student_attendance_summary: {
        Args: { end_date: string; start_date: string; student_uuid: string }
        Returns: {
          absent_days: number
          attendance_rate: number
          late_days: number
          present_days: number
          total_days: number
        }[]
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
