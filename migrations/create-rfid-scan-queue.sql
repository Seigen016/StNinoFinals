-- Temporary queue for RFID scans during card assignment in the admin UI
-- Rows here are NOT attendance records — they are short-lived signals only
CREATE TABLE IF NOT EXISTS rfid_scan_queue (
  id         BIGSERIAL PRIMARY KEY,
  rfid_tag   TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfid_scan_queue_time ON rfid_scan_queue (scanned_at DESC);

-- Auto-delete entries older than 1 minute (optional, run as a cron or manually)
-- DELETE FROM rfid_scan_queue WHERE scanned_at < NOW() - INTERVAL '1 minute';
