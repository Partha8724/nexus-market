import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileCode, Image as ImageIcon, Loader2, AlertCircle, ArrowRight, Layers, Cpu } from 'lucide-react';
import { api, UploadProgress } from '../services/api';
import { cn } from '../lib/utils';

interface UploadProductProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadProduct({ onClose, onSuccess }: UploadProductProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (!description.trim()) return 'Description is required';
    const p = parseFloat(price);
    if (!price || isNaN(p) || p < 0) return 'Valid price is required';
    if (!mainFile && !liveDemoUrl.trim()) return 'Please provide either an Asset File or a Live Demo URL';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.products.upload(
        {
          title,
          description,
          price: parseFloat(price),
          type: 'software',
          status: 'Listed',
          tags: [],
          live_demo_url: liveDemoUrl,
          youtube_url: '',
          features: [],
          metadata: {
            version: '1.0.0',
            file_size: mainFile ? `${(mainFile.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
            tech_stack: []
          }
        },
        mainFile,
        [],
        thumbnail || undefined,
        (p) => setProgress(p)
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Upload protocol interrupted.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[#0a0a0a] overflow-hidden"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full h-full flex flex-col"
      >
        {/* Navigation Bar */}
        <div className="flex shrink-0 h-20 px-8 justify-between items-center z-[110] bg-black/20 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-[0.3em] font-bold text-white/40">
               Nexus Fast Deploy
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white border border-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center pb-40">
           <div className="w-full max-w-4xl px-8 md:px-0 py-20 space-y-16">
              
              <div className="space-y-4">
                <h1 className="text-6xl md:text-8xl font-sans font-medium tracking-tighter uppercase text-white leading-[0.8] italic">
                   Deploy Asset.
                </h1>
                <p className="text-white/30 text-lg max-w-lg leading-relaxed">
                  Quickly publish your product to the global network. Just the essentials.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                
                <div className="space-y-8">
                  <div className="group relative">
                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-2 block group-focus-within:text-blue-400 transition-colors">Product Title</label>
                    <input 
                      placeholder="e.g. AI Content Generator App"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full bg-transparent text-white border-b border-white/10 py-4 focus:border-blue-500 outline-none transition-all text-3xl font-light tracking-tight placeholder:text-white/10"
                    />
                  </div>

                  <div className="group relative">
                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-2 block group-focus-within:text-emerald-500 transition-colors">Price (USD)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={price}
                      placeholder="49.99"
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) setPrice(val);
                      }}
                      className="w-full bg-transparent text-white border-b border-white/10 py-4 focus:border-emerald-500 outline-none transition-all text-3xl font-light tracking-tight placeholder:text-white/10"
                    />
                  </div>

                  <div className="group relative">
                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-2 block group-focus-within:text-blue-400">Description</label>
                    <textarea 
                       placeholder="A brief overview of your product..."
                       value={description}
                       onChange={e => setDescription(e.target.value)}
                       rows={3}
                       className="w-full bg-white/5 text-white border border-white/10 p-6 rounded-2xl focus:border-blue-500 outline-none resize-none transition-all text-lg font-light"
                    />
                  </div>

                  <div className="group relative">
                    <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-2 block group-focus-within:text-blue-500">Live Demo or Product URL (Optional if providing a file)</label>
                    <input 
                      placeholder="https://my-app.vercel.app"
                      value={liveDemoUrl}
                      onChange={e => setLiveDemoUrl(e.target.value)}
                      className="w-full bg-transparent text-white border-b border-white/10 py-4 focus:border-blue-500 outline-none transition-all text-xl font-light placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="aspect-[16/9] relative rounded-3xl border-2 border-dashed border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center gap-4 group hover:border-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer overflow-hidden">
                     <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setThumbnail(file);
                     }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                     <ImageIcon size={32} className={cn("transition-colors", thumbnail ? "text-blue-400" : "text-white/20")} />
                     <div className="text-center">
                       <span className="block text-sm text-white">{thumbnail ? thumbnail.name : 'Upload Display Image'}</span>
                       <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1 block">PNG, JPG, WEBP</span>
                     </div>
                  </div>

                  <div className="aspect-[16/9] relative rounded-3xl border-2 border-dashed border-white/10 bg-white/5 p-6 flex flex-col items-center justify-center gap-4 group hover:border-emerald-500 hover:bg-emerald-500/10 transition-all cursor-pointer overflow-hidden">
                     <input type="file" onChange={e => setMainFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                     <FileCode size={32} className={cn("transition-colors", mainFile ? "text-emerald-400" : "text-white/20")} />
                     <div className="text-center">
                       <span className="block text-sm text-white">{mainFile ? mainFile.name : 'Upload Product File (Optional)'}</span>
                       <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1 block">ZIP, PDF, Code</span>
                     </div>
                  </div>
                </div>

                <button
                   type="submit"
                   disabled={loading}
                   className="w-full h-20 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-lg group"
                 >
                   {loading ? <Loader2 className="animate-spin" size={24} /> : (
                     <>
                       Deploy Now
                       <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                     </>
                   )}
                </button>
              </form>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 text-red-200"
                  >
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md"
            >
              <div className="text-center space-y-8">
                 <Cpu className="mx-auto text-white w-12 h-12 animate-pulse" />
                 <h2 className="text-2xl font-medium tracking-[0.2em] text-white uppercase">Deploying Asset...</h2>
                 {progress && (
                   <div className="w-64 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden mt-8">
                      <motion.div animate={{ width: `${progress.mainFile}%` }} className="h-full bg-white" />
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
