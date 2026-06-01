-- HYBRID ARCHITECTURE MIGRATION (Phase 2)
-- Execute this script in your Supabase Dashboard SQL Editor

-----------------------------------------
-- 1. INTERESTS SYSTEM & ENUMS
-----------------------------------------
-- Create ENUM for interest statuses
DO $$ BEGIN
    CREATE TYPE interest_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the new User Interests table
CREATE TABLE IF NOT EXISTS public.interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status interest_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate active requests between the same users
    UNIQUE(sender_id, receiver_id)
);

-- Enable RLS for interests
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Sender can see and create their sent requests
CREATE POLICY "Users can insert their own interests" 
ON public.interests FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Sender/Receiver can both view the interest record
CREATE POLICY "Users can view interests involving them" 
ON public.interests FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Receiver is allowed to update the status (accept/decline)
CREATE POLICY "Receiver can update interest status" 
ON public.interests FOR UPDATE 
USING (auth.uid() = receiver_id);


-----------------------------------------
-- 2. LOOSENING READ POLICIES FOR HYBRID PUBLIC SEARCH
-----------------------------------------
-- Previously, 02_lockdown_rls.sql restricted all access strictly to Admins.
-- We must now ADD policies so authenticated 'user' roles can see Approved profiles limit.

-- Allow ANY authenticated user to view profiles ONLY IF they are approved.
CREATE POLICY "Authenticated users can view approved profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL AND is_approved = true);

-- Allow ANY authenticated user to view photos of approved profiles
-- Note: 'is_primary' might be used to filter main photos if privacy is strict
CREATE POLICY "Authenticated users can view photos of approved profiles"
ON public.photos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = photos.user_id AND p.is_approved = true
  )
);

-- Ensure admins still have global override control (Just as a safety duplicate fallback)
-- Admin policies from 02_lockdown_rls.sql generally use 'FOR ALL', so they combine with these via OR.
