-- ==========================================
-- BHARATIYA RISHTEY: MONETIZATION & NOTIFICATIONS
-- ==========================================
-- Phase 5 Execution: Push this to your Supabase SQL Editor to trigger the final paywalls and Notification Arrays.

-- 1. Extend profiles with a plan_type enumeration (if it doesn't already exist from older versions)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan_type') THEN
        ALTER TABLE profiles ADD COLUMN plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'elite'));
    END IF;
END $$;

-- 2. Create Notifications Engine
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('interest_received', 'interest_accepted', 'profile_view', 'system')),
    message TEXT NOT NULL,
    reference_id UUID, -- Dynamic ID depending on type (e.g., sender_id)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow system/any authenticated user to trigger a notification to someone else

-- 3. Triggers for Automatic Notification Ingestion
-- Trigger: When an Interest is Inserted (Received)
CREATE OR REPLACE FUNCTION trigger_interest_received_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, message, reference_id)
    VALUES (NEW.receiver_id, 'interest_received', 'You have received a new match interest!', NEW.sender_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_interest_received ON public.interests;
CREATE TRIGGER on_interest_received
    AFTER INSERT ON public.interests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_interest_received_notification();

-- Trigger: When an Interest is Updated to Accepted
CREATE OR REPLACE FUNCTION trigger_interest_accepted_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO public.notifications (user_id, type, message, reference_id)
        VALUES (NEW.sender_id, 'interest_accepted', 'Your match interest was formally accepted!', NEW.receiver_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_interest_accepted ON public.interests;
CREATE TRIGGER on_interest_accepted
    AFTER UPDATE ON public.interests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_interest_accepted_notification();
