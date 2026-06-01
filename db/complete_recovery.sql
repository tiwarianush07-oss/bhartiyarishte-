
-- ============================================================
-- BHARATJODI: CORE SCHEMA RESTORATION & PERFORMANCE
-- ============================================================

-- 1. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan text NOT NULL CHECK (plan IN ('free', 'gold', 'platinum')),
    start_date timestamptz DEFAULT now(),
    end_date timestamptz NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 2. INTERESTS TABLE
CREATE TABLE IF NOT EXISTS public.interests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_interest UNIQUE(from_user_id, to_user_id)
);

-- 3. CHAT TABLES
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at timestamptz,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    deleted_for_sender boolean DEFAULT false,
    deleted_for_receiver boolean DEFAULT false
);

-- 4. SUCCESS STORIES
CREATE TABLE IF NOT EXISTS public.success_stories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    partner1_name text NOT NULL,
    partner2_name text NOT NULL,
    wedding_date date,
    story_quote text,
    image_url text,
    is_featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 5. PERFORMANCE OPTIMIZATION (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policy
DROP POLICY IF EXISTS "Users read own subscription" ON public.subscriptions;
CREATE POLICY "Users read own subscription" ON public.subscriptions 
FOR SELECT TO authenticated 
USING ((SELECT auth.uid()) = user_id);

-- Interests Policy
DROP POLICY IF EXISTS "Interests readability" ON public.interests;
CREATE POLICY "Interests readability" ON public.interests
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IN (from_user_id, to_user_id));

    )
);

-- Profiles Policy (OPTIMIZED)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles 
FOR SELECT TO authenticated, anon 
USING ((user_id = (SELECT auth.uid())) OR (public.is_admin()) OR (is_approved = true));

-- 6. SECURITY HARDENING
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';
