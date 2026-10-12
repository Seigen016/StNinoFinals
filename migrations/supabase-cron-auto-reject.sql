-- Supabase pg_cron: Auto-reject enrollment requests older than 48 hours
-- Run this in Supabase SQL Editor

-- 1. Enable pg_cron extension (only needs to be done once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3. Create the auto-reject function
CREATE OR REPLACE FUNCTION auto_reject_old_enrollment_requests()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE enrollment_requests
  SET
    status = 'rejected',
    updated_at = NOW(),
    rejection_reason = 'Automatically rejected: no action taken within 48 hours.'
  WHERE
    status = 'pending'
    AND created_at < NOW() - INTERVAL '48 hours';

  RAISE NOTICE 'Auto-reject ran at %: % rows updated', NOW(), ROW_COUNT;
END;
$$;

-- 4. Schedule the cron job — runs every day at midnight (Philippine time = UTC+8, so 4 PM UTC)
SELECT cron.schedule(
  'auto-reject-enrollment-requests',   -- job name
  '0 16 * * *',                        -- 16:00 UTC = 00:00 PHT
  'SELECT auto_reject_old_enrollment_requests();'
);

-- To verify the job was created:
-- SELECT * FROM cron.job;

-- To unschedule if needed:
-- SELECT cron.unschedule('auto-reject-enrollment-requests');
