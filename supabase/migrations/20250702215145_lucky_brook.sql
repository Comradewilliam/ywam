/*
  # Complete YWAM DAR Database Schema

  1. New Tables
    - `users` - User management with roles and authentication
    - `meditation_schedules` - Daily meditation sessions
    - `meals` - Kitchen duties and meal planning
    - `work_duties` - Work assignments and tasks
    - `messages` - SMS and notification system
    - `notification_templates` - Admin-managed message templates
    - `lecture_schedules` - Monthly lecture timetables
    - `kitchen_rules` - Configurable kitchen assignment rules
    - `system_settings` - Global system configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure user data and admin functions

  3. Functions
    - User role management
    - Schedule publication system
    - Automated notifications
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text UNIQUE,
  email text UNIQUE,
  phone_number text NOT NULL,
  password_hash text,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  university text NOT NULL,
  course text NOT NULL,
  date_of_birth date NOT NULL,
  roles text[] NOT NULL DEFAULT '{}',
  profile_photo text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meditation schedules
CREATE TABLE IF NOT EXISTS meditation_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time time NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  bible_verse text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meals and kitchen duties
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner')),
  meal_name text NOT NULL,
  cook_id uuid REFERENCES users(id) ON DELETE SET NULL,
  washer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  prep_time time NOT NULL,
  serve_time time NOT NULL,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Work duties
CREATE TABLE IF NOT EXISTS work_duties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name text NOT NULL,
  description text,
  is_light boolean DEFAULT true,
  is_group boolean DEFAULT false,
  people_count integer DEFAULT 1,
  date date NOT NULL,
  time time NOT NULL,
  assigned_user_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages and notifications
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text,
  content text NOT NULL,
  recipients uuid[] NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  message_type text DEFAULT 'general' CHECK (message_type IN ('welcome', 'reminder', 'meeting', 'general')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivery_status jsonb DEFAULT '{}',
  template_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('welcome', 'reminder', 'meeting', 'general')),
  variables text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lecture schedules
CREATE TABLE IF NOT EXISTS lecture_schedules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecturer_name text NOT NULL,
  course_title text NOT NULL,
  session_time time NOT NULL,
  date date NOT NULL,
  duration integer DEFAULT 60,
  location text,
  month text NOT NULL, -- YYYY-MM format
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kitchen rules configuration
CREATE TABLE IF NOT EXISTS kitchen_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name text NOT NULL,
  exclude_roles_cooking text[] DEFAULT '{}',
  exclude_roles_washing text[] DEFAULT '{}',
  day_restrictions jsonb DEFAULT '{}',
  publish_day integer DEFAULT 5, -- Friday
  publish_hour integer DEFAULT 17,
  publish_minute integer DEFAULT 45,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

-- Meditation schedules policies
CREATE POLICY "Everyone can read meditation schedules" ON meditation_schedules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and missionaries can manage meditation" ON meditation_schedules
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND ('Admin' = ANY(roles) OR 'Missionary' = ANY(roles))
    )
  );

-- Meals policies
CREATE POLICY "Everyone can read published meals" ON meals
  FOR SELECT TO authenticated USING (is_published = true OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND ('Admin' = ANY(roles) OR 'Chef' = ANY(roles))
    )
  );

CREATE POLICY "Chefs and admins can manage meals" ON meals
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND ('Admin' = ANY(roles) OR 'Chef' = ANY(roles))
    )
  );

-- Work duties policies
CREATE POLICY "Everyone can read work duties" ON work_duties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Work duty managers and admins can manage duties" ON work_duties
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND ('Admin' = ANY(roles) OR 'WorkDutyManager' = ANY(roles))
    )
  );

-- Messages policies
CREATE POLICY "Users can read their messages" ON messages
  FOR SELECT TO authenticated USING (
    auth.uid() = ANY(recipients) OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

CREATE POLICY "Admins can manage messages" ON messages
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

-- Notification templates policies
CREATE POLICY "Admins can manage notification templates" ON notification_templates
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

-- Lecture schedules policies
CREATE POLICY "Everyone can read lecture schedules" ON lecture_schedules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage lecture schedules" ON lecture_schedules
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

-- Kitchen rules policies
CREATE POLICY "Everyone can read kitchen rules" ON kitchen_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage kitchen rules" ON kitchen_rules
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

-- System settings policies
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND 'Admin' = ANY(roles)
    )
  );

-- Insert default data

-- Default kitchen rules
INSERT INTO kitchen_rules (rule_name, exclude_roles_cooking, exclude_roles_washing, day_restrictions) VALUES
('Default Kitchen Rules', 
 ARRAY['Missionary'], 
 ARRAY['Missionary'], 
 '{
   "DTS": {"excludeDays": [1,2,3,4,5], "excludeMeals": []},
   "PraiseTeam": {"excludeDays": [6], "excludeMeals": ["lunch"]}
 }'::jsonb
);

-- Default notification templates
INSERT INTO notification_templates (name, title, content, type, variables) VALUES
('Welcome Friend', 'Welcome to YWAM DAR', 'Welcome to YWAM DAR, {{firstName}}! We''re excited to have you join our community.', 'welcome', ARRAY['firstName']),
('Login Credentials', 'Your YWAM DAR Login Details', 'Hi {{firstName}}, your login credentials are: Username: {{username}}, Password: {{password}}. Please change your password after first login.', 'welcome', ARRAY['firstName', 'username', 'password']),
('Kitchen Duty Reminder', 'Kitchen Duty Reminder', 'Hi {{firstName}}, reminder: Your {{role}} duty for {{mealType}} starts in 15 minutes. Menu: {{mealName}}', 'reminder', ARRAY['firstName', 'role', 'mealType', 'mealName']),
('Meeting Reminder', 'Meeting Reminder', 'Hi {{firstName}}, reminder: {{meetingTitle}} starts in {{timeUntil}} at {{location}}.', 'meeting', ARRAY['firstName', 'meetingTitle', 'timeUntil', 'location']);

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('sms_provider', '"beem"', 'Default SMS provider (beem or africas_talking)'),
('beem_config', '{"apiKey": "", "secretKey": "", "sourceAddr": "YWAM DAR"}', 'Beem Africa SMS configuration'),
('africas_talking_config', '{"username": "", "apiKey": "", "from": "YWAM DAR"}', 'Africa''s Talking SMS configuration'),
('schedule_publication', '{"day": 5, "hour": 17, "minute": 45}', 'When schedules get published (Friday 17:45)');

-- Functions

-- Function to check if schedules are published
CREATE OR REPLACE FUNCTION is_schedule_published()
RETURNS boolean AS $$
DECLARE
  publish_settings jsonb;
  current_day integer;
  current_hour integer;
  current_minute integer;
BEGIN
  SELECT setting_value INTO publish_settings 
  FROM system_settings 
  WHERE setting_key = 'schedule_publication';
  
  current_day := EXTRACT(dow FROM now()); -- 0=Sunday, 5=Friday
  current_hour := EXTRACT(hour FROM now());
  current_minute := EXTRACT(minute FROM now());
  
  -- If it's past Friday 17:45, schedule is published
  IF current_day > (publish_settings->>'day')::integer THEN
    RETURN true;
  END IF;
  
  IF current_day = (publish_settings->>'day')::integer AND 
     current_hour > (publish_settings->>'hour')::integer THEN
    RETURN true;
  END IF;
  
  IF current_day = (publish_settings->>'day')::integer AND 
     current_hour = (publish_settings->>'hour')::integer AND 
     current_minute >= (publish_settings->>'minute')::integer THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-publish schedules
CREATE OR REPLACE FUNCTION auto_publish_schedules()
RETURNS void AS $$
BEGIN
  IF is_schedule_published() THEN
    UPDATE meals 
    SET is_published = true, published_at = now() 
    WHERE is_published = false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meditation_schedules_updated_at BEFORE UPDATE ON meditation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_duties_updated_at BEFORE UPDATE ON work_duties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lecture_schedules_updated_at BEFORE UPDATE ON lecture_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_rules_updated_at BEFORE UPDATE ON kitchen_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();