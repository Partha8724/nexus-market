import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Send, Clock, CheckCircle2, ChevronRight, AlertCircle, ShieldQuestion, Activity, X, Monitor, Upload, Paperclip, Shield, Settings } from 'lucide-react';
import { api } from '../services/api';
import { Ticket } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function SupportView() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSupportTab, setActiveSupportTab] = useState<'tickets' | 'report'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // New ticket/report state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('support');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(false);
      const data = await api.tickets.listMy();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !message) return;
    try {
      setCreating(true);
      
      let attachmentUrl = '';
      if (attachment) {
        attachmentUrl = await api.files.upload(attachment, 'support_attachments');
      }

      await api.tickets.create(subject, message, category, attachmentUrl);
      setSubject('');
      setMessage('');
      setCategory('support');
      setAttachment(null);
      setShowCreate(false);
      await loadTickets();
    } catch (err) {
      alert('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div className="p-8 text-center opacity-40 italic">Syncing Support Nodes...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic">Protocol Assistance / Support</h2>
          <h1 className="text-4xl font-sans font-medium tracking-tighter uppercase">Support Nexus</h1>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-6 py-2 bg-[#141414] dark:bg-white text-white dark:text-black rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
        >
          <Plus size={16} /> Open New Signal
        </button>
      </div>

      <div className="flex gap-4 border-b border-[#141414]/10 dark:border-white/10 pb-4">
        <button 
          onClick={() => { setActiveSupportTab('tickets'); setShowCreate(false); }}
          className={cn(
             "text-xs font-bold uppercase tracking-widest pb-2 transition-all relative",
             activeSupportTab === 'tickets' ? "text-[#141414] dark:text-white" : "text-[#141414]/40 dark:text-white/40"
          )}
        >
          Active Signals
          {activeSupportTab === 'tickets' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => { setActiveSupportTab('report'); setShowCreate(false); }}
          className={cn(
             "text-xs font-bold uppercase tracking-widest pb-2 transition-all relative flex items-center gap-2",
             activeSupportTab === 'report' ? "text-red-500" : "text-[#141414]/40 dark:text-white/40"
          )}
        >
          <AlertCircle size={14} /> Report Center
          {activeSupportTab === 'report' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="wait">
          {showCreate ? (
            <motion.div 
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="md:col-span-2 p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold italic uppercase tracking-tight">Broadcast Signal</h3>
                 <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-[#141414]/5 dark:hover:bg-white/5 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Frequency / Category</label>
                    <div className="flex gap-2">
                      {['support', 'billing', 'report', 'technical', 'security'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat as any)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border",
                            category === cat 
                              ? "bg-[#141414] dark:bg-white text-white dark:text-black border-transparent" 
                              : "bg-transparent border-[#141414]/10 dark:border-white/10 opacity-60 hover:opacity-100"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Classification / Subject</label>
                    <input 
                      required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g., Payment latency identified in node_7"
                    className="w-full bg-[#141414]/5 dark:bg-black/40 border border-[#141414]/10 dark:border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Transmission Content</label>
                  <textarea 
                    required
                    rows={5}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Provide full technical context of the anomaly..."
                    className="w-full bg-[#141414]/5 dark:bg-black/40 border border-[#141414]/10 dark:border-white/10 rounded-2xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Attachment (Logs/Screenshots)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      onChange={e => setAttachment(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-[#141414]/5 dark:bg-black/40 border border-[#141414]/10 dark:border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 group-hover:border-blue-500/50 transition-colors">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Paperclip size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-mono truncate">{attachment ? attachment.name : 'Select file to attach'}</p>
                        <p className="text-[9px] opacity-40 uppercase tracking-widest">{attachment ? `${(attachment.size / 1024).toFixed(0)} KB Ready` : 'Optional protocol logs'}</p>
                      </div>
                      {attachment && (
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setAttachment(null); }}
                          className="relative z-20 p-1 hover:bg-red-500/10 text-red-500 rounded"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={creating}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> {creating ? 'Transmitting...' : 'Send Signal'}
                </button>
              </form>
            </motion.div>
          ) : activeSupportTab === 'report' ? (
             <div className="md:col-span-2 space-y-8">
               <div className="p-12 bg-red-500/5 border border-red-500/10 rounded-[3rem] text-center space-y-4">
                  <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield size={32} />
                  </div>
                  <h3 className="text-2xl font-bold uppercase italic tracking-tight">Integrity Enforcement Center</h3>
                  <p className="text-sm opacity-60 max-w-lg mx-auto">Report suspicious node activity, fraudulent assets, or platform security anomalies directly to the Nexus Overseers.</p>
                  <button 
                    onClick={() => { setCategory('report'); setSubject('SUSPICIOUS ACTIVITY REPORT'); setShowCreate(true); }}
                    className="px-8 py-3 bg-red-500 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-red-500/20"
                  >
                    Initiate Fraud Report Signal
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ReportBox icon={<AlertCircle />} title="Vulnerability" desc="Report platform security gaps or data leaks." />
                  <ReportBox icon={<Activity />} title="Fraud" desc="Report suspicious sellers or scam assets." />
                  <ReportBox icon={<Settings />} title="Exploit" desc="Report node behavioral anomalies or botting." />
               </div>
             </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                  <Activity size={14} /> Active Signals
                </h3>
                {tickets.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-[#141414]/10 dark:border-white/10 rounded-3xl opacity-20">
                    <ShieldQuestion size={40} className="mx-auto mb-4" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">Nexus nodes operating within nominal range</p>
                  </div>
                ) : (
                  tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={cn(
                        "w-full text-left p-6 rounded-3xl border transition-all relative group",
                        selectedTicket?.id === t.id 
                          ? "bg-[#141414] dark:bg-white text-white dark:text-black border-transparent shadow-xl" 
                          : "bg-white dark:bg-[#141414] border-[#141414]/10 dark:border-white/10 hover:border-blue-500/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                          t.status === 'open' ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                        )}>{t.status}</span>
                        <span className="text-[9px] font-mono opacity-40">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{t.subject}</h4>
                      <p className="text-[10px] opacity-60 line-clamp-1">{t.message}</p>
                      
                      {t.replies && t.replies.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                           <MessageSquare size={10} /> {t.replies.length} Responses detected
                        </div>
                      )}
                      
                      <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:right-3" />
                    </button>
                  ))
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] opacity-40 flex items-center gap-2">
                  <Clock size={14} /> Resolution Node
                </h3>
                {selectedTicket ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm space-y-6"
                  >
                    <div className="space-y-1 pb-4 border-b border-[#141414]/5 dark:border-white/5">
                      <h3 className="text-xl font-bold italic">{selectedTicket.subject}</h3>
                      <p className="text-[10px] font-mono opacity-40">HASH: {selectedTicket.id}</p>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase opacity-30">Original Transmission</span>
                            <span className="text-[8px] font-mono opacity-30">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                         </div>
                         <div className="p-4 bg-[#141414]/5 dark:bg-white/5 rounded-2xl text-[11px] leading-relaxed">
                            {selectedTicket.message}
                            
                            {(selectedTicket as any).attachment_url && (
                              <div className="mt-4 pt-4 border-t border-[#141414]/10 dark:border-white/10 text-right">
                                <a 
                                  href={(selectedTicket as any).attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                                >
                                  <Paperclip size={10} /> View Attachment
                                </a>
                              </div>
                            )}
                         </div>
                      </div>

                      {selectedTicket.replies?.map((r, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase text-purple-500">Support Response detected</span>
                              <span className="text-[8px] font-mono opacity-30">{new Date(r.created_at).toLocaleString()}</span>
                           </div>
                           <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-[11px] leading-relaxed italic">
                              {r.message}
                           </div>
                        </div>
                      ))}
                    </div>

                    {selectedTicket.status === 'open' ? (
                      <div className="pt-4 border-t border-[#141414]/5 dark:border-white/5">
                         <div className="bg-blue-500/10 p-3 rounded-xl flex items-center gap-3 text-blue-500">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Awaiting Node Operator Response</span>
                         </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-[#141414]/5 dark:border-white/5">
                         <div className="bg-green-500/10 p-3 rounded-xl flex items-center gap-3 text-green-500">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Signal Resolved & Secure</span>
                         </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-[#141414]/10 dark:border-white/10 rounded-[2rem] opacity-20">
                     <Monitor className="w-12 h-12 mb-4" />
                     <p className="text-[10px] font-mono uppercase tracking-widest text-center max-w-[200px]">Select a signal to analyze its resolution status</p>
                  </div>
                )}
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReportBox({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 bg-white dark:bg-[#141414] rounded-3xl border border-[#141414]/10 dark:border-white/10 hover:border-red-500/30 transition-all group">
      <div className="w-10 h-10 bg-[#141414]/5 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 18, className: "text-red-500" })}
      </div>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-[10px] opacity-40">{desc}</p>
    </div>
  );
}
