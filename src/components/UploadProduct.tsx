import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Upload, FileCode, Video, Image as ImageIcon, Loader2, ShieldCheck, Tag, DollarSign, Cpu, Globe, AlertCircle, ArrowRight, Plus, Minus, History, CreditCard, Send, Mail, Layers, Zap, Info, CheckCircle, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import { api, UploadProgress } from '../services/api';
import { ProductType } from '../types';
import { cn } from '../lib/utils';
import Typewriter from './Typewriter';

interface UploadProductProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadProduct({ onClose, onSuccess }: UploadProductProps) {
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ProductType>('software');
  const [status, setStatus] = useState<'Listed' | 'Sold' | 'Archived' | 'Processing'>('Listed');
  const [version, setVersion] = useState('1.0.0');
  const [tags, setTags] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [licenseType, setLicenseType] = useState('MIT');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerTelegram, setSellerTelegram] = useState('');
  const [sellerDiscord, setSellerDiscord] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newTech, setNewTech] = useState('');
  const [newFeature, setNewFeature] = useState('');
  
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFolder, setMainFolder] = useState<FileList | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleDragOver = (e: React.DragEvent, setDragging: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent, setDragging: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDropMain = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMain(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setMainFile(e.dataTransfer.files[0]);
      setMainFolder(null);
      setValidationErrors(prev => ({ ...prev, mainFile: '' }));
    }
  };

  const handleDropPhotos = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhotos(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      const newFiles = files.filter(f => f.type.startsWith('image/'));
      setScreenshots(prev => [...prev, ...newFiles]);
    }
  };

  const handleDropVideos = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideos(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      const newFiles = files.filter(f => f.type.startsWith('video/'));
      setVideos(prev => [...prev, ...newFiles]);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Product title is required';
    else if (title.length < 3) errors.title = 'Title must be at least 3 characters';
    
    if (!description.trim()) errors.description = 'Product description is required';
    else if (description.length < 10) errors.description = 'Description must be at least 10 characters';

    const p = parseFloat(price);
    if (!price || isNaN(p) || p < 0) errors.price = 'Valid price is required (min: 0)';

    if (!mainFile && (!mainFolder || mainFolder.length === 0)) {
      errors.mainFile = 'Please upload a master file or a folder containing your website/app';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Required fields are missing or invalid.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fileToUpload: File | Blob | null = null;

      if (mainFolder && mainFolder.length > 0) {
        setZipping(true);
        const zip = new JSZip();
        for (let i = 0; i < mainFolder.length; i++) {
          const file = mainFolder[i];
          const path = file.webkitRelativePath || file.name;
          zip.file(path, file);
        }
        fileToUpload = await zip.generateAsync({ type: 'blob' });
        setZipping(false);
      } else {
        fileToUpload = mainFile;
      }

      if (!fileToUpload) throw new Error('Source file detection failure.');

      const allMedia = [...screenshots, ...videos];

      await api.products.upload(
        {
          title,
          category,
          description,
          price: parseFloat(price),
          type,
          status,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          live_demo_url: liveDemoUrl,
          youtube_url: youtubeUrl,
          license_type: licenseType,
          seller_email: sellerEmail,
          seller_telegram: sellerTelegram,
          seller_discord: sellerDiscord,
          features,
          metadata: {
            version,
            file_size: `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`,
            tech_stack: techStack
          }
        },
        fileToUpload as File,
        allMedia,
        thumbnail || undefined,
        (p) => setProgress(p)
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Upload protocol interrupted.');
    } finally {
      setLoading(false);
      setZipping(false);
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
               Nexus Protocol v4.0 // Registry
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white border border-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center pb-40">
           <div className="w-full max-w-4xl px-8 md:px-0 py-20 space-y-32">
              
              {/* Massive Hero */}
              <div className="space-y-6">
                <motion.span 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.5em] font-bold"
                >
                  Intellectual Property Transmission
                </motion.span>
                <h1 className="text-8xl md:text-9xl font-sans font-medium tracking-tighter uppercase text-white leading-[0.8] italic">
                   Register <br /> Your Asset.
                </h1>
                <p className="text-white/30 text-xl max-w-lg leading-relaxed">
                  Join the elite network of digital merchants. Upload your code, set your terms, and broadcast to the global node network.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-32">
                
                {/* Identity & Basic Info */}
                <div className="space-y-16">
                  <div className="space-y-4">
                     <h2 className="text-4xl font-medium font-sans uppercase tracking-tighter text-white">01 / Info.</h2>
                     <p className="text-white/20 text-sm max-w-md">Basic details for your product.</p>
                  </div>

                  <div className="space-y-12">
                    <div className="group relative">
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-4 block group-focus-within:text-blue-400 transition-colors">Product Title</label>
                      <input 
                        placeholder="My Awesome Product"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-transparent text-white border-b-2 border-white/5 py-6 focus:border-blue-500 outline-none transition-all text-6xl font-light tracking-tight placeholder:text-white/[0.02]"
                      />
                    </div>

                    <div className="group relative">
                      <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-4 block group-focus-within:text-emerald-500 transition-colors">Price (USD)</label>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={price}
                        placeholder="0.00"
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) setPrice(val);
                        }}
                        className="w-full bg-transparent text-white border-b-2 border-white/5 py-6 focus:border-emerald-500 outline-none transition-all text-6xl font-light tracking-tight placeholder:text-white/[0.02]"
                      />
                    </div>

                    <div className="group">
                       <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-4 block group-focus-within:text-blue-400">Description</label>
                       <textarea 
                          placeholder="Describe your product here..."
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          rows={4}
                          className="w-full bg-white/[0.02] text-white border border-white/10 px-10 py-8 rounded-[3rem] focus:border-blue-500 outline-none resize-none transition-all text-xl font-light leading-relaxed"
                       />
                    </div>
                  </div>
                </div>

                {/* Verification Links */}
                <div className="space-y-16">
                   <div className="space-y-4">
                      <h2 className="text-4xl font-medium font-sans uppercase tracking-tighter text-white">02 / Links.</h2>
                      <p className="text-white/20 text-sm max-w-md">Provide links so buyers can verify your product.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="group">
                        <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-4 block group-focus-within:text-blue-500">Website URL (Live Demo)</label>
                        <input 
                          placeholder="https://test.com"
                          value={liveDemoUrl}
                          onChange={e => setLiveDemoUrl(e.target.value)}
                          className="w-full bg-transparent text-white border-b border-white/10 py-5 focus:border-blue-500 outline-none transition-all text-xl font-light"
                        />
                      </div>
                      <div className="group">
                        <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-4 block group-focus-within:text-red-500">Video Demo URL (YouTube)</label>
                        <input 
                          placeholder="https://youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={e => setYoutubeUrl(e.target.value)}
                          className="w-full bg-transparent text-white border-b border-white/10 py-5 focus:border-red-500 outline-none transition-all text-xl font-light"
                        />
                      </div>
                   </div>
                </div>

                {/* Assets / Media */}
                <div className="space-y-16">
                   <div className="space-y-4">
                      <h2 className="text-4xl font-medium font-sans uppercase tracking-tighter text-white">03 / Visuals.</h2>
                      <p className="text-white/20 text-sm max-w-md">Display the interface and experience of your asset.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="aspect-[4/3] relative rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center gap-4 group hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all cursor-pointer overflow-hidden">
                         <input type="file" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setThumbnail(file);
                         }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ImageIcon size={32} className="text-white/40" />
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-white uppercase tracking-widest leading-loose">{thumbnail ? thumbnail.name : 'Master Thumbnail'}</span>
                            <span className="text-[10px] text-white/20 uppercase tracking-widest">Main Display Card</span>
                          </div>
                          {thumbnail && <div className="absolute top-4 right-4"><CheckCircle size={16} className="text-green-500" /></div>}
                      </div>

                      <div className="aspect-[4/3] relative rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center gap-4 group hover:border-purple-500/50 hover:bg-purple-500/[0.02] transition-all cursor-pointer overflow-hidden">
                         <input type="file" multiple accept="image/*" onChange={e => setScreenshots([...screenshots, ...Array.from(e.target.files || [])])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Layers size={32} className="text-white/40" />
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-white uppercase tracking-widest leading-loose">Visual Gallery</span>
                            <span className="text-[10px] text-white/20 uppercase tracking-widest">{screenshots.length} / 10 Assets Cached</span>
                          </div>
                          {screenshots.length > 0 && <div className="absolute top-4 right-4"><CheckCircle size={16} className="text-green-500" /></div>}
                      </div>

                      <div className="aspect-[4/3] relative rounded-[3rem] border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center gap-4 group hover:border-pink-500/50 hover:bg-pink-500/[0.02] transition-all cursor-pointer overflow-hidden">
                         <input type="file" multiple accept="video/*" onChange={e => setVideos([...videos, ...Array.from(e.target.files || [])])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Video size={32} className="text-white/40" />
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-white uppercase tracking-widest leading-loose">Motion Library</span>
                            <span className="text-[10px] text-white/20 uppercase tracking-widest">{videos.length} Streams Uploaded</span>
                          </div>
                          {videos.length > 0 && <div className="absolute top-4 right-4"><CheckCircle size={16} className="text-green-500" /></div>}
                      </div>
                   </div>
                </div>

                {/* Final Payload */}
                <div className="space-y-16">
                   <div className="space-y-4">
                      <h2 className="text-4xl font-medium font-sans uppercase tracking-tighter text-white">04 / Payload.</h2>
                      <p className="text-white/20 text-sm max-w-md">Upload the actual file or source code the buyer will receive.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className={cn(
                        "relative h-[300px] border-2 border-dashed rounded-[3.5rem] p-12 flex flex-col items-center justify-center gap-6 transition-all group overflow-hidden",
                        mainFile ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-blue-500/50 hover:bg-blue-500/5"
                      )}>
                        <input type="file" onChange={e => { setMainFile(e.target.files?.[0] || null); setMainFolder(null); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                          <FileCode size={40} />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-medium text-white uppercase tracking-tighter">{mainFile ? mainFile.name : 'Master Build Archive'}</p>
                          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mt-2 italic">Standardized Cluster Payload</p>
                        </div>
                      </div>

                      <div className={cn(
                        "relative h-[300px] border-2 border-dashed rounded-[3.5rem] p-12 flex flex-col items-center justify-center gap-6 transition-all group overflow-hidden",
                        mainFolder ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-orange-500/50 hover:bg-orange-500/5"
                      )}>
                        <input type="file" {...({ webkitdirectory: "", directory: "" } as any)} onChange={e => { setMainFolder(e.target.files); setMainFile(null); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                          <RefreshCw size={40} />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-medium text-white uppercase tracking-tighter">{mainFolder ? `${mainFolder.length} Nodes Indexed` : 'Directory Repository'}</p>
                          <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] mt-2 italic">Uncompressed Node Tree</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="pt-20">
                  <button
                     type="submit"
                     disabled={loading || zipping}
                     className="w-full h-32 bg-white text-black font-black uppercase text-xl tracking-[0.5em] rounded-[3rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-10 shadow-[0_50px_100px_rgba(255,255,255,0.1)] group"
                   >
                     {loading || zipping ? <Loader2 className="animate-spin text-black" size={40} /> : (
                       <>
                         Publish Asset
                         <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center group-hover:translate-x-4 transition-transform">
                           <ArrowRight size={32} />
                         </div>
                       </>
                     )}
                   </button>
                </div>
              </form>

              {/* Validation Feedback */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-10 rounded-[3rem] bg-red-500/10 border border-red-500/20 text-red-200 text-lg flex items-start gap-8"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-500 text-black flex items-center justify-center shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold uppercase tracking-widest text-xs">Synchronizer Rejection</p>
                      <p className="opacity-80">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* Global Loading Overlay */}
        <AnimatePresence>
          {(loading || zipping) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-3xl"
            >
              <div className="text-center space-y-12">
                 <div className="mx-auto w-40 h-40 relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-white/40" />
                    <Cpu className="absolute inset-0 m-auto text-white w-12 h-12 animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-4xl font-medium uppercase tracking-[0.4em] text-white">{zipping ? 'Zipping' : 'Casting'}</h2>
                    {progress && !zipping && (
                      <div className="w-64 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden mt-8">
                         <motion.div animate={{ width: `${progress.mainFile}%` }} className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                      </div>
                    )}
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.5em]">{zipping ? 'Bundling Directory...' : 'Transmitting Bits...'}</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
