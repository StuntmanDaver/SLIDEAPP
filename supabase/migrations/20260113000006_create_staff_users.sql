-- Create staff_users table (staff roles and status)
CREATE TABLE staff_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('scanner', 'admin')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Create policy: staff can read their own role
CREATE POLICY "Staff read own role"
  ON staff_users FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: only service role can manage staff
CREATE POLICY "Admin manage staff"
  ON staff_users FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create indexes
CREATE INDEX idx_staff_users_role ON staff_users(role);
CREATE INDEX idx_staff_users_is_active ON staff_users(is_active);
