-- Create RPC function to safely fetch and map database schema names to frontend layouts
CREATE OR REPLACE FUNCTION get_website_schemas()
RETURNS TABLE (schema_name text, frontend_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nspname::text AS schema_name,
        CASE nspname::text
            WHEN 'public' THEN 'production_main'
            WHEN 'auth' THEN 'user_authentication'
            WHEN 'storage' THEN 'file_assets'
            WHEN 'analytics' THEN 'visitor_insights'
            ELSE nspname::text
        END AS frontend_name
    FROM pg_namespace
    WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      AND nspname NOT LIKE 'pg_temp_%'
      AND nspname NOT LIKE 'pg_toast_temp_%'
    ORDER BY nspname;
END;
$$;
