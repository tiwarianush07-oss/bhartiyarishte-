-- SQL to promote specific users to Admin status
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
  target_emails text[] := ARRAY['helpbhartiyarishtey09@gmail.com', 'bhartiyarishte03@gmail.com'];
  email_item text;
  curr_user_id uuid;
BEGIN
  FOREACH email_item IN ARRAY target_emails
  LOOP
    -- Find the user ID from auth.users
    SELECT id INTO curr_user_id FROM auth.users WHERE email = email_item;

    IF curr_user_id IS NOT NULL THEN
      -- 1. Update profiles table (for RLS check_is_admin function)
      UPDATE public.profiles 
      SET is_admin = true 
      WHERE user_id = curr_user_id;

      -- 2. Update users table (for role-based logic)
      UPDATE public.users 
      SET is_admin = true, role = 'admin' 
      WHERE id = curr_user_id;

      RAISE NOTICE 'Promoted % to Admin', email_item;
    ELSE
      RAISE NOTICE 'User with email % not found. They must sign up first.', email_item;
    END IF;
  END LOOP;
END $$;
