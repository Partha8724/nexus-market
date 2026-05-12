import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { X, ArrowLeft, Cpu, Globe, Shield, User, Calendar, Tag, ExternalLink, Download, ShoppingCart, Star, MessageSquare, Activity, Wallet, CreditCard, Play, Eye, Info, CheckCircle, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { Product, Review } from '../types';
import { api } from '../services/api';
import { cn } from '../lib/utils';
import Tooltip from './ui/Tooltip';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onBuySuccess?: () => void;
  autoCheckout?: boolean;
}

export default function ProductDetail({ product, onClose, onBuySuccess, autoCheckout = false }: ProductDetailProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isConfirming, setIsConfirming] = useState(autoCheckout);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'upi' | 'bank' | 'nowpayments'>('crypto');
  const [paymentProof, setPaymentProof] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'seller'>('details');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMessaging, setIsMessaging] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    container: scrollRef
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    if (product.id) {
       api.reviews.getByProductId(product.id)
        .then(setReviews)
        .catch(() => {})
        .finally(() => setLoadingReviews(false));
    }
  }, [product.id]);

  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  
  // Total including 5% buyer fee or seller fee?
  // Let's keep it strictly platform commission taken later, but for display:
  const totalPrice = product.price;

  const handleContactSeller = async () => {
    if (isMessaging) {
      if (!messageText.trim()) return;
      setIsSendingMessage(true);
      try {
        const conv = await api.conversations.getOrCreate(product.id, product.creator_id);
        await api.messages.send(conv.id, messageText);
        setMessageText('');
        setIsMessaging(false);
        // Maybe show a success toast here
      } catch (err) {
        console.error('Failed to send message:', err);
      } finally {
        setIsSendingMessage(false);
      }
      return;
    }
    setIsMessaging(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setIsSubmittingReview(true);
    try {
      if (!user) throw new Error("Must be logged in");
      await api.reviews.create(product.id, newReviewRating, newReviewText);
      const newReviews = await api.reviews.getByProductId(product.id);
      setReviews(newReviews);
      setNewReviewText('');
      setNewReviewRating(5);
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${product.title} - Buy Digital Assets on NEXUS`}</title>
        <meta name="description" content={product.description?.substring(0, 160) || `Buy ${product.title} on NEXUS Global Digital Marketplace.`} />
        <meta name="keywords" content={`${product.title}, buy ${product.title}, ${product.type}, marketplace, buy code, ${product.tags?.join(', ')}, hire developer, software, scripts`} />
        <meta property="og:title" content={`${product.title} - Download on NEXUS`} />
        <meta property="og:description" content={product.description?.substring(0, 160)} />
        <meta property="og:image" content={product.image_urls?.[0] || product.thumbnail_url} />
        <meta name="twitter:title" content={product.title} />
        <meta name="twitter:description" content={product.description?.substring(0, 160)} />
        <link rel="canonical" href={`https://ais-pre-e3lfqal22nesabynit6sxv-703578476673.asia-east1.run.app/product/${product.id}`} />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#141414]/95 dark:bg-black/95 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="bg-[#E4E3E0] dark:bg-[#0a0a0a] w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-[#141414] dark:border-white/10 shadow-2xl flex flex-col lg:flex-row transition-colors"
      >
        {/* Visual Content Section */}
        <div className="lg:w-3/5 h-[400px] lg:h-auto bg-[#141414] relative group overflow-hidden shrink-0 flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {product.image_urls && product.image_urls.length > 0 ? (
                <motion.img 
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  src={product.image_urls[activeImageIndex]} 
                  alt={`${product.title} - ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                  <Cpu size={80} className="text-white" />
                  <span className="font-mono text-xs uppercase tracking-[0.5em] text-white">Visual Stream Encrypted</span>
                </div>
              )}
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-60 pointer-events-none" />
            
            {/* Gallery Navigation */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                <button 
                  onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : product.image_urls.length - 1))}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/80 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setActiveImageIndex(prev => (prev < product.image_urls.length - 1 ? prev + 1 : 0))}
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white pointer-events-auto hover:bg-black/80 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Quick Actions / Demos */}
            <div className="absolute top-6 left-6 flex gap-3">
              {(product.live_demo_url || product.video_url || product.youtube_url) && (
                <div className="flex gap-2">
                  {product.live_demo_url && (
                    <a href={product.live_demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all">
                      <Globe size={12} /> Live Demo
                    </a>
                  )}
                  {(product.video_url || product.youtube_url) && (
                    <a href={product.youtube_url || product.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all">
                      <Play size={12} /> Watch Demo
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                  {product.category || product.type}
                </span>
                {product.license_type && (
                  <span className="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
                    License: {product.license_type}
                  </span>
                )}
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                {product.title}
              </h2>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="h-20 flex gap-2 p-2 bg-black/40 backdrop-blur-md border-t border-white/5 overflow-x-auto hide-scrollbar shrink-0">
              {product.image_urls.map((url, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "h-full aspect-video rounded-lg overflow-hidden border-2 transition-all shrink-0",
                    activeImageIndex === i ? "border-blue-500" : "border-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  <img src={url} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Section */}
        <div ref={scrollRef} className="lg:w-2/5 flex flex-col p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-8 sticky top-0 bg-[#E4E3E0] dark:bg-[#0a0a0a] z-10 py-2 -mt-2 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#141414]/10 dark:bg-white/10 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Creator Node</p>
                <p className="font-bold uppercase tracking-tighter">{product.creator?.username || 'Nexus Sentinel'}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (isConfirming) {
                  setIsConfirming(false);
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 hover:bg-[#141414]/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Back</span>
            </button>
          </div>

            <div className="flex-1 min-h-[300px] flex flex-col">
              <AnimatePresence mode="wait">
                {isConfirming ? (
                  <motion.div 
                    key="checkout"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 py-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                       <button onClick={() => setIsConfirming(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                          <ChevronLeft size={20} />
                       </button>
                       <h3 className="text-xl font-black uppercase tracking-tighter">Direct P2P Payment</h3>
                    </div>
                    
                    <p className="text-sm opacity-70 mb-4">Send payment directly to the creator. The platform will take a 5% commission once the product is released.</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'crypto', icon: Wallet, label: 'Crypto' },
                        { id: 'upi', icon: CreditCard, label: 'UPI' },
                        { id: 'nowpayments', icon: Globe, label: 'Crypto Auto' },
                        { id: 'bank', icon: Shield, label: 'Bank' }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={cn(
                            "flex-1 min-w-[100px] p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                            paymentMethod === method.id 
                              ? "border-blue-500 bg-blue-500/5" 
                              : "border-[#141414]/10 dark:border-white/10 hover:border-blue-500/30"
                          )}
                        >
                          <method.icon size={24} className={paymentMethod === method.id ? "text-blue-500" : "opacity-40"} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-center">{method.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-4 bg-[#141414]/5 dark:bg-white/5 rounded-xl border border-[#141414]/10 dark:border-white/10 space-y-4">
                      <div>
                        <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Send Exactly</h4>
                        <p className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                          ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      
                      {paymentMethod === 'crypto' && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Seller Crypto Address ({product.creator?.crypto_network || 'USDT'})</h4>
                          <div className="font-mono text-xs break-all bg-[#141414]/10 dark:bg-black/50 p-3 rounded-lg border border-[#141414]/10 dark:border-white/10 select-all">
                            {product.creator?.crypto_address || 'No crypto address provided.'}
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'upi' && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Seller UPI ID</h4>
                          <div className="font-mono text-xs break-all bg-[#141414]/10 dark:bg-black/50 p-3 rounded-lg border border-[#141414]/10 dark:border-white/10 select-all">
                            {product.creator?.upi_id || 'No UPI ID provided.'}
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'bank' && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Seller Bank Details</h4>
                          <div className="font-mono text-xs whitespace-pre-wrap bg-[#141414]/10 dark:bg-black/50 p-3 rounded-lg border border-[#141414]/10 dark:border-white/10 select-all">
                            {product.creator?.bank_details || 'No bank details provided.'}
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'nowpayments' && (
                        <div>
                          <p className="text-xs opacity-70">
                            You will be redirected to a secure payment gateway to complete your transaction in cryptocurrency.
                            <br/><br/>
                            Status: <span className={product.creator?.nowpayments_api_key ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                              {product.creator?.nowpayments_api_key ? "Ready" : "Provider offline"}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {paymentMethod !== 'nowpayments' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Transaction Reference</label>
                        <input 
                          type="text" 
                          value={paymentProof}
                          onChange={(e) => setPaymentProof(e.target.value)}
                          placeholder="Hash / Reference ID"
                          className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono transition-colors"
                        />
                        {checkoutError && <p className="text-red-500 text-xs font-bold pt-1">{checkoutError}</p>}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <>
                    <div className="flex border-b border-[#141414]/10 dark:border-white/10">
                      {['details', 'reviews', 'seller'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={cn(
                            "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                            activeTab === tab ? "text-blue-500" : "opacity-40 hover:opacity-100"
                          )}
                        >
                          {tab}
                          {activeTab === tab && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="py-6">
                      <AnimatePresence mode="wait">
                        {activeTab === 'details' && (
                          <motion.div 
                            key="details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            <div className="space-y-4">
                              <h3 className="text-xs font-mono font-black uppercase tracking-[0.3em] opacity-30">Shard Description</h3>
                              <p className="text-sm leading-relaxed opacity-70">
                                {product.description || 'No detailed technical log provided for this asset.'}
                              </p>
                            </div>

                            {product.features && product.features.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="text-xs font-mono font-black uppercase tracking-[0.3em] opacity-30">Key Features</h3>
                                <ul className="grid grid-cols-1 gap-2">
                                  {product.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs opacity-70">
                                      <CheckCircle size={14} className="text-emerald-500" />
                                      {feat}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 border border-[#141414]/10 dark:border-white/10 rounded-2xl space-y-2">
                                <Calendar size={14} className="opacity-40" />
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Registered</p>
                                <p className="text-[11px] font-bold">{new Date(product.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="p-4 border border-[#141414]/10 dark:border-white/10 rounded-2xl space-y-2">
                                <Activity size={14} className="opacity-40" />
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Ver</p>
                                <p className="text-[11px] font-bold">{product.metadata?.version || '1.0.0'}</p>
                              </div>
                              <div className="p-4 border border-[#141414]/10 dark:border-white/10 rounded-2xl space-y-2">
                                <Download size={14} className="opacity-40" />
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Size</p>
                                <p className="text-[11px] font-bold">{product.metadata?.file_size || 'N/A'}</p>
                              </div>
                            </div>

                            {product.metadata?.tech_stack && product.metadata.tech_stack.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="text-xs font-mono font-black uppercase tracking-[0.3em] opacity-30">Protocol Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                  {product.metadata.tech_stack.map((tech, i) => (
                                    <span key={i} className="px-3 py-1 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full text-[9px] font-bold uppercase tracking-widest">
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeTab === 'reviews' && (
                          <motion.div 
                            key="reviews"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                          >
                            <div className="flex justify-between items-center">
                              <h3 className="text-xs font-mono font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-2">
                                <MessageSquare size={14} />
                                Human Feedback ({reviews.length})
                              </h3>
                            </div>
                            
                            <div className="space-y-3">
                              {user && product.creator_id !== user.uid && (
                                <form onSubmit={handleSubmitReview} className="bg-[#141414]/5 dark:bg-white/5 p-4 rounded-xl border border-[#141414]/10 mb-6 flex flex-col gap-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Leave Feedback</span>
                                    <div className="flex gap-1">
                                      {[1,2,3,4,5].map(v => (
                                        <button type="button" key={v} onClick={() => setNewReviewRating(v)}>
                                          <Star size={14} className={newReviewRating >= v ? "fill-yellow-500 text-yellow-500" : "text-white/20"} />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <textarea 
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                    placeholder="Write your review here..."
                                    className="w-full h-20 bg-[#141414]/5 dark:bg-black/50 border border-[#141414]/20 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none"
                                    required
                                  />
                                  <button
                                    type="submit"
                                    disabled={isSubmittingReview || !newReviewText.trim()}
                                    className="self-end px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isSubmittingReview ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    Submit
                                  </button>
                                </form>
                              )}
                              {loadingReviews ? (
                                <div className="flex items-center gap-2 py-4 animate-pulse">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Synchronizing reviews...</span>
                                </div>
                              ) : reviews.length > 0 ? (
                                reviews.map((r) => (
                                  <div key={r.id} className="p-4 rounded-xl bg-[#141414]/5 dark:bg-white/5 border border-[#141414]/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                           <div className="w-5 h-5 rounded-full bg-white dark:bg-[#141414] border border-[#141414]/10 flex items-center justify-center text-[8px] font-bold">
                                              {r.user?.username?.[0] || 'U'}
                                           </div>
                                           <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">{r.user?.username || 'Nexus Agent'}</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                          {[1,2,3,4,5].map(s => (
                                            <Star key={s} size={8} className={cn(s <= r.rating ? "fill-yellow-500 text-yellow-500" : "opacity-10")} />
                                          ))}
                                        </div>
                                    </div>
                                    <p className="text-[11px] leading-relaxed opacity-80 italic">"{r.comment}"</p>
                                  </div>
                                ))
                              ) : (
                                <div className="py-8 text-center border-2 border-dashed border-[#141414]/5 dark:border-white/5 rounded-2xl">
                                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-20 italic">No field reports available.</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'seller' && (
                          <motion.div 
                            key="seller"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                          >
                            <div className="flex items-center gap-6 p-6 rounded-3xl bg-[#141414]/5 dark:bg-white/5 border border-[#141414]/10">
                              <div className="relative">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20">
                                  <img src={product.creator?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${product.creator?.username}`} className="w-full h-full object-cover" alt="Seller" />
                                </div>
                                {product.creator?.verification_badge && (
                                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 border-4 border-[#E4E3E0] dark:border-[#0a0a0a]">
                                    <CheckCircle size={14} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-black uppercase tracking-tighter italic">{product.creator?.username}</h3>
                                  {product.creator?.verification_badge && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[8px] font-bold uppercase">Verified</span>}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-mono opacity-50">
                                  <span className="flex items-center gap-1"><Star size={10} className="fill-yellow-500 text-yellow-500" /> {product.creator?.rating || '5.0'} Rating</span>
                                  <span className="flex items-center gap-1"><User size={10} /> Joined {product.creator?.joined_date ? new Date(product.creator.joined_date).getFullYear() : '2024'}</span>
                                </div>
                              </div>
                            </div>

                            {product.creator?.bio && (
                              <div className="space-y-2">
                                <h3 className="text-xs font-mono font-black uppercase tracking-[0.3em] opacity-30">Merchant Bio</h3>
                                <p className="text-sm opacity-70 italic">{product.creator.bio}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-1">
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Response Time</p>
                                <p className="text-xs font-bold">{product.creator?.response_time || '< 4 hours'}</p>
                              </div>
                              <div className="p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-1">
                                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Assets Released</p>
                                <p className="text-xs font-bold">Confirmed Merchant</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-12 pt-8 border-t border-[#141414]/10 dark:border-white/10 flex items-center justify-between sticky bottom-0 bg-[#E4E3E0] dark:bg-[#0a0a0a] z-10 py-4 -mb-4 transition-colors">
            <div className="space-y-1">
              {!isConfirming ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Current Price</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                      ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 text-xs font-mono opacity-60">
                  <span>Payment Selection Enabled.</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleContactSeller}
                className="flex items-center gap-3 px-6 py-4 border-2 border-[#141414] dark:border-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#141414] hover:text-white dark:hover:bg-white dark:hover:text-[#0a0a0a] transition-all"
              >
                <MessageSquare size={18} />
                Contact Seller
              </button>
              {onBuySuccess && (
                isConfirming ? (
                  <div className="flex items-center gap-3">
                    <button
                      disabled={isPurchasing}
                      onClick={async () => {
                        if (paymentMethod === 'nowpayments') {
                           setIsPurchasing(true);
                           setCheckoutError('');
                           try {
                             // Call our backend to proxy the request
                             if (!product.creator?.nowpayments_api_key) {
                               throw new Error('Seller has not provided a NOWPayments API key.');
                             }
                             const res = await fetch('/api/create-nowpayments-invoice', {
                               method: 'POST',
                               headers: { 
                                 'Content-Type': 'application/json'
                               },
                               body: JSON.stringify({
                                 amount: totalPrice,
                                 currency: 'usd',
                                 apiKey: product.creator.nowpayments_api_key,
                                 order_id: `prod_${product.id}_${Date.now()}`,
                                 order_description: `Payment for ${product.title}`
                               })
                             });

                             let data;
                             const text = await res.text();
                             try {
                               data = JSON.parse(text);
                             } catch (err) {
                               console.warn("Backend API not found, falling back to manual payment mode.", text.slice(0, 50));
                               await api.orders.create(product.id, product.creator_id, totalPrice, 'nowpayments', `manual_fallback_${Date.now()}`);
                               onBuySuccess();
                               alert("Order registered successfully! (Backend payment gateway was unavailable, manual mode activated).");
                               return;
                             }

                             if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate invoice');
                             
                             // Redirect to NOWPayments invoice URL
                             if (data.invoice_url) {
                               window.open(data.invoice_url, '_blank');
                               // We still want to record the order in our system but status would be pending
                               await api.orders.create(product.id, product.creator_id, totalPrice, 'nowpayments', `invoice:${data.id || data.invoice_id}`);
                               onBuySuccess();
                             } else {
                               throw new Error('No invoice URL returned');
                             }
                           } catch (err: any) {
                             setCheckoutError(err.message || 'NOWPayments initialization failed');
                           } finally {
                             setIsPurchasing(false);
                           }
                           return;
                        }

                        if (!paymentProof.trim()) {
                          setCheckoutError('Payment proof required');
                          return;
                        }
                        if (paymentMethod === 'crypto' && !product.creator?.crypto_address) {
                          setCheckoutError('Seller missing crypto address');
                          return;
                        }
                        if (paymentMethod === 'upi' && !product.creator?.upi_id) {
                          setCheckoutError('Seller missing UPI ID');
                          return;
                        }
                        if (paymentMethod === 'bank' && !product.creator?.bank_details) {
                          setCheckoutError('Seller missing Bank Details');
                          return;
                        }
                        
                        setCheckoutError('');
                        setIsPurchasing(true);
                        try {
                          await api.orders.create(product.id, product.creator_id, totalPrice, paymentMethod, paymentProof);
                          onBuySuccess();
                        } catch (err) {
                          setCheckoutError('Transaction failed. Retry.');
                          setIsPurchasing(false);
                        }
                      }}
                      className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                    >
                      {isPurchasing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : (paymentMethod === 'nowpayments' ? 'Proceed to Crypto Checkout' : 'Confirm Payment Sent')}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsConfirming(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    <ShoppingCart size={18} />
                    Buy Now
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>

      {/* Messaging Overlay */}
      <AnimatePresence>
        {isMessaging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#E4E3E0] dark:bg-[#0a0a0a] w-full max-w-md p-8 rounded-[2rem] border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Message {product.creator?.username}</h3>
                <button onClick={() => setIsMessaging(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Inquire about this asset or negotiate..."
                className="w-full h-40 bg-[#141414]/5 dark:bg-black/50 border border-[#141414]/20 dark:border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none mb-6"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setIsMessaging(false)}
                  className="flex-1 px-6 py-4 border border-[#141414]/10 rounded-full font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={isSendingMessage || !messageText.trim()}
                  onClick={handleContactSeller}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-full font-bold uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {isSendingMessage ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send size={16} /> Send</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
