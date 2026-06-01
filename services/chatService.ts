import { supabase } from '../lib/supabase';
import { ChatConversation, ChatMessage } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export const MESSAGES_PER_PAGE = 30;

/**
 * Fetches all conversations for the current user.
 * This RPC function is responsible for joining the necessary tables to construct the conversation list.
 */
export async function getConversations(userId: string): Promise<ChatConversation[]> {
    const { data, error } = await supabase.rpc('get_user_conversations_v2', { p_user_id: userId });
    
    if (error) {
        console.error("Error fetching conversations:", error);
        throw error;
    }
    
    return data || [];
}
/*
-- NOTE: The following PostgreSQL function should be created in the Supabase SQL Editor.
-- It securely fetches conversation data for the logged-in user.

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

*/

/**
 * Fetches messages for a specific conversation with pagination.
 * Fetches in descending order and reverses, so page 0 is the newest set of messages.
 */
export async function getMessages(conversationId: string, page: number): Promise<ChatMessage[]> {
    const from = page * MESSAGES_PER_PAGE;
    const to = from + MESSAGES_PER_PAGE - 1;

    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(from, to);
        
    if (error) throw error;
    // Reverse the chunk to get ascending order for display
    return (data || []).reverse();
}

/**
 * Sends a new message via a secure RPC function.
 * @param receiverId The user ID of the recipient.
 * @param content The message text.
 */
export async function sendMessage(receiverId: string, content: string): Promise<ChatMessage> {
    const { data, error } = await supabase.rpc('send_chat_message', {
        p_receiver_id: receiverId,
        p_content: content
    });

    if (error) {
        console.error("Error sending message:", error);
        throw error;
    }
    return data;
}

/*
-- NOTE: Create this function in the Supabase SQL Editor.
-- It handles authorization, conversation creation, and message insertion securely.
CREATE OR REPLACE FUNCTION send_chat_message(p_receiver_id uuid, p_content text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_sender_id uuid := auth.uid();
    v_conversation_id uuid;
    v_is_blocked boolean;
    v_can_chat boolean;
    v_new_message chat_messages;
BEGIN
    -- Authorization Check 1: Blocked?
    SELECT EXISTS (
        SELECT 1 FROM user_blocks WHERE blocker_id = p_receiver_id AND blocked_id = v_sender_id
    ) INTO v_is_blocked;
    IF v_is_blocked THEN
        RAISE EXCEPTION 'You are blocked by this user.';
    END IF;

    -- Authorization Check 2: Chat unlocked? (Mutual interest or Premium)
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
*/


/**
 * Marks all messages in a conversation as read for the current user.
 * @param conversationId The ID of the conversation to mark as read.
 */
export async function markAsRead(conversationId: string): Promise<void> {
    const { error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
        
    if (error) {
        console.error("Error marking messages as read:", error);
    }
}

/**
 * Subscribes to realtime events on the user's private channel.
 */
export function subscribeToUserChannel(
    userId: string, 
    onNewMessage: (payload: any) => void,
    onReadReceipt: (payload: any) => void
): RealtimeChannel {
    const channel = supabase.channel(`private:${userId}`)
        .on('broadcast', { event: 'new_message' }, onNewMessage)
        .on('broadcast', { event: 'read_receipt' }, onReadReceipt)
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Connected to private channel: private:${userId}`);
            }
            if (err) {
                console.error('Private channel subscription error:', err);
            }
        });
        
    return channel;
}