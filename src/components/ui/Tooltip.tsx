import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export default function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  className,
  delay = 300 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const t = setTimeout(() => setIsVisible(true), delay);
    setTimer(t);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#141414] dark:border-t-white border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#141414] dark:border-b-white border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#141414] dark:border-l-white border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#141414] dark:border-r-white border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, [position === 'top' || position === 'bottom' ? 'y' : 'x']: position === 'top' || position === 'left' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, [position === 'top' || position === 'bottom' ? 'y' : 'x']: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[1000] whitespace-nowrap pointer-events-none",
              positionClasses[position]
            )}
          >
            <div className="bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest shadow-2xl border border-white/10 dark:border-black/10">
              {content}
              <div className={cn(
                "absolute w-0 h-0 border-[6px]",
                arrowClasses[position]
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
