-- PHASE 3: VERIFICATION SYSTEM MIGRATION
-- Execute this script in your Supabase Dashboard SQL Editor

-----------------------------------------
-- 1. ENUMS & COLUMNS
-----------------------------------------
DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM ('unverified', 'pending', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if column exists, if not, add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='verification_status') THEN
        ALTER TABLE public.profiles ADD COLUMN verification_status verification_status_enum DEFAULT 'unverified';
    END IF;
END $$;

-----------------------------------------
-- 2. BACKWARD COMPATIBILITY
-----------------------------------------
-- Migrate any previously 'verified' bools to the new ENUM standard immediately.
UPDATE public.profiles 
SET verification_status = 'verified' 
WHERE is_verified = true 
  AND verification_status = 'unverified';

-- NOTE: Any Admin OCR tool approvals should now securely target `verification_status = 'verified'` alongside `is_approved`.
