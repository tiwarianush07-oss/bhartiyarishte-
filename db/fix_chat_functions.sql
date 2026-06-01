-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT unique_block UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own blocks" ON public.user_blocks;
CREATE POLICY "Users manage own blocks" ON public.user_blocks
FOR ALL TO authenticated
USING (blocker_id = (SELECT auth.uid()));

-- Create get_user_conversations_v2 function
CREATE OR REPLACE FUNCTION get_user_conversations_v2(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    other_participant json,
    last_message json,
    unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH user_convos AS (
    SELECT cp.conversation_id
    FROM chat_participants cp
    WHERE cp.user_id = p_user_id
),
last_messages AS (
    SELECT
        cm.conversation_id,
        cm.id,
        cm.sender_id,
        cm.content,
        cm.created_at,
        cm.deleted_for_sender,
        cm.deleted_for_receiver,
        ROW_NUMBER() OVER(PARTITION BY cm.conversation_id ORDER BY cm.created_at DESC) as rn
    FROM chat_messages cm
    WHERE cm.conversation_id IN (SELECT conversation_id FROM user_convos)
),
unread_counts AS (
    SELECT
        cm.conversation_id,
        count(*) as unreads
    FROM chat_messages cm
    JOIN chat_participants cp ON cm.conversation_id = cp.conversation_id AND cp.user_id = p_user_id
    WHERE 
      cm.conversation_id IN (SELECT conversation_id FROM user_convos)
      AND cm.sender_id != p_user_id
      AND (cp.last_read_at IS NULL OR cm.created_at > cp.last_read_at)
    GROUP BY cm.conversation_id
)
SELECT
    uc.conversation_id AS id,
    (SELECT row_to_json(p.*) FROM profiles p WHERE p.user_id = op.user_id) AS other_participant,
    (SELECT row_to_json(lm.*) FROM last_messages lm WHERE lm.conversation_id = uc.conversation_id AND lm.rn = 1) AS last_message,
    COALESCE(ucnt.unreads, 0) as unread_count
FROM user_convos uc
JOIN chat_participants op ON uc.conversation_id = op.conversation_id AND op.user_id != p_user_id
LEFT JOIN unread_counts ucnt ON uc.conversation_id = ucnt.conversation_id;
$$;

-- Create send_chat_message function
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
    SELECT EXISTS (
        SELECT 1 FROM user_blocks WHERE blocker_id = p_receiver_id AND blocked_id = v_sender_id
    ) INTO v_is_blocked;
    IF v_is_blocked THEN
        RAISE EXCEPTION 'You are blocked by this user.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM users u WHERE u.id = v_sender_id AND u.is_premium = true
    ) OR EXISTS (
        SELECT 1 FROM interests i
        WHERE 
            ((i.from_user_id = v_sender_id AND i.to_user_id = p_receiver_id) OR (i.from_user_id = p_receiver_id AND i.to_user_id = v_sender_id))
            AND i.status = 'accepted'
    ) INTO v_can_chat;
    IF NOT v_can_chat THEN
        RAISE EXCEPTION 'You must have a mutual interest or a premium plan to chat.';
    END IF;

    SELECT cp1.conversation_id INTO v_conversation_id
    FROM chat_participants cp1
    JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = v_sender_id AND cp2.user_id = p_receiver_id;

    IF v_conversation_id IS NULL THEN
        INSERT INTO chat_conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;
        INSERT INTO chat_participants (conversation_id, user_id) VALUES (v_conversation_id, v_sender_id);
        INSERT INTO chat_participants (conversation_id, user_id) VALUES (v_conversation_id, p_receiver_id);
    END IF;

    INSERT INTO chat_messages (conversation_id, sender_id, content)
    VALUES (v_conversation_id, v_sender_id, p_content)
    RETURNING * INTO v_new_message;
    
    RETURN row_to_json(v_new_message);
END;
$$;

-- Chat RLS policies
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
CREATE POLICY "chat_messages_select" ON public.chat_messages
FOR SELECT TO authenticated
USING (
    conversation_id IN (
        SELECT conversation_id FROM chat_participants WHERE user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "chat_participants_select" ON public.chat_participants;
CREATE POLICY "chat_participants_select" ON public.chat_participants
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR conversation_id IN (
    SELECT conversation_id FROM chat_participants WHERE user_id = (SELECT auth.uid())
));

DROP POLICY IF EXISTS "chat_participants_update" ON public.chat_participants;
CREATE POLICY "chat_participants_update" ON public.chat_participants
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));
