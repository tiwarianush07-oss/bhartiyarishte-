-- BHARATJODI PRODUCTION RLS HARDENING (OPTIMIZED)

-- 1. SECURITY HELPERS
-- Using (SELECT auth.uid()) for better performance as requested
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    -- Super Admin Email Bypass
    IF (SELECT auth.jwt()->>'email') = 'bhartiyarishte03@gmail.com' THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = (SELECT auth.uid()) 
        AND (is_admin = true OR role = 'admin' OR role = 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_premium()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = (SELECT auth.uid()) 
        AND is_active = true 
        AND end_date > now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. RESET POLICIES
DROP POLICY IF EXISTS "Authenticated users view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile fields" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles visible to authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- 3. PROFILES TABLE (CRITICAL)
-- SELECT: Own profile, Admin, or Approved profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated, anon
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin()) OR
    (is_approved = true)
);

-- INSERT: Own profile only
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: Own profile or Admin
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin())
)
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin())
);

-- DELETE: Own profile or Admin
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin())
);

-- 4. PHOTOS TABLE
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- CLEANUP: Drop all possible legacy photo policy names to avoid "multiple permissive policies" warning
DROP POLICY IF EXISTS "photos_select_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_insert_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_update_policy" ON public.photos;
DROP POLICY IF EXISTS "photos_delete_policy" ON public.photos;
DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON public.photos;
DROP POLICY IF EXISTS "Users upload own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can manage own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can read photos" ON public.photos;
DROP POLICY IF EXISTS "Approved profiles photos are viewable by authenticated users" ON public.photos;

-- RECREATE: Standardized Optimized Policies
CREATE POLICY "photos_select_policy" ON public.photos
FOR SELECT TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = photos.user_id AND is_approved = true)
);

CREATE POLICY "photos_insert_policy" ON public.photos
FOR INSERT TO authenticated
WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin())
);

CREATE POLICY "photos_update_policy" ON public.photos
FOR UPDATE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin())
);

CREATE POLICY "photos_delete_policy" ON public.photos
FOR DELETE TO authenticated
USING (
    (user_id = (SELECT auth.uid())) OR 
    (public.is_admin())
);

-- 5. PUBLIC ACCESS (VIEW ONLY)
-- Granting limited select access so the security_invoker view works for guests
GRANT SELECT ON public.profiles TO authenticated, anon;

-- Safe View for landing page
-- Updated to SECURITY INVOKER = true to resolve Supabase security warning.
-- RLS on the profiles table now handles the "is_approved" check safely.
CREATE OR REPLACE VIEW public_profiles_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, 
  full_name, 
  EXTRACT(YEAR FROM age(dob)) as age,
  gender, 
  religion, 
  city, 
  profession,
  (SELECT url FROM photos WHERE photos.user_id = profiles.user_id AND is_primary = true LIMIT 1) as primary_photo
FROM public.profiles
WHERE is_approved = true;

GRANT SELECT ON public_profiles_safe TO anon, authenticated;

-- 5. CHAT SECURITY (PREMIUM CHECK)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access messages in their own conversations" ON public.chat_messages;
CREATE POLICY "Premium or Accepted Interest required for chat"
ON public.chat_messages FOR SELECT TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id FROM chat_participants cp
    WHERE cp.user_id = (SELECT auth.uid())
  ) AND (
    is_premium() OR 
    EXISTS (
      SELECT 1 FROM interests i
      JOIN chat_participants cp ON (i.from_user_id = cp.user_id OR i.to_user_id = cp.user_id)
      WHERE cp.conversation_id = chat_messages.conversation_id AND i.status = 'accepted'
    )
  )
);

-- 4.5 INTERESTS SECURITY
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view interests involving them" ON public.interests;
CREATE POLICY "Users can view interests involving them" ON public.interests
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IN (from_user_id, to_user_id));

DROP POLICY IF EXISTS "Users can send interests as themselves" ON public.interests;
CREATE POLICY "Users can send interests as themselves" ON public.interests
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Users can update interests sent to them" ON public.interests;
CREATE POLICY "Users can update interests sent to them" ON public.interests
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = to_user_id);

-- 5.1 CONVERSATIONS SECURITY
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT conversation_id FROM public.chat_participants 
        WHERE user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.chat_participants;
CREATE POLICY "Users can view participants of their conversations" ON public.chat_participants
FOR SELECT TO authenticated
USING (
    conversation_id IN (
        SELECT conversation_id FROM public.chat_participants 
        WHERE user_id = (SELECT auth.uid())
    )
);

-- 6. SUBSCRIPTIONS (READ ONLY)
CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE UPDATE, INSERT, DELETE ON public.subscriptions FROM authenticated; -- Must be handled via Edge Functions

-- 7. ADMIN TABLES
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins only access audit logs" ON public.audit_logs FOR ALL TO authenticated USING (is_admin());
