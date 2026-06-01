-- ============================================================
-- PHASE 10: DATABASE SCHEMA STABILIZATION
-- ============================================================

-- 1. Add missing frontend columns to public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS mother_tongue TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS annual_income TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Update send_chat_message function to use interests and plan_type
CREATE OR REPLACE FUNCTION send_chat_message(p_receiver_id uuid, p_content text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id uuid := auth.uid();
    v_conversation_id uuid;
    v_is_blocked boolean;
    v_can_chat boolean;
    v_new_message chat_messages;
BEGIN
    -- Block check
    SELECT EXISTS (
        SELECT 1 FROM user_blocks WHERE blocker_id = p_receiver_id AND blocked_id = v_sender_id
    ) INTO v_is_blocked;
    IF v_is_blocked THEN
        RAISE EXCEPTION 'You are blocked by this user.';
    END IF;

    -- Chat eligibility check: Mutual interest (accepted) or Premium/Elite plan
    SELECT EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = v_sender_id AND p.plan_type IN ('premium', 'elite')
    ) OR EXISTS (
        SELECT 1 FROM public.interests i
        WHERE 
            ((i.sender_id = v_sender_id AND i.receiver_id = p_receiver_id) OR (i.sender_id = p_receiver_id AND i.receiver_id = v_sender_id))
            AND i.status = 'accepted'
    ) INTO v_can_chat;

    IF NOT v_can_chat THEN
        RAISE EXCEPTION 'You must have a mutual interest or a premium plan to chat.';
    END IF;

    -- Find or create conversation
    SELECT cp1.conversation_id INTO v_conversation_id
    FROM chat_participants cp1
    JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = v_sender_id AND cp2.user_id = p_receiver_id;

    IF v_conversation_id IS NULL THEN
        INSERT INTO chat_conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;
        INSERT INTO chat_participants (conversation_id, user_id) VALUES (v_conversation_id, v_sender_id);
        INSERT INTO chat_participants (conversation_id, user_id) VALUES (v_conversation_id, p_receiver_id);
    END IF;

    -- Insert the message
    INSERT INTO chat_messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, v_sender_id, p_content)
    RETURNING * INTO v_new_message;
    
    RETURN row_to_json(v_new_message);
END;
$$;
