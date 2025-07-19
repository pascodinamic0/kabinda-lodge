-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule automatic room status cleanup to run every hour
SELECT cron.schedule(
  'cleanup-expired-bookings',
  '0 * * * *', -- every hour at minute 0
  'SELECT cleanup_expired_bookings();'
);