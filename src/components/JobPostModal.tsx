import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { ProductType } from '../types';
import { cn } from '../lib/utils';

export default function JobPostModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState<ProductType | 'other'>('website');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.jobs.create({
        title,
        description,
        budget: parseFloat(budget),
        category
      });
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
        className="bg-white dark:bg-[#141414] border border-[#141414] dark:border-white/10 rounded-[40px] p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="text-[10px] font-mono text-purple-500 uppercase tracking-[0.4em] font-bold">Post a Requirement</span>
            <h2 className="text-4xl font-medium font-sans tracking-tighter uppercase leading-none italic mt-2">Hire Talent.</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 bg-red-500/10 p-4 rounded-xl text-xs font-mono">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Project Title</label>
            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Full-stack React Application"
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-6 py-4 outline-none font-sans transition-all text-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Project Description</label>
            <textarea 
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe requirements and deliverables..."
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-6 py-4 outline-none font-sans transition-all text-lg resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Budget ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  required 
                  type="number"
                  min="5"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="500"
                  className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none font-mono transition-all text-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-4 outline-none font-sans transition-all text-lg appearance-none"
              >
                <option value="website">Website/Theme</option>
                <option value="webapp">Web App</option>
                <option value="software">Desktop Software</option>
                <option value="script">Script/Bot</option>
                <option value="design">UI/UX Design</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#141414] dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform flex justify-center items-center gap-2"
            >
              {loading ? 'Posting...' : <><Save size={18}/> Publish Requirement</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
