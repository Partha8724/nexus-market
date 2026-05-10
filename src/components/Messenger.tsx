import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Send, 
  User, 
  Shield, 
  Archive, 
  Trash2, 
  MoreVertical,
  ChevronLeft,
  Circle,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  Paperclip,
  Smile,
  Info,
  Maximize2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Conversation, Message } from '../types';
import { cn } from '../lib/utils';

export default function Messenger() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    
    // Set up polling for new messages if needed, or rely on parent Silent Refresh
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      const interval = setInterval(() => loadMessages(activeConversation.id, true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await api.conversations.list();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadMessages = async (convId: string, silent = false) => {
    try {
      if (!silent) setMessagesLoading(true);
      const data = await api.messages.getByConversationId(convId);
      // Only set if changed to avoid unnecessary re-renders
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeConversation || isSending) return;

    setIsSending(true);
    try {
      const sentMsg = await api.messages.send(activeConversation.id, inputText);
      setMessages(prev => [...prev, sentMsg]);
      setInputText('');
      loadConversations(); // Update snippet/timestamp in list
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const participant = c.participant;
    return participant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           participant?.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white dark:bg-[#0a0a0a] rounded-[2.5rem] border border-[#141414]/10 dark:border-white/5 overflow-hidden shadow-2xl relative z-10 transition-colors">
      
      {/* Sidebar: Conversation List */}
      <div className={cn(
        "w-full md:w-80 border-r border-[#141414]/10 dark:border-white/5 flex flex-col transition-all",
        activeConversation ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-[#141414]/5 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase tracking-tighter italic">Messages</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-[#141414]/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <Trash2 size={16} className="opacity-40" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#141414]/30 dark:text-white/30" />
            <input 
              type="text" 
              placeholder="Search Merchants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#141414]/5 dark:bg-white/5 border-none rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-8 flex flex-col items-center gap-4 opacity-30">
              <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Syncing Shards...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-[#141414]/5 dark:divide-white/5">
              {filteredConversations.map(conv => {
                const isActive = activeConversation?.id === conv.id;
                const participant = conv.participant;
                const isOnline = false; // Mock for now

                return (
                  <button 
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={cn(
                      "w-full p-4 flex gap-4 text-left hover:bg-[#141414]/5 dark:hover:bg-white/5 transition-all relative overflow-hidden group",
                      isActive && "bg-[#141414]/5 dark:bg-white/5"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] flex items-center justify-center font-bold text-lg shadow-lg">
                        {participant?.username?.[0] || 'U'}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-[#0a0a0a]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="text-sm font-bold uppercase tracking-tight truncate pr-2 group-hover:text-blue-500 transition-colors">
                          {participant?.username || 'Unknown Node'}
                        </h4>
                        <span className="text-[9px] font-mono opacity-40 uppercase whitespace-nowrap">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#141414]/40 dark:text-white/40 truncate italic">
                        {conv.last_message_snippet || 'Established nexus link...'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-[#141414]/20 dark:text-white/20 uppercase font-mono text-[10px] tracking-widest italic">
              No active nexus links found.
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Chat Window */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8f8f8] dark:bg-black/20">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#141414]/10 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0a0a0a]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeConversation.participant?.username?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">
                      {activeConversation.participant?.username || 'Unknown Merchant'}
                    </h3>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <Circle size={6} className="fill-green-500 text-green-500" />
                      <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Node Connected</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <Info size={18} className="opacity-40" />
                </button>
                <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <MoreVertical size={18} className="opacity-40" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar">
              {messagesLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                  <Clock size={32} className="animate-spin mb-4" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Decrypting Ledger...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, i) => {
                  const isOwn = msg.sender_id === user?.uid;
                  const showAvatar = i === 0 || messages[i-1].sender_id !== msg.sender_id;

                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3 max-w-[85%] md:max-w-[70%]",
                        isOwn ? "self-end flex-row-reverse" : "self-start"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg bg-neutral-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 opacity-0 transition-opacity",
                        showAvatar && "opacity-100"
                      )}>
                        {isOwn ? user?.email?.[0] : (activeConversation.participant?.username?.[0] || 'U')}
                      </div>
                      <div className="space-y-1">
                        <div className={cn(
                          "px-4 py-3 rounded-[1.5rem] text-sm break-words shadow-sm relative group",
                          isOwn 
                            ? "bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-tr-none" 
                            : "bg-white dark:bg-white/10 text-black dark:text-white rounded-tl-none border border-black/5 dark:border-white/5"
                        )}>
                          {msg.content}
                          <div className={cn(
                            "absolute bottom-[-20px] whitespace-nowrap text-[8px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity",
                            isOwn ? "right-0" : "left-0"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                  <div className="w-16 h-16 border border-dashed border-current rounded-full flex items-center justify-center">
                    <Shield size={32} />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-1">Encrypted Nexus Link Active</p>
                    <p className="text-[8px] font-mono uppercase tracking-widest opacity-60 italic leading-relaxed">Ensure protocol safety. Do not share credentials or terminal access keys.</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-[#141414]/10 dark:border-white/5">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-center gap-4 bg-[#f8f8f8] dark:bg-white/5 p-2 rounded-[1.8rem] border border-black/5 dark:border-white/10"
              >
                <div className="flex items-center gap-1 pl-2">
                  <button type="button" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-black/40 dark:text-white/40">
                    <ImageIcon size={18} />
                  </button>
                  <button type="button" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-black/40 dark:text-white/40">
                    <Paperclip size={18} />
                  </button>
                </div>
                <input 
                  type="text"
                  placeholder="Dispatch message to nexus..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent border-none py-2 px-1 focus:outline-none text-sm placeholder:text-black/30 dark:placeholder:text-white/30"
                />
                <div className="flex items-center gap-2 pr-1">
                  <button type="button" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-black/40 dark:text-white/40 hidden sm:block">
                    <Smile size={18} />
                  </button>
                  <button 
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all active:scale-90"
                  >
                    {isSending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/10 to-transparent border border-blue-500/20 flex items-center justify-center animate-pulse">
                <User size={48} className="text-blue-500/30" />
              </div>
              <Maximize2 className="absolute -top-4 -right-4 text-blue-500/20 animate-spin-slow" size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold uppercase tracking-tighter italic">Select Nexus Node</h3>
              <p className="text-xs text-[#141414]/40 dark:text-white/40 font-mono uppercase tracking-[0.2em] max-w-sm mx-auto italic">Synchronize with merchants and buyers for secure terminal communication.</p>
            </div>
            <button 
              onClick={() => {}}
              className="px-8 py-3 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-black/10 dark:shadow-white/5"
            >
              Start New Link
            </button>
          </div>
        )}
      </div>

      {/* Details Side Panel */}
      <AnimatePresence>
        {isDetailsOpen && activeConversation && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-[#141414]/10 dark:border-white/5 flex flex-col bg-white dark:bg-[#0a0a0a] overflow-hidden"
          >
            <div className="p-6 border-b border-[#141414]/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Nexus Info</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <div className="w-24 h-24 rounded-[2rem] bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] flex items-center justify-center font-bold text-3xl mb-4 shadow-xl">
                {activeConversation.participant?.username?.[0] || 'U'}
              </div>
              <h4 className="text-lg font-bold uppercase tracking-tight text-center mb-1">
                {activeConversation.participant?.username || 'Unknown Node'}
              </h4>
              <p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 font-bold mb-8 italic">Verified Merchant</p>
              
              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <div className="text-[9px] font-mono uppercase tracking-widest opacity-40 font-bold">Node Identity</div>
                  <div className="p-3 bg-[#141414]/5 dark:bg-white/5 rounded-xl font-mono text-[10px] truncate">
                    {activeConversation.participant?.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[9px] font-mono uppercase tracking-widest opacity-40 font-bold">Encrypted Logs</div>
                  <div className="flex gap-2">
                    <button className="flex-1 p-3 bg-[#141414]/5 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                      <Archive size={16} />
                    </button>
                    <button className="flex-1 p-3 bg-red-500/5 text-red-500 dark:bg-red-500/10 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
