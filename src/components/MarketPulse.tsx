import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { Product } from '../types';
import { analyzeMarketInventory } from '../services/geminiService';

import Tooltip from './ui/Tooltip';

export default function MarketPulse({ products }: { products: Product[] }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeMarket = useCallback(async () => {
    setLoading(true);
    try {
      const productList = products.map(p => `${p.title} (${p.type}) - $${p.price}`).join(', ');
      const result = await analyzeMarketInventory(productList);
      setAnalysis(result);
    } catch (err) {
      console.error('Market analysis failed:', err);
      setAnalysis("Market floor telemetry interrupted. Local caches indicate stable flow.");
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    if (products.length > 0) {
      analyzeMarket();
    } else {
      setAnalysis("Market floor empty. Deployment of new assets recommended to stimulate liquidity.");
    }
  }, [products, analyzeMarket]);

  return (
    <div className="border border-[#141414] dark:border-white/10 rounded-2xl p-6 bg-white dark:bg-white/5 shadow-[4px_4px_0px_0px_#141414] dark:shadow-[4px_4px_0px_0px_white/10] space-y-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tooltip content="Nexus Intelligence Core">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
          </Tooltip>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">AI Market Pulse</h4>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500" />
           <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Real-time</span>
        </div>
      </div>

      <div className="relative min-h-[60px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center gap-3">
             <Loader2 className="animate-spin text-[#141414]/20 dark:text-white/20" />
             <span className="text-[10px] font-mono uppercase tracking-widest opacity-20">Analyzing Flow...</span>
          </div>
        ) : (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs leading-relaxed font-medium text-[#141414]/70 dark:text-white/70 italic"
          >
            "{analysis}"
          </motion.p>
        )}
      </div>

      <div className="pt-4 border-t border-[#141414]/5 dark:border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-green-600 dark:text-green-400" />
            <span className="text-[9px] font-mono font-bold uppercase text-green-600 dark:text-green-400">Optimal Alpha</span>
         </div>
          <Tooltip content="Rerun market telemetry analysis">
            <button onClick={analyzeMarket} className="text-[9px] font-bold uppercase underline underline-offset-4 opacity-40 hover:opacity-100 transition-opacity">Recalibrate</button>
          </Tooltip>
      </div>
    </div>
  );
}
