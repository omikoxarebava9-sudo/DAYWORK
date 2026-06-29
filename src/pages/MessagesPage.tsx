import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { useAuth } from '../lib/auth-context';
import { supabase, Message, Profile, Job } from '../lib/supabase';
import { triggerChatMessageSent } from '../lib/webhooks';
import {
  Send,
  Image,
  MapPin,
  Languages,
  Loader2,
  ChevronLeft,
} from 'lucide-react';

type Conversation = {
  partner: Profile;
  lastMessage: Message;
  job?: Job;
  unread: number;
};

export function MessagesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile: currentUser, isGuest } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const partnerId = searchParams.get('to');
  const jobId = searchParams.get('job');

  useEffect(() => {
    if (!user && !isGuest) {
      navigate('/login');
      return;
    }
    fetchConversations();
    if (partnerId && jobId) {
      initializeConversation(partnerId, jobId);
    }
  }, [user, partnerId, jobId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.partner.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*, job:jobs(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const convMap = new Map<string, Conversation>();

      for (const msg of data) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .maybeSingle();

          if (partnerProfile) {
            convMap.set(partnerId, {
              partner: partnerProfile as Profile,
              lastMessage: msg as Message,
              job: msg.job as Job,
              unread: msg.receiver_id === user.id && !msg.is_read ? 1 : 0,
            });
          }
        }
      }

      setConversations(Array.from(convMap.values()));
    }

    setLoading(false);
  };

  const initializeConversation = async (partnerId: string, jobId: string) => {
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle();

    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (partnerProfile) {
      setSelectedConversation({
        partner: partnerProfile as Profile,
        lastMessage: {} as Message,
        job: job as Job,
        unread: 0,
      });
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedConversation.partner.id,
        job_id: selectedConversation.job?.id,
        content,
        type: 'text',
      })
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .maybeSingle();

    if (data) {
      setMessages([...messages, data as Message]);

      // Trigger n8n webhook for chat message (invisible backend automation)
      const senderProfile = data.sender as Profile;
      await triggerChatMessageSent({
        message_id: data.id,
        job_id: selectedConversation.job?.id,
        sender_id: user.id,
        sender_name: senderProfile?.full_name || 'Unknown',
        receiver_id: selectedConversation.partner.id,
        content,
        type: 'text',
      });
    }
    setSending(false);
  };

  if (isGuest) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-8">
          <h2 className="text-xl font-bold text-white mb-4">{t('auth.loginTitle')}</h2>
          <p className="text-zinc-400 mb-6">{t('messages.noMessages')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl"
          >
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)] flex">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-zinc-800`}>
          <div className="p-4 border-b border-zinc-800">
            <h1 className="text-xl font-bold text-white">{t('messages.title')}</h1>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-zinc-500 text-center">{t('messages.noMessages')}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.partner.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                    selectedConversation?.partner.id === conv.partner.id
                      ? 'bg-zinc-800/50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                      {conv.partner.avatar_url ? (
                        <img src={conv.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg text-zinc-400">{conv.partner.full_name?.[0] || '?'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{conv.partner.full_name}</p>
                      <p className="text-zinc-400 text-sm truncate">{conv.lastMessage?.content}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs text-black font-bold">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-zinc-900/50`}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                  {selectedConversation.partner.avatar_url ? (
                    <img src={selectedConversation.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-400">{selectedConversation.partner.full_name?.[0] || '?'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedConversation.partner.full_name}</p>
                  {selectedConversation.job && (
                    <p
                      onClick={() => navigate(`/job/${selectedConversation.job!.id}`)}
                      className="text-xs text-amber-400 cursor-pointer hover:text-amber-300"
                    >
                      {selectedConversation.job.title}
                    </p>
                  )}
                </div>
                <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors">
                  <Languages className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-zinc-500">{t('messages.noMessages')}</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2 ${
                          msg.sender_id === user?.id
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.type === 'image' && (
                          <img src={msg.content} alt="" className="max-w-full rounded mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    <Image className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                    <MapPin className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('messages.typeMessage')}
                    className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-zinc-500">{t('messages.noMessages')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
