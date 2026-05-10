import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Send, CheckCircle, ShieldCheck, Upload, FileText, Ban } from 'lucide-react';
import { api } from '../services/api';
import { JobApplication, Message, Profile } from '../types';
import { useAuth } from '../context/AuthContext';

export default function JobWorkspaceModal({ 
  application, 
  onClose 
}: { 
  application: JobApplication, 
  onClose: () => void 
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeliverablesForm, setShowDeliverablesForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [finalFilesUrl, setFinalFilesUrl] = useState('');
  const [credentials, setCredentials] = useState('');

  const isClient = user?.uid === application.client_id;
  const isDev = user?.uid === application.developer_id;

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Polling for simplicity
    return () => clearInterval(interval);
  }, [application.id]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id !== user?.uid && !lastMsg.text.startsWith('SYSTEM:') && 'Notification' in window && Notification.permission === 'granted') {
        const key = `notified_${lastMsg.id}`;
        if (!sessionStorage.getItem(key)) {
          new Notification('New Message on Nexus', { body: lastMsg.text });
          sessionStorage.setItem(key, 'true');
        }
      }
    }
  }, [messages, user?.uid]);

  const loadMessages = async () => {
    try {
      const msgs = await api.jobMessages.list(application.id);
      setMessages(msgs as Message[]);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.jobMessages.send(application.id, text);
      setText('');
      loadMessages();
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async () => {
    setActionLoading(true);
    try {
      await api.applications.updateStatus(application.id, 'accepted');
      application.status = 'accepted';
      await api.jobs.updateStatus(application.job_id, 'in_progress');
      await api.jobMessages.send(application.id, "SYSTEM: Client accepted the proposal. Work is now in progress.");
      loadMessages();
    } catch(err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    if (!confirm("Are you sure you want to decline this application? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api.applications.updateStatus(application.id, 'rejected');
      application.status = 'rejected';
      await api.jobMessages.send(application.id, "SYSTEM: Application has been declined by the client.");
      loadMessages();
    } catch(err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.applications.update(application.id, {
        status: 'completed',
        deliverables: {
          preview_url: previewUrl,
          final_files_url: finalFilesUrl,
          credentials
        }
      });
      application.status = 'completed';
      application.deliverables = { preview_url: previewUrl, final_files_url: finalFilesUrl, credentials };
      await api.jobMessages.send(application.id, "SYSTEM: Developer submitted the final deliverables for review.");
      setShowDeliverablesForm(false);
      loadMessages();
    } catch(err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayAndRelease = async () => {
    const budget = application.job?.budget || 0;
    setActionLoading(true);
    try {
      const res = await fetch('/api/create-nowpayments-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: budget,
          currency: 'usd',
          order_description: `Payment for Job ${application.job?.title}`
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.invoice_url) {
        window.open(data.invoice_url, '_blank');
        processPaymentSuccess(`nowpayments:${data.id || data.invoice_id}`);
      } else {
        throw new Error('No invoice URL returned');
      }
    } catch (err: any) {
      console.error('NOWPayments error:', err);
      alert('Payment initialization failed: ' + err.message);
      setActionLoading(false);
    }
  };

  const processPaymentSuccess = async (paymentId: string) => {
    setActionLoading(true);
    try {
      await api.applications.updateStatus(application.id, 'paid');
      await api.jobs.updateStatus(application.job_id, 'completed');
      
      const budget = application.job?.budget || 0;
      await api.orders.create(
        application.job_id, 
        application.developer_id, 
        budget, 
        'nowpayments', 
        paymentId
      );

      application.status = 'paid';
      
      await api.messages.send(application.id, `SYSTEM: Payment of $${budget} released via NOWPayments. Nexus Commission (5%): $${(budget * 0.05).toFixed(2)}. Net to developer: $${(budget * 0.95).toFixed(2)}.`);
      loadMessages();
    } catch(err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#141414] border border-[#141414] dark:border-white/10 rounded-[40px] p-8 max-w-4xl w-full shadow-2xl h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-start mb-6 shrink-0 border-b border-[#141414]/10 dark:border-white/10 pb-6">
          <div>
            <span className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.4em] font-bold">Project Workspace</span>
            <h2 className="text-3xl font-medium font-sans tracking-tighter uppercase mt-1">{application.job?.title}</h2>
            <div className="flex gap-4 mt-4">
               {isDev && application.client && (
                 <div className="text-[10px] font-mono bg-[#141414]/5 dark:bg-white/5 py-2 px-4 rounded-xl">
                   <p className="opacity-50 uppercase tracking-widest mb-1">Client Contact</p>
                   <p><span className="font-bold">{application.client.username}</span> • {application.client.email}</p>
                 </div>
               )}
               {isClient && application.developer && (
                 <div className="text-[10px] font-mono bg-[#141414]/5 dark:bg-white/5 py-2 px-4 rounded-xl">
                   <p className="opacity-50 uppercase tracking-widest mb-1">Developer Contact</p>
                   <p><span className="font-bold">{application.developer.username}</span> • {application.developer.email}</p>
                 </div>
               )}
               <div className="text-[10px] font-mono bg-blue-500/10 text-blue-500 py-2 px-4 rounded-xl border border-blue-500/20">
                  <p className="opacity-50 uppercase tracking-widest mb-1">Status</p>
                  <p className="font-bold uppercase tracking-widest">{application.status}</p>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-6 pr-4 space-y-4 custom-scrollbar">
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.uid;
            const isSystem = msg.text.startsWith('SYSTEM:');
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center text-[10px] font-mono uppercase tracking-widest text-[#141414]/40 dark:text-white/40 my-4 bg-[#141414]/5 dark:bg-white/5 py-2 px-4 rounded-full w-fit mx-auto">
                  {msg.text}
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl p-4 ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#141414]/10 dark:bg-white/10 rounded-tl-sm'}`}>
                  <p className="font-sans text-sm">{msg.text}</p>
                  <span className="text-[9px] font-mono opacity-50 mt-2 block uppercase tracking-widest">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 space-y-4">
          {/* Application Portfolio / Samples */}
          {application.file_url && (
            <div className="bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest font-bold">Initial Proposal Shard</p>
                  <p className="text-[9px] opacity-40 uppercase tracking-widest">Developer Portfolio / Samples</p>
                </div>
              </div>
              <a 
                href={application.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#141414] dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Download Files
              </a>
            </div>
          )}

          {/* Deliverables Display */}
          {(application.status === 'completed' || application.status === 'paid') && application.deliverables && (
            <div className="bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-3">
               <h4 className="text-xs font-mono uppercase tracking-widest font-bold">Deliverables</h4>
               <div className="text-sm">
                 <p><span className="opacity-50">Preview URL:</span> <a href={application.deliverables.preview_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{application.deliverables.preview_url}</a></p>
                 {application.status === 'paid' && (
                   <>
                     <p><span className="opacity-50">Final Files:</span> <a href={application.deliverables.final_files_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{application.deliverables.final_files_url}</a></p>
                     <p className="mt-2"><span className="opacity-50">Credentials/Notes:</span><br/><span className="font-mono bg-black/10 dark:bg-black/50 p-2 rounded block mt-1">{application.deliverables.credentials}</span></p>
                   </>
                 )}
                 {application.status === 'completed' && isClient && (
                    <p className="text-[10px] font-mono text-amber-500 mt-2">Ownership transfer details & final files will be unlocked after payment.</p>
                 )}
               </div>
            </div>
          )}

          {/* Action Bar */}
          {application.status === 'pending' && isClient && (
            <div className="flex justify-between items-center bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
              <span className="text-xs font-mono text-blue-500 uppercase tracking-widest">Review Proposal</span>
              <div className="flex gap-2">
                <button 
                  onClick={handleRejectProposal}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                >
                  <Ban size={14} /> Decline
                </button>
                <button 
                  onClick={handleAcceptProposal}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Accept & Start Work
                </button>
              </div>
            </div>
          )}

          {application.status === 'rejected' && (
            <div className="flex justify-center items-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
              <span className="text-xs font-mono text-red-500 uppercase tracking-widest font-bold">Application Declined</span>
            </div>
          )}
          
          {application.status === 'pending' && isDev && (
            <div className="flex justify-center items-center bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl">
              <span className="text-xs font-mono uppercase tracking-widest opacity-50">Awaiting Client Acceptance...</span>
            </div>
          )}

          {application.status === 'accepted' && isDev && !showDeliverablesForm && (
            <div className="flex justify-between items-center bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
              <span className="text-xs font-mono text-blue-500 uppercase tracking-widest">Work in progress...</span>
              <button 
                onClick={() => setShowDeliverablesForm(true)}
                disabled={actionLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
              >
                <CheckCircle size={14} /> Submit Final Work
              </button>
            </div>
          )}

          {application.status === 'accepted' && isClient && (
            <div className="flex justify-center items-center bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl">
              <span className="text-xs font-mono uppercase tracking-widest opacity-50">Developer is working...</span>
            </div>
          )}

          {showDeliverablesForm && (
            <form onSubmit={handleFinishWork} className="bg-[#141414]/5 dark:bg-white/5 p-6 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-4">
               <div>
                 <label className="text-[10px] font-mono uppercase tracking-widest opacity-50 block mb-1">Preview Video / File (Client can see this now)</label>
                 <div className="flex gap-2">
                   <input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} className="flex-1 bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-2 outline-none font-sans" placeholder="Upload or enter URL..." />
                   <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-2">
                      <Upload size={14} /> Upload
                      <input type="file" className="hidden" accept="video/*,image/*" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           setActionLoading(true);
                           try {
                             const url = await api.files.upload(file, 'job_previews');
                             setPreviewUrl(url);
                           } catch(err) {
                             console.error("Upload failed", err);
                           } finally {
                             setActionLoading(false);
                           }
                         }
                      }} />
                   </label>
                 </div>
               </div>
               <div>
                 <label className="text-[10px] font-mono uppercase tracking-widest opacity-50 block mb-1">Final Files / Source Code (Hidden until paid)</label>
                 <div className="flex gap-2">
                   <input required value={finalFilesUrl} onChange={e => setFinalFilesUrl(e.target.value)} className="flex-1 bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-2 outline-none font-sans" placeholder="Upload or enter URL..." />
                   <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-2">
                      <Upload size={14} /> Upload
                      <input type="file" className="hidden" onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           setActionLoading(true);
                           try {
                             const url = await api.files.upload(file, 'job_finals');
                             setFinalFilesUrl(url);
                           } catch(err) {
                             console.error("Upload failed", err);
                           } finally {
                             setActionLoading(false);
                           }
                         }
                      }} />
                   </label>
                 </div>
               </div>
               <div>
                 <label className="text-[10px] font-mono uppercase tracking-widest opacity-50 block mb-1">Credentials / Transfer Notes (Hidden until paid)</label>
                 <textarea required value={credentials} onChange={e => setCredentials(e.target.value)} className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-2 outline-none font-sans" placeholder="Admin username:..." rows={3} />
               </div>
               <div className="flex justify-end gap-2 pt-2">
                 <button type="button" onClick={() => setShowDeliverablesForm(false)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100">Cancel</button>
                 <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                   Submit Deliverables
                 </button>
               </div>
            </form>
          )}

          {application.status === 'completed' && isDev && (
            <div className="flex justify-center items-center bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl">
              <span className="text-xs font-mono uppercase tracking-widest opacity-50">Deliverables submitted. Awaiting client review and payment...</span>
            </div>
          )}

          {application.status === 'completed' && isClient && (
            <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest cursor-pointer">Work submitted for review</span>
              <button 
                onClick={handlePayAndRelease}
                disabled={actionLoading}
                className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-full text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
              >
                <ShieldCheck size={14} /> Pay & Release (${application.job?.budget})
              </button>
            </div>
          )}
          
          {application.status === 'paid' && (
             <div className="flex justify-center items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
               <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest font-bold">Transaction Completed & Paid</span>
             </div>
          )}

          {application.status !== 'paid' && (
            <form onSubmit={handleSend} className="relative">
              <input 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Message..."
                className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-2xl pl-6 pr-16 py-4 outline-none font-sans"
              />
              <button 
                type="submit" 
                disabled={loading || !text.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl disabled:opacity-50 hover:scale-105 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
