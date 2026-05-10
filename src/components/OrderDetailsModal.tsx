import React from 'react';
import { motion } from 'motion/react';
import { X, ExternalLink, Link as LinkIcon, DollarSign, Wallet, Shield, Hash, Search, ArrowRight } from 'lucide-react';
import { Order } from '../types';

export default function OrderDetailsModal({ order, onClose }: { order: Order, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#141414] border border-[#141414] dark:border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.4em] font-bold mb-2">Transaction Record</h2>
            <h1 className="text-3xl font-black font-sans tracking-tight uppercase leading-none break-all">#{order.id}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest flex items-center gap-1"><Hash size={12}/> Buyer ID</span>
                <p className="font-mono text-xs break-all selectable">{order.buyer_id}</p>
             </div>
             <div className="bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest flex items-center gap-1"><Search size={12} /> Seller ID</span>
                <p className="font-mono text-xs break-all selectable">{order.seller_id}</p>
             </div>
          </div>

          <div className="bg-[#141414]/5 dark:bg-white/5 p-6 rounded-2xl border border-[#141414]/10 dark:border-white/10">
             <div className="flex justify-between items-center border-b border-[#141414]/10 dark:border-white/10 pb-4 mb-4">
                <div>
                   <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest block mb-1">Asset</span>
                   <p className="font-bold text-lg leading-none">{order.product?.title || 'Unknown Asset'}</p>
                   <p className="text-xs font-mono opacity-50 mt-1">ID: {order.product_id}</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                   <span className="font-mono opacity-60 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14}/> Amount</span>
                   <span className="font-bold font-mono">${order.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="font-mono opacity-60 uppercase tracking-widest flex items-center gap-2"><Wallet size={14}/> Payment Method</span>
                   <span className="uppercase font-bold text-[10px] tracking-widest px-2 py-1 bg-white/10 rounded">{order.payment_method}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="font-mono opacity-60 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Commission (5%)</span>
                   <span className="font-bold font-mono text-blue-500">${order.commission?.toFixed(2) || '0.00'}</span>
                </div>
             </div>
          </div>

          <div className="bg-[#141414]/5 dark:bg-white/5 p-4 rounded-2xl border border-[#141414]/10 dark:border-white/10 space-y-2">
             <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest flex items-center gap-1"><LinkIcon size={12}/> Payment Proof Hash / Ref</span>
             <p className="font-mono text-xs break-all text-blue-500 bg-blue-500/10 p-2 rounded-lg">{order.payment_proof}</p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#141414]/10 dark:border-white/10">
             <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">
               Date: {new Date(order.created_at).toLocaleString()}
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  {order.status === 'completed' ? 'Completed' : order.status}
                </span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
