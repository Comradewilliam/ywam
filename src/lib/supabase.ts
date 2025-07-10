import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Using demo mode.');
  // Fallback for demo mode
  const demoUrl = 'https://demo.supabase.co';
  const demoKey = 'demo-key';
  export const supabase = createClient(demoUrl, demoKey);
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}


// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          username?: string;
          email?: string;
          phone_number: string;
          password_hash?: string;
          gender: 'Male' | 'Female';
          university: string;
          course: string;
          date_of_birth: string;
          roles: string[];
          profile_photo?: string;
          is_active: boolean;
          last_login?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          username?: string;
          email?: string;
          phone_number: string;
          password_hash?: string;
          gender: 'Male' | 'Female';
          university: string;
          course: string;
          date_of_birth: string;
          roles: string[];
          profile_photo?: string;
          is_active?: boolean;
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          username?: string;
          email?: string;
          phone_number?: string;
          password_hash?: string;
          gender?: 'Male' | 'Female';
          university?: string;
          course?: string;
          date_of_birth?: string;
          roles?: string[];
          profile_photo?: string;
          is_active?: boolean;
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      meditation_schedules: {
        Row: {
          id: string;
          date: string;
          time: string;
          user_id?: string;
          bible_verse: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          time: string;
          user_id?: string;
          bible_verse: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          time?: string;
          user_id?: string;
          bible_verse?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          date: string;
          meal_type: 'Breakfast' | 'Lunch' | 'Dinner';
          meal_name: string;
          cook_id?: string;
          washer_id?: string;
          prep_time: string;
          serve_time: string;
          is_published: boolean;
          published_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          meal_type: 'Breakfast' | 'Lunch' | 'Dinner';
          meal_name: string;
          cook_id?: string;
          washer_id?: string;
          prep_time: string;
          serve_time: string;
          is_published?: boolean;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          meal_type?: 'Breakfast' | 'Lunch' | 'Dinner';
          meal_name?: string;
          cook_id?: string;
          washer_id?: string;
          prep_time?: string;
          serve_time?: string;
          is_published?: boolean;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_duties: {
        Row: {
          id: string;
          task_name: string;
          description?: string;
          is_light: boolean;
          is_group: boolean;
          people_count: number;
          date: string;
          time: string;
          assigned_user_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_name: string;
          description?: string;
          is_light?: boolean;
          is_group?: boolean;
          people_count?: number;
          date: string;
          time: string;
          assigned_user_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_name?: string;
          description?: string;
          is_light?: boolean;
          is_group?: boolean;
          people_count?: number;
          date?: string;
          time?: string;
          assigned_user_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          title?: string;
          content: string;
          recipients: string[];
          sender_id?: string;
          message_type: 'welcome' | 'reminder' | 'meeting' | 'general';
          scheduled_for?: string;
          sent_at?: string;
          delivery_status: any;
          template_id?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          content: string;
          recipients: string[];
          sender_id?: string;
          message_type?: 'welcome' | 'reminder' | 'meeting' | 'general';
          scheduled_for?: string;
          sent_at?: string;
          delivery_status?: any;
          template_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          recipients?: string[];
          sender_id?: string;
          message_type?: 'welcome' | 'reminder' | 'meeting' | 'general';
          scheduled_for?: string;
          sent_at?: string;
          delivery_status?: any;
          template_id?: string;
          created_at?: string;
        };
      };
      notification_templates: {
        Row: {
          id: string;
          name: string;
          title: string;
          content: string;
          type: 'welcome' | 'reminder' | 'meeting' | 'general';
          variables: string[];
          is_active: boolean;
          created_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          title: string;
          content: string;
          type: 'welcome' | 'reminder' | 'meeting' | 'general';
          variables?: string[];
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          title?: string;
          content?: string;
          type?: 'welcome' | 'reminder' | 'meeting' | 'general';
          variables?: string[];
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lecture_schedules: {
        Row: {
          id: string;
          lecturer_name: string;
          course_title: string;
          session_time: string;
          date: string;
          duration: number;
          location?: string;
          month: string;
          created_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lecturer_name: string;
          course_title: string;
          session_time: string;
          date: string;
          duration?: number;
          location?: string;
          month: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lecturer_name?: string;
          course_title?: string;
          session_time?: string;
          date?: string;
          duration?: number;
          location?: string;
          month?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      kitchen_rules: {
        Row: {
          id: string;
          rule_name: string;
          exclude_roles_cooking: string[];
          exclude_roles_washing: string[];
          day_restrictions: any;
          publish_day: number;
          publish_hour: number;
          publish_minute: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_name: string;
          exclude_roles_cooking?: string[];
          exclude_roles_washing?: string[];
          day_restrictions?: any;
          publish_day?: number;
          publish_hour?: number;
          publish_minute?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_name?: string;
          exclude_roles_cooking?: string[];
          exclude_roles_washing?: string[];
          day_restrictions?: any;
          publish_day?: number;
          publish_hour?: number;
          publish_minute?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: any;
          description?: string;
          updated_by?: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: any;
          description?: string;
          updated_by?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: any;
          description?: string;
          updated_by?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      is_schedule_published: {
        Args: {};
        Returns: boolean;
      };
      auto_publish_schedules: {
        Args: {};
        Returns: void;
      };
    };
  };
}