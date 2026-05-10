import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import { Loader2, Sun, Moon } from 'lucide-react';

import { CustomCursor } from './components/Cursor';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return true; // Force dark mode for premium look
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  if (loading) {
    return (
      <div id="loading-screen" className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] gap-4 relative overflow-hidden transition-colors duration-500">
        <CustomCursor />
        <div className="fixed inset-0 grid grid-cols-8 grid-rows-8 opacity-[0.03] pointer-events-none">
          {Array.from({ length: 64 }).map((_, i) => <div key={i} className="border border-[#141414] dark:border-white" />)}
        </div>
        <motion.div 
          animate={{ y: [0, -10, 0] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-12 h-12 rounded-full border-2 border-[#0a0a0a]/10 dark:border-white/10 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-2 border-t-[#0a0a0a] dark:border-t-white animate-spin" />
            <div className="w-4 h-4 rounded-full bg-[#0a0a0a] dark:bg-white" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#0a0a0a]/40 dark:text-white/40 animate-pulse">Establishing Neural Link...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-grain">
      <CustomCursor />
      {user ? (
        <MaintenanceWrapper adminEmail="hotelcrowncastle992@gmail.com">
          <Dashboard isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />
        </MaintenanceWrapper>
      ) : showAuth ? (
        <Auth />
      ) : (
        <Landing onAuth={() => setShowAuth(true)} />
      )}
    </div>
  );
}

function MaintenanceWrapper({ children, adminEmail }: { children: React.ReactNode, adminEmail: string }) {
  const { user } = useAuth();
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { api } = await import('./services/api');
        const settings = await api.admin.getSettings();
        setMaintenance(settings.maintenance_mode && user?.email !== adminEmail);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkMaintenance();
  }, [user, adminEmail]);

  if (loading) return null;

  if (maintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 font-mono text-center">
        <div className="w-20 h-20 border-4 border-white/20 border-t-red-500 rounded-full animate-spin mb-8" />
        <h1 className="text-4xl font-bold tracking-tighter mb-4 uppercase">System Maintenance</h1>
        <p className="text-white/60 max-w-md mx-auto leading-relaxed">
          The NEXUS protocol is currently undergoing a core update. All nodes have been temporarily decoupled for security.
        </p>
        <div className="mt-12 py-2 px-4 border border-red-500/50 text-red-500 text-[10px] uppercase tracking-[0.3em]">
          Access Level: Restricted
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { HelmetProvider, Helmet } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>NEXUS - Digital Marketplace</title>
        <meta name="description" content="NEXUS Global Digital Marketplace. High quality software, assets, and freelance hiring." />
      </Helmet>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HelmetProvider>
  );
}
