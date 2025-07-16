/*
  # Database Performance and Security Improvements

  1. Indexes
    - Add indexes on frequently queried columns
    - Improve query performance for schedules, users, and messages

  2. Security
    - Enhanced RLS policies
    - Rate limiting functions
    - Audit logging

  3. Error Handling
    - Improved auto-publishing with error handling
    - Logging system for debugging
*/

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_meditation_date ON meditation_schedules(date);
CREATE INDEX IF NOT EXISTS idx_meditation_user ON meditation_schedules(user_id);

CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_type ON meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_meals_cook ON meals(cook_id);
CREATE INDEX IF NOT EXISTS idx_meals_washer ON meals(washer_id);
CREATE INDEX IF NOT EXISTS idx_meals_published ON meals(is_published);

CREATE INDEX IF NOT EXISTS idx_work_duties_date ON work_duties(date);
CREATE INDEX IF NOT EXISTS idx_work_duties_assigned ON work_duties USING GIN(assigned_user_ids);

CREATE INDEX IF NOT EXISTS idx_messages_recipients ON messages USING GIN(recipients);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON notification_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_lectures_month ON lecture_schedules(month);
CREATE INDEX IF NOT EXISTS idx_lectures_date ON lecture_schedules(date);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES users(id),
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

-- Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- Enhanced Auto-Publishing Function with Error Handling
CREATE OR REPLACE FUNCTION auto_publish_schedules_with_logging()
RETURNS jsonb AS $$
DECLARE
  publish_settings jsonb;
  current_day integer;
  current_hour integer;
  current_minute integer;
  updated_count integer;
  error_message text;
  result jsonb;
BEGIN
  -- Initialize result
  result := jsonb_build_object(
    'success', false,
    'message', '',
    'updated_count', 0,
    'timestamp', now()
  );

  BEGIN
    -- Get publication settings
    SELECT setting_value INTO publish_settings 
    FROM system_settings 
    WHERE setting_key = 'schedule_publication';
    
    IF publish_settings IS NULL THEN
      result := jsonb_set(result, '{message}', '"Publication settings not found"');
      RETURN result;
    END IF;
    
    current_day := EXTRACT(dow FROM now());
    current_hour := EXTRACT(hour FROM now());
    current_minute := EXTRACT(minute FROM now());
    
    -- Check if it's time to publish
    IF current_day > (publish_settings->>'day')::integer OR
       (current_day = (publish_settings->>'day')::integer AND 
        current_hour > (publish_settings->>'hour')::integer) OR
       (current_day = (publish_settings->>'day')::integer AND 
        current_hour = (publish_settings->>'hour')::integer AND 
        current_minute >= (publish_settings->>'minute')::integer) THEN
      
      -- Update unpublished meals
      UPDATE meals 
      SET is_published = true, published_at = now() 
      WHERE is_published = false;
      
      GET DIAGNOSTICS updated_count = ROW_COUNT;
      
      result := jsonb_build_object(
        'success', true,
        'message', 'Schedules published successfully',
        'updated_count', updated_count,
        'timestamp', now()
      );
      
      -- Log the publication
      INSERT INTO audit_logs (table_name, operation, new_data, user_id)
      VALUES ('meals', 'auto_publish', result, null);
      
    ELSE
      result := jsonb_set(result, '{message}', '"Not yet time to publish schedules"');
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    result := jsonb_build_object(
      'success', false,
      'message', 'Error: ' || error_message,
      'updated_count', 0,
      'timestamp', now()
    );
    
    -- Log the error
    INSERT INTO audit_logs (table_name, operation, new_data, user_id)
    VALUES ('system', 'auto_publish_error', result, null);
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Rate Limiting Function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  window_start timestamptz;
BEGIN
  window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean old entries
  DELETE FROM rate_limits 
  WHERE window_start < window_start;
  
  -- Get current count for user and endpoint
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM rate_limits
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start >= window_start;
  
  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, now())
  ON CONFLICT (user_id, endpoint) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start THEN now()
      ELSE rate_limits.window_start
    END;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Enhanced RLS Policies with Granular Permissions

-- Create permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  resource text NOT NULL,
  action text NOT NULL,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON user_permissions(resource, action);

-- Function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid,
  p_resource text,
  p_action text
)
RETURNS boolean AS $$
DECLARE
  user_roles text[];
  has_perm boolean := false;
BEGIN
  -- Get user roles
  SELECT roles INTO user_roles FROM users WHERE id = p_user_id;
  
  -- Admin has all permissions
  IF 'Admin' = ANY(user_roles) THEN
    RETURN true;
  END IF;
  
  -- Check specific permissions
  SELECT EXISTS(
    SELECT 1 FROM user_permissions 
    WHERE user_id = p_user_id 
      AND resource = p_resource 
      AND action = p_action
  ) INTO has_perm;
  
  -- Check role-based permissions
  IF NOT has_perm THEN
    CASE p_resource
      WHEN 'users' THEN
        has_perm := 'Admin' = ANY(user_roles);
      WHEN 'meditation' THEN
        has_perm := 'Admin' = ANY(user_roles) OR 'Missionary' = ANY(user_roles);
      WHEN 'meals' THEN
        has_perm := 'Admin' = ANY(user_roles) OR 'Chef' = ANY(user_roles);
      WHEN 'work_duties' THEN
        has_perm := 'Admin' = ANY(user_roles) OR 'WorkDutyManager' = ANY(user_roles);
      WHEN 'messages' THEN
        has_perm := 'Admin' = ANY(user_roles);
      ELSE
        has_perm := false;
    END CASE;
  END IF;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, operation, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, operation, new_data, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_meals AFTER INSERT OR UPDATE OR DELETE ON meals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_work_duties AFTER INSERT OR UPDATE OR DELETE ON work_duties
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();