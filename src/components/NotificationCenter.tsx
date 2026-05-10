import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShoppingCart, Wallet, ShieldCheck, Mail, LogOut, Check, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import { Notification } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart size={14} className="text-blue-500" />;
      case 'payment': return <ShieldCheck size={14} className="text-green-500" />;
      case 'payout': return <Wallet size={14} className="text-purple-500" />;
      case 'message': return <Mail size={14} className="text-yellow-500" />;
      default: return <Bell size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[#141414]/5 dark:hover:bg-white/5 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center px-1">
             <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-80 bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-[#141414]/10 dark:border-white/10 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-[#141414]/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#141414]">
              <h3 className="font-sans font-bold text-xs uppercase tracking-widest italic">Protocol Logs</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{unreadCount} Pending</span>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]/50 scrollbar-hide">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-[10px] font-mono opacity-40 uppercase">Syncing...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-8 h-8 opacity-10 mx-auto mb-4" />
                  <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">No signals detected</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 border-b border-[#141414]/5 dark:border-white/5 flex gap-3 transition-colors group relative",
                      !n.read ? "bg-white dark:bg-[#141414]" : "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="mt-1 shrink-0 bg-[#141414]/5 dark:bg-white/5 p-2 rounded-lg">
                      {getTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-tight truncate">{n.title}</h4>
                        <span className="text-[8px] font-mono opacity-30 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed opacity-60 mt-0.5 line-clamp-2">{n.message}</p>
                      
                      {!n.read && (
                        <button 
                          onClick={() => handleMarkRead(n.id)}
                          className="mt-2 text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 hover:underline underline-offset-2"
                        >
                          <Check size={10} /> Mark read
                        </button>
                      )}
                    </div>
                    {!n.read && (
                      <div className="absolute right-2 top-11 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-[#141414]/[0.02] dark:bg-white/[0.02] border-t border-[#141414]/5 dark:border-white/5 text-center">
               <button className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">
                 Clear Archive
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
