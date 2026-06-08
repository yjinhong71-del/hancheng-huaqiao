'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';

type Conversation = { partner_id: string; partner_name: string; partner_photo: string; last_message: string; last_time: string; last_sender_id: string; unread: number };
type Message = { id: string; sender_id: string; sender_name: string; receiver_id: string; content: string; created_at: string; read: number; is_anonymous?: number };

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchUser = useCallback(async () => {
    const r = await fetch('/api/auth/user-session');
    if (r.ok) {
      const d = await r.json();
      if (!d.loggedIn) { router.push('/login'); return; }
      setUser(d);
    } else { router.push('/login'); }
  }, [router]);

  const fetchConversations = useCallback(async () => {
    const r = await fetch('/api/messages/conversations');
    if (r.ok) setConversations(await r.json());
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (partnerId: string) => {
    const r = await fetch(`/api/messages?with=${partnerId}`);
    if (r.ok) setMessages(await r.json());
    if (partnerId !== '__anonymous__') await fetch(`/api/messages/read?with=${partnerId}`, { method: 'PUT' });
    fetchConversations();
  }, [fetchConversations]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(() => { fetchMessages(activeChat); }, 2000);
    return () => clearInterval(interval);
  }, [activeChat, fetchMessages]);

  useEffect(() => { fetchUser().then(() => fetchConversations()); }, [fetchUser, fetchConversations]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const withId = p.get('with');
    if (!withId || loading) return;
    const exists = conversations.find(c => c.partner_id === withId);
    if (exists) {
      setActiveChat(withId);
      fetchMessages(withId);
      setMobileView('chat');
    } else {
      fetch(`/api/people/${withId}`).then(r => r.json()).then(person => {
        if (person.name) {
          setConversations(prev => [{
            partner_id: withId, partner_name: person.name,
            partner_photo: person.photo_url || '', last_message: '',
            last_time: '', last_sender_id: '', unread: 0
          }, ...prev]);
          setActiveChat(withId);
          fetchMessages(withId);
          setMobileView('chat');
        }
      });
    }
  }, [conversations, loading]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectChat = (partnerId: string) => {
    setActiveChat(partnerId);
    fetchMessages(partnerId);
    setMobileView('chat');
  };

  const sendMessage = async () => {
    const text = inputRef.current?.value?.trim();
    if (!text || !activeChat) return;
    const r = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: activeChat, content: text, is_anonymous: isAnonymous ? 1 : 0 })
    });
    if (r.ok) {
      const msg = await r.json();
      setMessages(prev => [...prev, msg]);
      if (inputRef.current) inputRef.current.value = '';
      fetchConversations();
    } else {
      const d = await r.json();
      alert(d.error || '发送失败');
    }
  };

  const activeConversation = conversations.find(c => c.partner_id === activeChat);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">
      <div className="glass-card rounded-3xl h-[70vh] animate-shimmer" />
    </div>
  );

  const ConversationList = () => (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-6 text-center">
          <MessageCircle size={32} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-xs text-neutral-500">暂无对话</p>
        </div>
      ) : (
        conversations.map(c => (
          <button key={c.partner_id} onClick={() => selectChat(c.partner_id)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-black/[0.02] transition-colors ${activeChat === c.partner_id ? 'bg-black/[0.04]' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-black/[0.04] flex items-center justify-center shrink-0">
              {c.partner_photo ? <img src={c.partner_photo} className="w-full h-full rounded-full object-cover" alt="" /> : <User size={18} className="text-neutral-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black truncate">{c.partner_name}</span>
                {c.unread > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 ml-1">{c.unread}</span>}
              </div>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{c.last_sender_id === user?.personId ? '你: ' : ''}{c.last_message || '开始聊天...'}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <AnimatedSection>
        <h1 className="text-2xl font-bold text-black mb-6 tracking-tight">私信</h1>
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <div className="glass-card rounded-3xl overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          <div className="hidden md:flex h-full">
            <div className="w-[280px] shrink-0 border-r border-black/[0.06] flex flex-col">
              <div className="p-4 border-b border-black/[0.04]"><h3 className="text-sm font-semibold text-neutral-700">对话</h3></div>
              <ConversationList />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              {activeChat && activeConversation ? (
                <>
                  <div className="p-4 border-b border-black/[0.04]"><span className="text-sm font-semibold text-black">{activeConversation.partner_name}</span></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_id === user?.personId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user?.personId ? 'bg-blue-500 text-white rounded-br-md' : 'bg-black/[0.05] text-black rounded-bl-md'}`}>{m.content}</div>
                      </div>
                    ))}
                    <div ref={messagesEnd} />
                  </div>
                  <div className="p-4 border-t border-black/[0.04] flex items-center gap-2 relative z-10">
                    <input ref={inputRef} type="text" defaultValue=""
                      placeholder={activeChat === '__anonymous__' ? '回复匿名消息...' : '输入消息...'}
                      className="flex-1 px-4 py-2.5 text-sm bg-white/60 border border-black/[0.06] rounded-full focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all" />
                    <label className="flex items-center gap-1 text-[11px] text-neutral-500 cursor-pointer shrink-0">
                      <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-3.5 h-3.5 rounded" />匿名
                    </label>
                    <button onClick={sendMessage} className="p-2.5 sm:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors active:scale-[0.95] shrink-0 relative z-20">
                      <Send size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto text-neutral-300 mb-3" />
                    <p className="text-sm text-neutral-500">选择一个对话开始聊天</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="md:hidden h-full flex flex-col">
            {mobileView === 'list' ? (
              <>
                <div className="p-4 border-b border-black/[0.04]"><h3 className="text-sm font-semibold text-neutral-700">对话</h3></div>
                <ConversationList />
              </>
            ) : (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-black/[0.04] flex items-center gap-3">
                  <button onClick={() => { setMobileView('list'); setActiveChat(null); }} className="p-1.5 text-neutral-500 hover:text-black rounded-full transition-colors"><ArrowLeft size={20} /></button>
                  <span className="text-sm font-semibold text-black">{activeConversation?.partner_name}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_id === user?.personId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${m.sender_id === user?.personId ? 'bg-blue-500 text-white rounded-br-md' : 'bg-black/[0.05] text-black rounded-bl-md'}`}>{m.content}</div>
                    </div>
                  ))}
                  <div ref={messagesEnd} />
                </div>
                <div className="p-3 border-t border-black/[0.04] flex items-center gap-2 pb-safe relative z-10">
                  <input ref={inputRef} type="text" defaultValue=""
                    placeholder={activeChat === '__anonymous__' ? '回复匿名消息...' : '输入消息...'}
                    className="flex-1 px-4 py-2.5 text-sm bg-white/60 border border-black/[0.06] rounded-full focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all" />
                  <label className="flex items-center gap-1 text-[11px] text-neutral-500 cursor-pointer shrink-0">
                    <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-3.5 h-3.5 rounded" />匿名
                  </label>
                  <button onClick={sendMessage} className="p-2.5 sm:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors active:scale-[0.95] shrink-0 relative z-20">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
