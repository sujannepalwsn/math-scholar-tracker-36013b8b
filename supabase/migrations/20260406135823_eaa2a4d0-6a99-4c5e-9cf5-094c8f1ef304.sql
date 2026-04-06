DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    RAISE NOTICE 'Enabled RLS on %', tbl.tablename;
  END LOOP;
END $$;