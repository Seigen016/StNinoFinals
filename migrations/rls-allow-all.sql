-- RLS: Enable on all tables + create a permissive "allow all" policy
-- This grants full unrestricted access to every role (anon, authenticated, service_role)

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users',
    'classes',
    'user_classes',
    'class_enrollments',
    'class_subjects',
    'enrollment_requests',
    'grades',
    'attendance_records',
    'rfid_scan_queue',
    'security_events',
    'announcements',
    'rooms',
    'system_settings',
    'user_relationships'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "allow_all" ON %I;', tbl);
      EXECUTE format(
        'CREATE POLICY "allow_all" ON %I FOR ALL TO public USING (true) WITH CHECK (true);',
        tbl
      );
      RAISE NOTICE 'RLS allow_all applied to: %', tbl;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Skipped (table does not exist): %', tbl;
    END;
  END LOOP;
END;
$$;
