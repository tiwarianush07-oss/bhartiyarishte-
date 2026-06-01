-- =============================================
-- BHARATJODI: DATABASE SEED SCRIPT
-- =============================================
-- This script populates the database with sample data for development and testing.

BEGIN;

-- TRUNCATE existing data to ensure a clean slate on every run.
TRUNCATE TABLE
  public.users,
  public.profiles,
  public.photos,
  public.interests,
  public.subscriptions,
  public.chat_conversations,
  public.chat_participants,
  public.chat_messages,
  public.success_stories
RESTART IDENTITY CASCADE;

-- =============================================
-- 1. INSERT USERS (Real & Dummy)
-- =============================================
INSERT INTO public.users (id, email, phone, is_premium, is_admin) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'priya.sharma@example.com', '+919876543211', TRUE, FALSE),
('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'rohan.mehra@example.com', '+919876543212', FALSE, FALSE),
('c3d4e5f6-a7b8-9012-3456-7890abcdef12', 'anjali.gupta@example.com', '+919876543213', TRUE, FALSE),
('d4e5f6a7-b8c9-0123-4567-890abcdef123', 'vikram.singh@example.com', '+919876543214', FALSE, FALSE),
('e5f6a7b8-c9d0-1234-5678-90abcdef1234', 'admin@bhartiyarishtey.com', '+919999999999', TRUE, TRUE),
-- New Dummy Users
('f6a7b8c9-d0e1-2345-6789-0abcdef12345', 'kavya.reddy@example.com', '+919876543215', FALSE, FALSE),
('g7b8c9d0-e1f2-3456-7890-abcdef123456', 'arjun.nair@example.com', '+919876543216', TRUE, FALSE),
('h8c9d0e1-f2a3-4567-890a-bcdef1234567', 'zara.khan@example.com', '+919876543217', FALSE, FALSE),
('i9d0e1f2-a3b4-5678-90ab-cdef12345678', 'ishaan.malhotra@example.com', '+919876543218', TRUE, FALSE),
('j0e1f2a3-b4c5-6789-0abc-def123456789', 'meera.iyer@example.com', '+919876543219', FALSE, FALSE),
('k1f2a3b4-c5d6-7890-abcd-ef1234567890', 'kabir.singh@example.com', '+919876543220', FALSE, FALSE),
('l2a3b4c5-d6e7-8901-bcde-f12345678901', 'sneha.patil@example.com', '+919876543221', TRUE, FALSE),
('m3b4c5d6-e7f8-9012-cdef-123456789012', 'rahul.verma@example.com', '+919876543222', FALSE, FALSE),
('n4c5d6e7-f8a9-0123-def1-234567890123', 'diya.shah@example.com', '+919876543223', TRUE, FALSE),
('o5d6e7f8-a9b0-1234-ef12-345678901234', 'amit.mishra@example.com', '+919876543224', FALSE, FALSE);

-- =============================================
-- 2. INSERT PROFILES
-- =============================================
INSERT INTO public.profiles (user_id, full_name, dob, gender, religion, caste, education, profession, city, state, height, marital_status, bio, is_approved, is_verified) VALUES
(
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'Priya Sharma', '1996-08-20', 'female', 'Hindu', 'Brahmin', 'MBA in Marketing', 'Brand Manager', 'Mumbai', 'Maharashtra', '5''6"', 'Never Married',
  'A blend of modern aspirations and traditional values. Looking for a partner who is ambitious, kind, and values family.',
  TRUE, TRUE
),
(
  'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
  'Rohan Mehra', '1994-05-12', 'male', 'Hindu', 'Kshatriya', 'M.Tech in Computer Science', 'Senior Software Engineer', 'Bengaluru', 'Karnataka', '6''0"', 'Never Married',
  'Passionate about technology and building things that make a difference. Seeking a companion who is intelligent and independent.',
  TRUE, TRUE
),
(
  'f6a7b8c9-d0e1-2345-6789-0abcdef12345',
  'Kavya Reddy', '1997-03-24', 'female', 'Hindu', 'Reddy', 'B.Des in Visual Communication', 'UI/UX Designer', 'Hyderabad', 'Telangana', '5''5"', 'Never Married',
  'Creative soul who loves design and minimalist living. I enjoy South Indian filter coffee and long walks.',
  TRUE, TRUE
),
(
  'g7b8c9d0-e1f2-3456-7890-abcdef123456',
  'Arjun Nair', '1993-09-15', 'male', 'Hindu', 'Nair', 'B.Arch', 'Architect', 'Kochi', 'Kerala', '5''10"', 'Never Married',
  'Architectural designer with a passion for sustainable buildings. Love traveling across the Western Ghats.',
  TRUE, TRUE
),
(
  'h8c9d0e1-f2a3-4567-890a-bcdef1234567',
  'Zara Khan', '1995-12-05', 'female', 'Muslim', 'Sunni', 'Masters in Media Studies', 'Public Relations Manager', 'New Delhi', 'Delhi', '5''7"', 'Never Married',
  'Modern and independent woman with deep family roots. I enjoy reading and weekend tennis.',
  TRUE, TRUE
),
(
  'i9d0e1f2-a3b4-5678-90ab-cdef12345678',
  'Ishaan Malhotra', '1992-07-11', 'male', 'Hindu', 'Punjabi', 'Chartered Accountant', 'Investment Banker', 'Mumbai', 'Maharashtra', '5''11"', 'Never Married',
  'High-paced life in finance but I value quiet evenings. Looking for someone who understands professional drive.',
  TRUE, TRUE
),
(
  'j0e1f2a3-b4c5-6789-0abc-def123456789',
  'Meera Iyer', '1998-01-18', 'female', 'Hindu', 'Brahmin', 'M.Ed', 'Classical Dance Teacher', 'Chennai', 'Tamil Nadu', '5''4"', 'Never Married',
  'Bharatanatyam dancer and educator. Values culture, music, and simple vegetarian living.',
  TRUE, TRUE
),
(
  'k1f2a3b4-c5d6-7890-abcd-ef1234567890',
  'Kabir Singh', '1991-04-30', 'male', 'Sikh', 'Jat', 'MBA', 'Real Estate Developer', 'Chandigarh', 'Punjab', '6''1"', 'Never Married',
  'Passionate about sports and fitness. I believe in loyalty and hard work. Seeking someone with similar values.',
  TRUE, TRUE
),
(
  'l2a3b4c5-d6e7-8901-bcde-f12345678901',
  'Sneha Patil', '1996-06-22', 'female', 'Hindu', 'Maratha', 'MBA in HR', 'Senior HR Specialist', 'Pune', 'Maharashtra', '5''3"', 'Never Married',
  'Vibrant personality, loves Marathi theater and cooking traditional meals. Family is my priority.',
  TRUE, TRUE
),
(
  'm3b4c5d6-e7f8-9012-cdef-123456789012',
  'Rahul Verma', '1990-11-02', 'male', 'Hindu', 'Kayastha', 'MD Medicine', 'Consultant Doctor', 'Jaipur', 'Rajasthan', '5''9"', 'Never Married',
  'Dedicated to the medical field. Looking for an understanding partner to share a peaceful life with.',
  TRUE, TRUE
),
(
  'n4c5d6e7-f8a9-0123-def1-234567890123',
  'Diya Shah', '1997-08-14', 'female', 'Jain', 'Shah', 'CA', 'Finance Consultant', 'Ahmedabad', 'Gujarat', '5''4"', 'Never Married',
  'Spiritual and ambitious. I enjoy reading and volunteering at local community events.',
  TRUE, TRUE
),
(
  'o5d6e7f8-a9b0-1234-ef12-345678901234',
  'Amit Mishra', '1994-02-28', 'male', 'Hindu', 'Brahmin', 'B.Tech', 'Data Scientist', 'Lucknow', 'Uttar Pradesh', '5''10"', 'Never Married',
  'A simple guy with a love for technology and Hindustani classical music.',
  TRUE, TRUE
);

-- =============================================
-- 3. INSERT PHOTOS (Primary only for speed)
-- =============================================
INSERT INTO public.photos (user_id, url, is_primary) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400', TRUE),
('b2c3d4e5-f6a7-8901-2345-67890abcdef1', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400', TRUE),
('f6a7b8c9-d0e1-2345-6789-0abcdef12345', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400', TRUE),
('g7b8c9d0-e1f2-3456-7890-abcdef123456', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400', TRUE),
('h8c9d0e1-f2a3-4567-890a-bcdef1234567', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400', TRUE),
('i9d0e1f2-a3b4-5678-90ab-cdef12345678', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400', TRUE),
('j0e1f2a3-b4c5-6789-0abc-def123456789', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=400', TRUE),
('k1f2a3b4-c5d6-7890-abcd-ef1234567890', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400', TRUE),
('l2a3b4c5-d6e7-8901-bcde-f12345678901', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400', TRUE),
('m3b4c5d6-e7f8-9012-cdef-123456789012', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400', TRUE),
('n4c5d6e7-f8a9-0123-def1-234567890123', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=400', TRUE),
('o5d6e7f8-a9b0-1234-ef12-345678901234', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=400', TRUE);

-- =============================================
-- 4. INSERT SUCCESS STORIES
-- =============================================
INSERT INTO public.success_stories (partner1_name, partner2_name, wedding_date, story_quote, image_url, is_featured) VALUES
(
  'Priyanka Tripathi', 'Abhay Tripathi', '2026-02-10',
  'We found each other on Bhartiya Rishtey and connected instantly. The verification process gave us trust.',
  'https://image2url.com/r2/default/images/1771311548543-4a727854-3779-41e8-9b9d-f3d7d09c06e8.jpeg',
  TRUE
),
(
  'Praneet Dubey', 'Manju Dubey', '2025-12-02',
  'Bhartiya Rishtey is truly a blessing. We found our soulmate within months of joining.',
  'https://image2url.com/r2/default/images/1771316045360-702dc817-a88e-44cc-9abe-46456cd0ae0b.jpeg',
  TRUE
),
(
  'Akash Tiwari', 'Supriya Pandey', '2026-02-14',
  'Bhartiya Rishtey made our meeting possible. It''s the most reliable platform for finding a genuine life partner.',
  'https://image2url.com/r2/default/images/1771315543513-db5721e6-ea58-4468-8aa3-2b6af326d36a.jpeg',
  TRUE
),
(
  'Rikhita Trivedi', 'Akhil Upadhya', '2024-01-15',
  'A perfect match made in heaven, facilitated by this amazing platform.',
  'https://image2url.com/r2/default/images/1771311863671-facd1ba9-cb77-4536-b077-031a85bf351f.jpeg',
  TRUE
);

COMMIT;