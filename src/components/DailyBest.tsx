import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { api } from '../services/api';
import { X, Star, ChevronRight, Zap } from 'lucide-react';

export default function DailyBest({ onSelectProduct }: { onSelectProduct: (product: Product) => void }) {
  const [bestProduct, setBestProduct] = useState<Product | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchBest = async () => {
      try {
        const products = await api.products.list();
        if (products && products.length > 0) {
          // Find a product with good rating or just pick the first one
          // Try to sort by rating or price
          const top = [...products].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
          setBestProduct(top);
        }
      } catch (err) {
        console.error("Failed to load daily best", err);
      }
    };
    fetchBest();
  }, []);

  useEffect(() => {
    // Pop up after 3 seconds
    if (bestProduct) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bestProduct]);

  if (!bestProduct) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="fixed bottom-8 right-8 z-50 flex items-end justify-end pointer-events-none"
        >
          <div 
            className="w-80 sm:w-96 bg-[#0a0a0a] text-white rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden relative pointer-events-auto group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onSelectProduct(bestProduct)}
          >
            {/* Animated Background Gradient */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
            />
            
            {/* Close Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-20 bg-white/5 rounded-full p-1"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
                  <Star size={12} className="text-yellow-500" />
                </div>
                <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest font-bold">Daily Drop</span>
              </div>

              <div className="space-y-1">
                <h4 className="text-2xl font-bold uppercase tracking-tighter leading-none line-clamp-2">{bestProduct.title}</h4>
                <p className="text-white/40 text-xs font-medium leading-relaxed line-clamp-2">{bestProduct.description}</p>
              </div>

              {bestProduct.screenshots && bestProduct.screenshots[0] && (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative">
                  <img 
                    src={bestProduct.screenshots[0]} 
                    alt={bestProduct.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-60" />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-white/40 font-mono text-xs">$</span>
                  <span className="font-bold text-xl">{bestProduct.price}</span>
                </div>
                <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  View <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Apple-esque Reflection/Gleam */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
