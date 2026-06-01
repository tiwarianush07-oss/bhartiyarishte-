-- 100% ADMIN-ONLY CRM LOCKDOWN SCRIPT --
-- Execute this in the Supabase SQL Editor --

-- 1. PROFILES TABLE LOCKDOWN --
-- Drop all existing policies that allow public or regular authenticated access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create strict admin-only policies
CREATE POLICY "Admins can do everything on profiles" 
ON profiles 
FOR ALL 
USING (
  (auth.jwt() ->> 'email' = 'bhartiyarishte03@gmail.com') OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)))
);

-- 2. USERS TABLE LOCKDOWN --
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

CREATE POLICY "Admins can do everything on users" 
ON users 
FOR ALL 
USING (
  (auth.jwt() ->> 'email' = 'bhartiyarishte03@gmail.com') OR 
  (role = 'admin' OR is_admin = true)
);

-- 3. PHOTOS TABLE LOCKDOWN --
DROP POLICY IF EXISTS "Photos are publicly viewable" ON photos;
DROP POLICY IF EXISTS "Users can upload their own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;

CREATE POLICY "Admins can do everything on photos" 
ON photos 
FOR ALL 
USING (
  (auth.jwt() ->> 'email' = 'bhartiyarishte03@gmail.com') OR 
  (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)))
);

-- Note: We do NOT need to create a read policy for standard users because
-- this is a 100% internal CRM. No public user should ever query the database.
