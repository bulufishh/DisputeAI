
CREATE TABLE IF NOT EXISTS cases (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           text        UNIQUE NOT NULL,
  victim            text,
  platform          text        DEFAULT 'Be U by Bank Islam',
  fraud_type        text,
  amount            numeric,
  ref               text,
  merchant          text,
  scammer_contact   text,
  summary           text,
  risk_level        text        DEFAULT 'high',
  timeline          jsonb,
  submission_routes jsonb,
  status            text        DEFAULT 'submitted',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id text        UNIQUE NOT NULL,
  recipient       text,
  amount          numeric,
  ref             text,
  message         text,
  status          text        DEFAULT 'sent',
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert" ON cases
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select" ON cases
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon update status" ON cases
  FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow anon insert notif" ON notifications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select notif" ON notifications
  FOR SELECT TO anon USING (true);