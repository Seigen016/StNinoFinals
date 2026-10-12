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
        Relationships: []
      }
      academic_periods: {
        Row: {
          id: string
          school_year: string
          quarter: number
          label: string
          start_date: string | null
          end_date: string | null
          is_active: boolean
          is_grading_open: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_year: string
          quarter: number
          label: string
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          is_grading_open?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_year?: string
          quarter?: number
          label?: string
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          is_grading_open?: boolean
          created_at?: string
        }
        Relationships: []
      }
      admissions: {
        Row: {
          permanent_street: string | null
          permanent_barangay: string | null
          permanent_city: string | null
          permanent_province: string | null
          current_street: string | null
          current_barangay: string | null
          current_city: string | null
          current_province: string | null
          current_address: string | null
          additional_message: string | null
          address: string | null
          address_type: string | null
          created_at: string
          date_of_birth: string | null
          email_address: string
          enrollment_type: string | null
          first_name: string
          guardian_phone: string | null
          id: number
          intended_grade_level: string
          last_name: string
          lrn: string | null
          middle_initial: string | null
          middle_name: string | null
          parent_email: string | null
          parent_name: string
          phone_number: string
          previous_school: string | null
          rejection_reason: string | null
          school_year: string | null
          status: Database["public"]["Enums"]["admission_status"] | null
          suffix: string | null
          updated_at: string | null
        }
        Insert: {
          permanent_street?: string | null
          permanent_barangay?: string | null
          permanent_city?: string | null
          permanent_province?: string | null
          current_street?: string | null
          current_barangay?: string | null
          current_city?: string | null
          current_province?: string | null
          current_address?: string | null
          additional_message?: string | null
          address?: string | null
          address_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_address: string
          enrollment_type?: string | null
          first_name: string
          guardian_phone?: string | null
          id?: number
          intended_grade_level: string
          last_name: string
          lrn?: string | null
          middle_initial?: string | null
          middle_name?: string | null
          parent_email?: string | null
          parent_name: string
          phone_number: string
          previous_school?: string | null
          rejection_reason?: string | null
          school_year?: string | null
          status?: Database["public"]["Enums"]["admission_status"] | null
          suffix?: string | null
          updated_at?: string | null
        }
        Update: {
          permanent_street?: string | null
          permanent_barangay?: string | null
          permanent_city?: string | null
          permanent_province?: string | null
          current_street?: string | null
          current_barangay?: string | null
          current_city?: string | null
          current_province?: string | null
          current_address?: string | null
          additional_message?: string | null
          address?: string | null
          address_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          email_address?: string
          enrollment_type?: string | null
          first_name?: string
          guardian_phone?: string | null
          id?: number
          intended_grade_level?: string
          last_name?: string
          lrn?: string | null
          middle_initial?: string | null
          middle_name?: string | null
          parent_email?: string | null
          parent_name?: string
          phone_number?: string
          previous_school?: string | null
          rejection_reason?: string | null
          school_year?: string | null
          status?: Database["public"]["Enums"]["admission_status"] | null
          suffix?: string | null
          updated_at?: string | null
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
        Relationships: []
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
          temperature: number | null
          time_in: string | null
          time_out: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
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
          temperature?: number | null
          time_in?: string | null
          time_out?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          temperature?: number | null
          time_in?: string | null
          time_out?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject_name: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject_name: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject_name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          quarter: number | null
          room: string | null
          schedule: string | null
          school_year: string
          section: string | null
          section_id: string | null
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
          quarter?: number | null
          room?: string | null
          schedule?: string | null
          school_year: string
          section?: string | null
          section_id?: string | null
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
          quarter?: number | null
          room?: string | null
          schedule?: string | null
          school_year?: string
          section?: string | null
          section_id?: string | null
          semester?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollment_requests: {
        Row: {
          admin_notes: string | null
          assigned_class_id: string | null
          assigned_section_id: string | null
          created_at: string
          enrollment_type: string | null
          entry_quarter: number | null
          grade_level: string
          id: string
          previous_grades_url: string | null
          previous_school: string | null
          school_year: string
          status: Database["public"]["Enums"]["enrollment_request_status"]
          strand: string | null
          student_id: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_class_id?: string | null
          assigned_section_id?: string | null
          created_at?: string
          enrollment_type?: string | null
          entry_quarter?: number | null
          grade_level: string
          id?: string
          previous_grades_url?: string | null
          previous_school?: string | null
          school_year: string
          status?: Database["public"]["Enums"]["enrollment_request_status"]
          strand?: string | null
          student_id: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_class_id?: string | null
          assigned_section_id?: string | null
          created_at?: string
          enrollment_type?: string | null
          entry_quarter?: number | null
          grade_level?: string
          id?: string
          previous_grades_url?: string | null
          previous_school?: string | null
          school_year?: string
          status?: Database["public"]["Enums"]["enrollment_request_status"]
          strand?: string | null
          student_id?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_requests_assigned_class_id_fkey"
            columns: ["assigned_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_assigned_section_id_fkey"
            columns: ["assigned_section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_withdrawals: {
        Row: {
          created_at: string | null
          enrollment_id: string
          id: string
          processed_by: string | null
          school_year: string
          student_id: string
          withdrawal_date: string
          withdrawal_reason: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          id?: string
          processed_by?: string | null
          school_year: string
          student_id: string
          withdrawal_date?: string
          withdrawal_reason?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          id?: string
          processed_by?: string | null
          school_year?: string
          student_id?: string
          withdrawal_date?: string
          withdrawal_reason?: string | null
        }
        Relationships: []
      }
      enrollment_history: {
        Row: {
          archived_at: string
          class_id: string | null
          id: string
          membership_type: string
          school_year: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string
          class_id?: string | null
          id?: string
          membership_type: string
          school_year: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string
          class_id?: string | null
          id?: string
          membership_type?: string
          school_year?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_history_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          adviser_id: string | null
          created_at: string
          grade_level: string
          id: string
          is_active: boolean
          max_capacity: number
          name: string
          school_year: string
          strand: string | null
        }
        Insert: {
          adviser_id?: string | null
          created_at?: string
          grade_level: string
          id?: string
          is_active?: boolean
          max_capacity?: number
          name: string
          school_year: string
          strand?: string | null
        }
        Update: {
          adviser_id?: string | null
          created_at?: string
          grade_level?: string
          id?: string
          is_active?: boolean
          max_capacity?: number
          name?: string
          school_year?: string
          strand?: string | null
        }
        Relationships: []
      }
      grades: {
        Row: {
          class_id: string | null
          created_at: string | null
          grade: number
          id: string
          quarter: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string | null
          subject: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          grade: number
          id?: string
          quarter?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          subject: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          grade?: number
          id?: string
          quarter?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          subject?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_history: {
        Row: {
          created_at: string
          grade_id: string | null
          grade_value: number
          id: string
          quarter: number | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: string
          student_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          grade_id?: string | null
          grade_value: number
          id?: string
          quarter?: number | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status: string
          student_id?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          grade_id?: string | null
          grade_value?: number
          id?: string
          quarter?: number | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_history_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_history_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          activities: string
          created_at: string | null
          date: string
          id: string
          notes: string | null
          subject: string
          teacher_id: string
          topic: string
          updated_at: string | null
        }
        Insert: {
          activities: string
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          subject: string
          teacher_id: string
          topic: string
          updated_at?: string | null
        }
        Update: {
          activities?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          subject?: string
          teacher_id?: string
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
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
      user_classes: {
        Row: {
          class_id: string
          created_at: string
          membership_type: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          membership_type?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          membership_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_classes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_relationships: {
        Row: {
          can_pickup: boolean | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          related_user_id: string
          relationship_type: string | null
          user_id: string
        }
        Insert: {
          can_pickup?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          related_user_id: string
          relationship_type?: string | null
          user_id: string
        }
        Update: {
          can_pickup?: boolean | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          related_user_id?: string
          relationship_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_relationships_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          admin_title: string | null
          barangay: string | null
          barangay_name: string | null
          blood_type: string | null
          city: string | null
          created_at: string | null
          current_address: string | null
          date_hired: string | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact: string | null
          employee_number: string | null
          enrollment_date: string | null
          first_name: string
          gender: string | null
          grade_level: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          last_name: string
          lrn: string | null
          medical_notes: string | null
          middle_name: string | null
          password_change_required: boolean | null
          phone_number: string | null
          photo_url: string | null
          province: string | null
          rfid: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          section: string | null
          specialization: string | null
          status: string | null
          street_details: string | null
          student_number: string | null
          suffix: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          admin_title?: string | null
          barangay?: string | null
          barangay_name?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          current_address?: string | null
          date_hired?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          employee_number?: string | null
          enrollment_date?: string | null
          first_name: string
          gender?: string | null
          grade_level?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id: string
          last_name: string
          lrn?: string | null
          medical_notes?: string | null
          middle_name?: string | null
          password_change_required?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          province?: string | null
          rfid?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          section?: string | null
          specialization?: string | null
          status?: string | null
          street_details?: string | null
          student_number?: string | null
          suffix?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          admin_title?: string | null
          barangay?: string | null
          barangay_name?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string | null
          current_address?: string | null
          date_hired?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          employee_number?: string | null
          enrollment_date?: string | null
          first_name?: string
          gender?: string | null
          grade_level?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          last_name?: string
          lrn?: string | null
          medical_notes?: string | null
          middle_name?: string | null
          password_change_required?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          province?: string | null
          rfid?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          section?: string | null
          specialization?: string | null
          status?: string | null
          street_details?: string | null
          student_number?: string | null
          suffix?: string | null
          updated_at?: string | null
          zip_code?: string | null
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
      admission_status: "pending" | "approved" | "rejected"
      enrollment_request_status: "pending" | "approved" | "rejected"
      user_role: "admin" | "teacher" | "parent" | "student"
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
      admission_status: ["pending", "approved", "rejected"],
      enrollment_request_status: ["pending", "approved", "rejected"],
      user_role: ["admin", "teacher", "parent", "student"],
    },
  },
} as const
