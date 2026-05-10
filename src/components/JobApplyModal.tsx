import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Briefcase, Upload, FileCode } from 'lucide-react';
import { api } from '../services/api';
import { Job } from '../types';

export default function JobApplyModal({ job, onClose, onSuccess }: { job: Job, onClose: () => void, onSuccess: () => void }) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let fileUrl = '';
      if (file) {
        setUploading(true);
        fileUrl = await api.files.upload(file, 'portfolios');
        setUploading(false);
      }

      // Create the application
      const app = await api.applications.create(job.id, job.client_id, fileUrl);
      
      // If there's a cover letter message, send it as the first message
      if (message.trim()) {
        await api.jobMessages.send(app.id, message.trim());
      } else {
        await api.jobMessages.send(app.id, "SYSTEM: Developer started work. Waiting for further communication.");
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#141414] border border-[#141414] dark:border-white/10 rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <X size={24} />
        </button>

        <div className="mb-8 pr-12">
          <span className="text-[10px] font-mono text-purple-500 uppercase tracking-[0.4em] font-bold">Apply for Job</span>
          <h2 className="text-3xl font-medium font-sans tracking-tighter uppercase leading-none mt-2">{job.title}</h2>
          <p className="text-xs font-mono opacity-50 mt-2">Budget: ${job.budget} • Client: {job.client?.username || 'Unknown'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 bg-red-500/10 p-4 rounded-xl text-xs font-mono">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Initial Message / Proposal (Optional)</label>
            <textarea 
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you're a good fit..."
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-6 py-4 outline-none font-sans transition-all text-sm resize-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Project Samples / Portfolio (ZIP/PDF)</label>
            <div className="relative group">
              <input 
                type="file" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-full border border-dashed border-[#141414]/20 dark:border-white/10 rounded-xl px-6 py-4 flex items-center gap-4 group-hover:border-purple-500 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Upload size={18} />
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate">{file ? file.name : 'Upload sample files'}</p>
                  <p className="text-[9px] opacity-40 uppercase tracking-widest">{file ? `${(file.size / 1024).toFixed(0)} KB Ready` : 'Full project files or resume'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (uploading ? 'Uploading Portfolio...' : 'Submitting Signal...') : <><Briefcase size={18}/> Submit Application</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
