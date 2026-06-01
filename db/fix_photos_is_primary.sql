-- ============================================================
-- FIX: Add is_primary column to photos table securely
-- ============================================================

-- STEP 1: Create the photos table if it does not exist yet
CREATE TABLE IF NOT EXISTS public.photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- STEP 2: Add is_primary if the table already exists but the column is missing
ALTER TABLE public.photos
    ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- STEP 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_photos_user_id          ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_primary       ON public.photos(is_primary);
CREATE INDEX IF NOT EXISTS idx_photos_user_primary     ON public.photos(user_id, is_primary);

-- STEP 4: Ensure the first photo per user is set as primary
UPDATE public.photos p
SET    is_primary = true
WHERE  p.id IN (
    SELECT DISTINCT ON (user_id) id 
    FROM   public.photos
    WHERE  NOT EXISTS (
        SELECT 1 FROM public.photos p2
        WHERE  p2.user_id = p.user_id AND p2.is_primary = true
    )
    ORDER BY user_id, created_at ASC
);

-- STEP 5: RLS — Basic auth policies only to prevent schema conflicts
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;
DROP POLICY IF EXISTS "Approved profiles photos are viewable by authenticated users" ON public.photos;

CREATE POLICY "Users can view their own photos"
    ON public.photos FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own photos"
    ON public.photos FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own photos"
    ON public.photos FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own photos"
    ON public.photos FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- End of File. (Removed all external references to public.profiles schema to prevent 'does not exist' errors)
