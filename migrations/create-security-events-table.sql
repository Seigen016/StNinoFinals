-- Security events table for RFID three-strike tracking and audit log
CREATE TABLE IF NOT EXISTS security_events (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,           -- 'unauthorized_scan' | 'three_strike_alert'
  rfid_tag    TEXT NOT NULL,
  device_id   TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_security_events_rfid_type ON security_events (rfid_tag, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type_time  ON security_events (event_type, occurred_at DESC);

-- Enable Supabase Realtime so the admin live-attendance page receives INSERT events
ALTER TABLE security_events REPLICA IDENTITY FULL;
-- After running this migration, enable Realtime for security_events in the Supabase dashboard
-- (Table Editor → security_events → Enable Realtime) or via:
-- ALTER PUBLICATION supabase_realtime ADD TABLE security_events;
