-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  allow_new_devices BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  address TEXT,
  contact TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  asset_tag TEXT NOT NULL UNIQUE,
  serial TEXT,
  model TEXT NOT NULL,
  status TEXT CHECK(status IN ('available', 'checked_out')) DEFAULT 'available',
  school_id TEXT NOT NULL,
  assigned_to_name TEXT,
  assigned_timestamp TIMESTAMP,
  assigned_reason TEXT,
  homeroom_teacher TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(school_id) REFERENCES schools(id)
);

-- Create device_logs table
CREATE TABLE IF NOT EXISTS device_logs (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  asset_tag TEXT NOT NULL,
  action TEXT CHECK(action IN ('checkin', 'checkout')) NOT NULL,
  user_name TEXT NOT NULL,
  reason TEXT,
  homeroom_teacher TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  school_id TEXT NOT NULL,
  FOREIGN KEY(device_id) REFERENCES devices(id),
  FOREIGN KEY(school_id) REFERENCES schools(id)
);

-- Create repair_tickets table
CREATE TABLE IF NOT EXISTS repair_tickets (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  device_type TEXT CHECK(device_type IN ('chromebook', 'windows', 'mac', 'other')) NOT NULL,
  device_barcode TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  notes TEXT,
  school_id TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  operations_hero_id TEXT,
  status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(school_id) REFERENCES schools(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_devices_school ON devices(school_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_asset_tag ON devices(asset_tag);
CREATE INDEX IF NOT EXISTS idx_logs_school ON device_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON device_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_tickets_school ON repair_tickets(school_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON repair_tickets(status);

-- Insert default schools
INSERT OR IGNORE INTO schools (id, name, allow_new_devices) VALUES
  ('flocktown', 'Flocktown', FALSE),
  ('kossman', 'Kossman', FALSE),
  ('old-farmers', 'Old Farmers', FALSE),
  ('cucinella', 'Cucinella', FALSE),
  ('long-valley', 'Long Valley Middle School', FALSE),
  ('central-office', 'Central Office', FALSE);
