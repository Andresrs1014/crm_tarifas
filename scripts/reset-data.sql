-- Elimina TODOS los datos de la base excepto la tabla "users" (login).
-- CASCADE respeta las FKs entre tablas; RESTART IDENTITY reinicia contadores/series.
DO $$
DECLARE
  tables text;
BEGIN
  SELECT string_agg(quote_ident(tablename), ', ')
  INTO tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('users', '_prisma_migrations');

  IF tables IS NOT NULL THEN
    EXECUTE format('TRUNCATE TABLE %s RESTART IDENTITY CASCADE;', tables);
    RAISE NOTICE 'Tablas vaciadas: %', tables;
  END IF;
END $$;
