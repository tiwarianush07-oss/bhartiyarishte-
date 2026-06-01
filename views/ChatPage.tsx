import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getConversations, getMessages, sendMessage, markAsRead, subscribeToUserChannel, MESSAGES_PER_PAGE } from '../services/chatService';
import { ChatConversation, ChatMessage, Profile } from '../types';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  // State for progressive loading
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    const setupUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setLoading(false);
      }
    };
    setupUser();
  }, []);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleNewMessage = useCallback((payload: any) => {
    const incoming: ChatMessage = payload.payload;

    // If the message belongs to the current open chat, append it
    if (activeConversation?.id === incoming.conversation_id) {
      setMessages(prev => {
        if (prev.find(m => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
      markAsRead(incoming.conversation_id);
      setTimeout(() => scrollToBottom(), 100);
    }

    // Refresh conversation list to update snippets/unread counts
    if (currentUserId) getConversations(currentUserId).then(setConversations).catch(console.error);
  }, [activeConversation, currentUserId, scrollToBottom]);

  const handleReadReceipt = useCallback((payload: any) => {
    const { conversation_id, last_read_at } = payload.payload;
    if (activeConversation?.id === conversation_id) {
      setActiveConversation(prev => prev ? {
        ...prev,
        other_participant: {
          ...prev.other_participant,
          last_read_at
        }
      } : null);
    }
  }, [activeConversation]);

  const loadConversations = useCallback(async (uid: string) => {
    setLoading(true);
    setLoadError(null);

    // 10-second timeout guard — prevents infinite loading spinner
    const timeoutId = setTimeout(() => {
      setLoadError('Loading conversations took too long. Please check your connection.');
      setLoading(false);
    }, 10000);

    try {
      const data = await getConversations(uid);
      clearTimeout(timeoutId);
      setConversations(data);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setLoadError(err?.message || 'Failed to load conversations. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadConversations(currentUserId);

    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    const channel = subscribeToUserChannel(currentUserId, handleNewMessage, handleReadReceipt);
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [currentUserId, handleNewMessage, handleReadReceipt, loadConversations]);

  const selectConversation = async (conv: ChatConversation) => {
    setActiveConversation(conv);
    setMobileView('chat');

    setMessages([]);
    setHasMore(true);
    setPage(1); // page 0 will be loaded immediately below, so next load-more starts at page 1

    const initialMsgs = await getMessages(conv.id, 0);
    setMessages(initialMsgs);
    if (initialMsgs.length < MESSAGES_PER_PAGE) {
      setHasMore(false);
    }

    setTimeout(() => scrollToBottom('auto'), 0);

    if (conv.unread_count > 0) {
      await markAsRead(conv.id);
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    }
  };

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !activeConversation) return;
    const container = messageContainerRef.current;
    if (!container) return;
    const oldScrollHeight = container.scrollHeight;

    setLoadingMore(true);
    try {
      const olderMessages = await getMessages(activeConversation.id, page);
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setPage(prev => prev + 1);
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }
        });
      }
      if (olderMessages.length < MESSAGES_PER_PAGE) {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [activeConversation, hasMore, loadingMore, page]);

  const handleScroll = () => {
    if (messageContainerRef.current && messageContainerRef.current.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !currentUserId) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const sentMsg = await sendMessage(activeConversation.other_participant.user_id, content);
      setMessages(prev => [...prev, sentMsg]);
      scrollToBottom();
      // Update list snippet
      getConversations(currentUserId).then(setConversations);
    } catch (err: any) {
      alert("Failed to send: " + err.message);
      setNewMessage(content); // restore content on failure
    }
  };

  const lastMessage = messages[messages.length - 1];
  const otherLastRead = (activeConversation?.other_participant as any)?.last_read_at;
  const isLastMessageSeen = lastMessage?.sender_id === currentUserId &&
    otherLastRead &&
    new Date(otherLastRead) >= new Date(lastMessage.created_at);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Conversations...</p>
      </div>
    );
  }

  if (loadError && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-3xl">⚠️</div>
        <div className="text-center">
          <p className="font-black text-gray-900 uppercase tracking-widest text-sm mb-2">Could Not Load Conversations</p>
          <p className="text-gray-400 text-sm max-w-sm">{loadError}</p>
        </div>
        <button
          onClick={() => currentUserId && loadConversations(currentUserId)}
          className="px-8 py-3 bg-brand text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 py-0 sm:py-8 h-[calc(100vh-100px)]">
      <div className="bg-white rounded-none sm:rounded-[2.5rem] border-none sm:border shadow-none sm:shadow-2xl flex h-full overflow-hidden">

        {/* Contacts Sidebar */}
        <aside className={`w-full md:w-96 border-r flex-col ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-8 border-b bg-gray-50/30">
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Inbox</h2>
          </div>
          <div className="flex-grow overflow-y-auto bg-white">
            {conversations.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-2xl mx-auto">💌</div>
                <h3 className="font-bold text-gray-900">No conversations yet</h3>
                <p className="text-sm text-gray-400">Mutual interests and premium plans unlock chat access.</p>
                <button onClick={() => navigate('/search')} className="bg-brand text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition">Find Matches</button>
              </div>
            ) : conversations.map((conv) => (
              <ConversationTab key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} onClick={() => selectConversation(conv)} />
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <div className={`flex-col flex-grow bg-gray-50/50 ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              <ChatHeader user={activeConversation.other_participant} onBack={() => setMobileView('list')} />
              <div
                ref={messageContainerRef}
                onScroll={handleScroll}
                className="flex-grow p-4 sm:p-8 overflow-y-auto space-y-6 scrollbar-hide"
              >
                {loadingMore && <div className="text-center p-2 text-[10px] font-black uppercase text-gray-400">Retrieving History...</div>}
                {messages.map((msg, idx) => (
                  <ChatBubble
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.sender_id === currentUserId}
                    showAvatar={idx === 0 || messages[idx - 1].sender_id !== msg.sender_id}
                    avatar={activeConversation.other_participant.avatar_url}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
              {isLastMessageSeen && (
                <div className="flex justify-end px-8 pb-3">
                  <p className="text-[10px] text-brand font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-brand rounded-full"></span>
                    Read
                  </p>
                </div>
              )}
              <ChatInput value={newMessage} onChange={setNewMessage} onSubmit={handleSendMessage} />
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-xl animate-bounce">💬</div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">Your Conversations</h3>
                <p className="text-gray-500 mt-2 max-w-xs">Select a profile from the left to start your journey of connection.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---
const ConversationTab: React.FC<{ conv: ChatConversation, isActive: boolean, onClick: () => void }> = ({ conv, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full p-6 flex items-center gap-4 hover:bg-gray-50 transition border-b group ${isActive ? 'bg-rose-50' : 'bg-white'}`}>
    <div className="relative shrink-0">
      <img
        src={conv.other_participant.avatar_url || `https://i.pravatar.cc/100?u=${conv.other_participant.user_id}`}
        className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition"
        alt={conv.other_participant.full_name}
      />
      {conv.unread_count > 0 && <span className="absolute -top-1 -right-1 bg-brand border-2 border-white w-4 h-4 rounded-full"></span>}
    </div>
    <div className="flex-grow text-left overflow-hidden">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-black text-sm tracking-tight truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{conv.other_participant.full_name}</span>
        {conv.last_message && <span className="text-[9px] text-gray-400 font-black uppercase shrink-0 tracking-widest">{new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
      <div className="flex justify-between items-center">
        <p className={`text-xs truncate max-w-[180px] ${conv.unread_count > 0 ? 'text-gray-900 font-bold' : 'text-gray-400 font-medium'}`}>{conv.last_message?.content || 'No messages yet'}</p>
        {conv.unread_count > 0 && <span className="bg-brand text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center shrink-0">{conv.unread_count}</span>}
      </div>
    </div>
  </button>
);

const ChatHeader = ({ user, onBack }: { user: Partial<Profile>, onBack: () => void }) => (
  <header className="p-6 bg-white border-b flex items-center justify-between shadow-sm relative z-10">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-brand transition">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <Link to={`/profile/${user.id}`} className="flex items-center gap-4 group">
        <img src={user.avatar_url || `https://i.pravatar.cc/100?u=${user.user_id}`} className="w-12 h-12 rounded-2xl object-cover shadow-inner group-hover:scale-105 transition" alt={user.full_name} />
        <div>
          <h3 className="font-black text-gray-900 text-base leading-none group-hover:text-brand transition">{user.full_name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">Verified Connection</p>
          </div>
        </div>
      </Link>
    </div>
    <div className="flex gap-2">
      <button className="p-3 text-gray-400 hover:text-brand hover:bg-rose-50 rounded-2xl transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
      </button>
    </div>
  </header>
);

const ChatBubble: React.FC<{ msg: ChatMessage, isOwn: boolean, showAvatar: boolean, avatar?: string }> = ({ msg, isOwn, showAvatar, avatar }) => (
  <div className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
    {!isOwn && (
      <div className="w-8 h-8 shrink-0">
        {showAvatar && <img src={avatar || `https://i.pravatar.cc/50`} className="w-full h-full rounded-lg object-cover" alt="avatar" />}
      </div>
    )}
    <div className={`max-w-[85%] sm:max-w-[70%] px-5 py-3.5 rounded-[1.8rem] shadow-sm flex flex-col ${isOwn ? 'bg-brand text-white rounded-br-none' : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'}`}>
      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
      <p className={`text-[9px] mt-1.5 font-black uppercase tracking-widest ${isOwn ? 'text-rose-100/70 text-right' : 'text-gray-400'}`}>
        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
);

const ChatInput = ({ value, onChange, onSubmit }: { value: string, onChange: (s: string) => void, onSubmit: (e: React.FormEvent) => void }) => (
  <form onSubmit={onSubmit} className="p-6 bg-white border-t flex gap-4 items-center">
    <div className="flex-grow relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your message..."
        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand outline-none transition-all font-medium text-gray-700"
      />
      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </button>
    </div>
    <button
      type="submit"
      disabled={!value.trim()}
      className="bg-brand text-white p-4 rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
    >
      <svg className="w-6 h-6 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
    </button>
  </form>
);

export default ChatPage;
