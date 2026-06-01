
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Namaste. I am your Bhartiya Rishtey Assistant. I am here to help you find your life partner. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = {
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (!user) {
      setIsLoading(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'model',
          text: `💍 Welcome to Bhartiya Rishtey

नमस्ते 🙏
हमारे Matrimony platform में आपका स्वागत है।
अगर आपको किसी भी प्रकार की सहायता चाहिए तो नीचे दिए गए links का उपयोग करें:

👨💻 Customer Support:
📞 Call: [78986 80332](tel:+917898680332)
💬 WhatsApp: [Message Us](https://wa.me/917898680332)

📲 Join Our WhatsApp Group:
[https://whatsapp.com/channel/0029Vb80o0pDzgTDx1BpL02X](https://whatsapp.com/channel/0029Vb80o0pDzgTDx1BpL02X)

हमारी टीम आपको **best matrimony matches** ढूंढने में मदद करेगी।
धन्यवाद! 😊`,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
      }, 800);
      return;
    }

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY });

      const systemInstruction = `You are a polite AI assistant for Bhartiya Rishtey, an Indian matrimonial platform.

Your tone:
- Friendly and respectful.
- Simple Indian English.
- No emojis in formal replies.

Main Responsibilities:
1. PROFILE CREATION: Ask users step-by-step to collect:
- Full Name, Gender, Age, Height, Religion, Caste (optional), Marital Status, Education, Occupation, Annual Income (optional), City & State, Family Details, Partner Preferences.
- Validate inputs clearly and politely.

2. SUBSCRIPTION LOGIC: Only show plans AFTER profile completion or when explicitly asked.
- Self Service – ₹4,500 / 6 months: Added to paid WhatsApp group, profiles shared with contact numbers only within the group.
- VIP Service – ₹6,500 / 1 year: Everything in Self Service, plus priority profile handling and dedicated support.

3. PAYMENT SUPPORT: If asked:
- UPI / QR payment is available.
- After payment, ask user to share payment screenshot for confirmation.

4. PRIVACY & SAFETY:
- Never expose other users' contact details directly.
- State that data is shared only with consent.

STRICT RULES:
- Do not hallucinate profiles.
- Do not promise matches.
- Do not collect OTPs or passwords.
- If unsure, ask for clarification.

Website: https://bhartiyarishtey.com/
Support WhatsApp: https://whatsapp.com/channel/0029Vb80o0pDzgTDx1BpL02X`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: messages.concat(userMessage).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5,
          topP: 0.9,
        },
      });

      const modelText = response.text || "I apologize, but I am unable to process that right now. Please try again.";

      setMessages(prev => [...prev, {
        role: 'model',
        text: modelText,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I am having trouble connecting. Please try again later.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[90vw] sm:w-[400px] h-[550px] bg-white rounded-[2rem] shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-6">
          <div className="bg-brand p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">👤</div>
              <div>
                <h3 className="font-bold text-sm">Matrimony Assistant</h3>
                <p className="text-[10px] opacity-80">Online to help you</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-brand text-white' : 'bg-white text-gray-700 border'
                  }`}>
                  <div className="markdown-body prose prose-sm max-w-none">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border p-3 rounded-2xl flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow p-3 bg-gray-100 rounded-xl focus:ring-1 focus:ring-brand outline-none text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-brand text-white p-3 rounded-xl hover:bg-rose-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default AIChatBot;
