import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Activity,
  Zap,
  Shield,
  ShieldCheck,
  Crown,
  ShoppingCart,
  Wallet,
  ArrowDownLeft,
  Filter,
  Package,
  Globe,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  ShoppingBag,
  Code,
  PenTool,
  Cpu,
  Monitor,
  Sun,
  Moon,
  Star,
  AlertCircle,
  Archive,
  ArrowLeft,
  Trash2,
  Check,
  Terminal,
  Scale,
  Command,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { api } from '../services/api';
import { Product, Order, Review, Job, JobApplication, Profile, SubscriptionPlan, Withdrawal } from '../types';
import UploadProduct from './UploadProduct';
import OrderDetailsModal from './OrderDetailsModal';
import MarketPulse from './MarketPulse';
import ProductDetail from './ProductDetail';
import Typewriter from './Typewriter';
import DailyBest from './DailyBest';
import JobPostModal from './JobPostModal';
import JobWorkspaceModal from './JobWorkspaceModal';
import JobApplyModal from './JobApplyModal';
import Vault from './Vault';
import AdminDashboard from './AdminDashboard';
import NotificationCenter from './NotificationCenter';
import SupportView from './SupportView';
import { FloatingBackground, ZeroGravityWrapper, BackgroundVideo } from './AntiGravity';
import Messenger from './Messenger';
import ErrorBoundary from './ErrorBoundary';
import LegalModal from './LegalModal';
import { Helmet } from 'react-helmet-async';

import Tooltip from './ui/Tooltip';

export default function Dashboard({ isDark, onToggleDark }: { isDark: boolean, onToggleDark: () => void }) {
  const { user, signOut } = useAuth();
  const isAdmin = user?.email === 'hotelcrowncastle992@gmail.com';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [showUpload, setShowUpload] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // Job related states
  const [dbJobs, setDbJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [showPostJob, setShowPostJob] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<JobApplication | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [orderModal, setOrderModal] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ open: boolean, page: 'privacy' | 'terms' | 'refund' | 'rules' | 'seller' | 'community' }>({ open: false, page: 'privacy' });
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isBooting, setIsBooting] = useState(true);
  
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    loadData();
    let interval: ReturnType<typeof setInterval>;
    if (activeTab === 'jobs' || activeTab === 'hire') {
      interval = setInterval(() => {
         loadData(true); // silent refresh
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  async function loadData(silent = false) {
    try {
      if (!silent) setError(null);
      if (user) {
        api.profiles.get(user.uid).then(async p => {
          if (!p) {
            await api.profiles.update({
              username: user.email?.split('@')[0] || 'User',
              avatar_url: user.photoURL || '',
              role: 'buyer'
            });
            const newP = await api.profiles.get(user.uid);
            setProfile(newP || null);
          } else {
            setProfile(p);
          }
        });
        
        // Load financial data for balance
        api.orders.mySales().then(setSales).catch(() => {});
        api.withdrawals.getMy().then(setWithdrawals).catch(() => {});
        api.applications.getMy('developer').then(setMyApplications).catch(() => {});
      }
      if (!silent) setStatsLoading(true);
      if (activeTab === 'inventory') {
        if (!silent) setProductsLoading(true);
        const data = await api.products.list();
        setProducts(data.filter(p => p.creator_id === user?.uid));
      } else if (activeTab === 'hub') {
        setProductsLoading(true);
        const data = await api.products.list();
        setProducts(data);
      } else if (activeTab === 'treasury') {
        if (!silent) setOrdersLoading(true);
        const data = await api.orders.myOrders();
        setOrders(data);
        
        const reviewedIds = new Set<string>();
        for (const order of data) {
          const hasReviewed = await api.reviews.hasReviewed(order.product_id);
          if (hasReviewed) reviewedIds.add(order.product_id);
        }
        setReviewedProductIds(reviewedIds);
      } else if (activeTab === 'sales') {
        if (!silent) setSalesLoading(true);
        const data = await api.orders.mySales();
        setSales(data);
      } else if (activeTab === 'jobs') {
        const jobs = await api.jobs.list();
        setDbJobs(jobs);
        const myApps = await api.applications.getMy('developer');
        setMyApplications(myApps);
      } else if (activeTab === 'hire') {
        const posts = await api.jobs.getMyJobs();
        setMyJobs(posts);
        const myApps = await api.applications.getMy('client');
        setMyApplications(myApps);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      if (!silent) setError(err?.message || 'A network error occurred while synchronizing with the Nexus Node.');
    } finally {
      if (!silent) {
        setProductsLoading(false);
        setOrdersLoading(false);
        setSalesLoading(false);
        setStatsLoading(false);
        setSelectedIds(new Set());
      }
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      setError(null);
      await api.products.bulkArchive(Array.from(selectedIds));
      await loadData();
    } catch (err: any) {
      setError('Bulk archive failed. Protocol interrupted.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} assets from the Nexus? This action is irreversible.`)) return;
    try {
      setError(null);
      await api.products.bulkDelete(Array.from(selectedIds));
      await loadData();
    } catch (err: any) {
      setError('Bulk deletion failed. Data shard persistent.');
    }
  };



  // Financial Calculations
  const completedSalesForBalance = sales.filter(s => s.status === 'released' || s.status === 'completed');
  const salesEarnings = completedSalesForBalance.reduce((acc, sale) => acc + (sale.amount - sale.commission), 0);
  
  // Job earnings (simplified for now as 95% of budget)
  const paidJobs = myApplications.filter(j => j.status === 'paid');
  const jobsEarnings = paidJobs.reduce((acc, app) => acc + ((app.job?.budget || 0) * 0.95), 0);

  const totalEarnings = salesEarnings + jobsEarnings;
  const pendingOrCompletedWithdrawals = withdrawals.filter(w => w.status !== 'rejected');
  const withdrawnAmount = pendingOrCompletedWithdrawals.reduce((acc, w) => acc + w.amount, 0);
  const availableBalance = totalEarnings - withdrawnAmount;

  if (isBooting) {
    return <TerminalBoot onComplete={() => setIsBooting(false)} />;
  }

  return (
    <div id="dashboard-root" className="min-h-screen bg-[#050505] text-[#141414] dark:text-white font-sans selection:bg-[#00F5FF] selection:text-black dark:selection:bg-[#00F5FF] dark:selection:text-black relative overflow-hidden transition-colors duration-500">
      <Helmet>
        <title>{`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} - NEXUS Hub`}</title>
        <meta name="description" content={`Explore the ${activeTab} section on NEXUS. Buy software, SaaS, Python scripts, or hire top freelance developers and logo designers.`} />
        <meta name="keywords" content={`NEXUS, ${activeTab}, digital marketplace, freelance hiring, hiring programmer, logo design, buy source code`} />
      </Helmet>
      <FloatingBackground />
      <BackgroundVideo />
      
      <AnimatePresence>
        {showUpload && (
          <UploadProduct 
            onClose={() => setShowUpload(false)} 
            onSuccess={() => {
              setShowUpload(false);
              loadData();
            }} 
          />
        )}
        {showSubscription && (
          <SubscriptionModal 
            currentPlan={profile?.subscription_plan} 
            apiKey={profile?.nowpayments_api_key}
            onClose={() => setShowSubscription(false)} 
            onSuccess={() => {
              setShowSubscription(false);
              loadData();
            }}
          />
        )}
        {showPostJob && (
          <JobPostModal
            onClose={() => setShowPostJob(false)}
            onSuccess={() => {
              setShowPostJob(false);
              loadData();
            }}
          />
        )}
        {orderModal && (
          <OrderDetailsModal order={orderModal} onClose={() => setOrderModal(null)} />
        )}
        {activeWorkspace && (
          <JobWorkspaceModal
            application={activeWorkspace}
            onClose={() => {
              setActiveWorkspace(null);
              loadData();
            }}
          />
        )}
        {applyJob && (
          <JobApplyModal
            job={applyJob}
            onClose={() => setApplyJob(null)}
            onSuccess={() => {
              setApplyJob(null);
              loadData();
            }}
          />
        )}
        {reviewOrder && (
          <ReviewForm 
            order={reviewOrder} 
            onClose={() => setReviewOrder(null)} 
            onSuccess={() => {
              setReviewOrder(null);
              loadData();
            }} 
          />
        )}
        {(selectedProduct || checkoutProduct) && (
          <ProductDetail 
            product={(selectedProduct || checkoutProduct)!} 
            onClose={() => {
              setSelectedProduct(null);
              setCheckoutProduct(null);
            }}
            onBuySuccess={() => {
              setActiveTab('treasury');
              setSelectedProduct(null);
              setCheckoutProduct(null);
            }}
            autoCheckout={!!checkoutProduct}
          />
        )}
        {profileOpen && (
          <ProfileSettings onClose={() => setProfileOpen(false)} />
        )}
        <LegalModal 
          isOpen={legalModal.open} 
          onClose={() => setLegalModal({ ...legalModal, open: false })} 
          initialPage={legalModal.page} 
        />
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside id="sidebar" className={cn(
        "fixed left-0 top-0 bottom-0 w-64 border-r border-[#141414]/5 dark:border-white/5 flex flex-col bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur z-30 transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div id="sidebar-header" className="p-6 border-b border-[#141414]/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border border-[#141414] dark:border-white flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#141414] dark:bg-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg uppercase leading-none">Nexus</span>
          </div>
          <button className="md:hidden p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4">
          <button 
            onClick={() => {
              setShowUpload(true);
              setMobileMenuOpen(false);
            }}
            className="w-full py-3 bg-white text-black font-semibold uppercase tracking-widest rounded-xl hover:scale-105 hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] focus:outline-none"
          >
            <Activity size={16} /> 
            Sell Asset
          </button>
        </div>

        <nav id="nav-list" className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          <NavItem icon={<Globe size={18} />} label="Explore Catalog" active={activeTab === 'hub'} onClick={() => { setActiveTab('hub'); setMobileMenuOpen(false); }} />
          <NavItem icon={<MessageSquare size={18} />} label="Inbox" active={activeTab === 'messages'} onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }} />
          <NavItem icon={<ShoppingBag size={18} />} label="My Assets" active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }} count={products.length} />
          <NavItem icon={<TrendingUp size={18} />} label="Sales Ledger" active={activeTab === 'sales'} onClick={() => { setActiveTab('sales'); setMobileMenuOpen(false); }} />
          <NavItem icon={<Wallet size={18} />} label="Treasury" active={activeTab === 'treasury'} onClick={() => { setActiveTab('treasury'); setMobileMenuOpen(false); }} />
          <NavItem icon={<Users size={18} />} label="Hire Talent" active={activeTab === 'hire'} onClick={() => { setActiveTab('hire'); setMobileMenuOpen(false); }} />
          <NavItem icon={<Briefcase size={18} />} label="Find Work" active={activeTab === 'jobs'} onClick={() => { setActiveTab('jobs'); setMobileMenuOpen(false); }} />
          <NavItem icon={<Shield size={18} />} label="Vault" active={activeTab === 'vault'} onClick={() => { setActiveTab('vault'); setMobileMenuOpen(false); }} />
          <NavItem icon={<Scale size={18} />} label="Compliance" onClick={() => { setLegalModal({ open: true, page: 'terms' }); setMobileMenuOpen(false); }} />
          <NavItem icon={<MessageSquare size={18} />} label="Support" active={activeTab === 'support'} onClick={() => { setActiveTab('support'); setMobileMenuOpen(false); }} />
          {isAdmin && (
            <NavItem icon={<Monitor size={18} />} label="Command Center" active={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} />
          )}
        </nav>

        <div id="sidebar-footer" className="p-4 border-t border-[#141414]/10 dark:border-white/10 space-y-2 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSubscription(true)}
            className="w-full p-5 rounded-2xl bg-[#141414] dark:bg-white flex flex-col gap-2 group shadow-xl transition-all text-left overflow-hidden relative"
          >
             <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 dark:bg-blue-500/10 blur-3xl rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/30 transition-colors duration-500" />
             <div className="flex justify-between items-center relative z-10 w-full">
                <span className="text-[10px] font-mono text-white/50 dark:text-[#141414]/50 uppercase tracking-widest font-bold">Node Tier</span>
                {profile?.subscription_plan === 'premium' ? <Crown size={14} className="text-purple-400 dark:text-purple-600" /> : profile?.subscription_plan === 'pro' ? <Zap size={14} className="text-blue-400 dark:text-blue-600" /> : <Shield size={14} className="text-white/30 dark:text-[#141414]/30" />}
             </div>
             <div className="text-base font-black uppercase tracking-tighter text-white dark:text-[#141414] relative z-10 flex items-center justify-between mt-1">
                {profile?.subscription_plan?.toUpperCase() || 'FREE NODE'}
                <ArrowUpRight size={16} className="text-white/50 dark:text-[#141414]/50 opacity-0 translate-x-[-10px] translate-y-[10px] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" />
             </div>
             <div className="text-[9px] font-mono text-white/30 dark:text-[#141414]/40 uppercase tracking-widest relative z-10 mt-1">Calibration Status: Active</div>
          </motion.button>

          <NavItem icon={<Settings size={18} />} label="System Config" onClick={() => { setProfileOpen(true); setMobileMenuOpen(false); }} />
          <Tooltip content="Close secure terminal session" position="right" className="w-full">
            <button 
              id="sign-out-btn"
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-[#141414] dark:hover:bg-white hover:text-[#E4E3E0] dark:hover:text-[#0a0a0a] group mt-1 focus:outline-none"
            >
              <LogOut size={18} />
              <span className="font-semibold tracking-wide uppercase text-xs">Terminate Link</span>
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="md:ml-64 min-h-screen flex flex-col relative z-10 w-full md:w-auto">
        {/* Navbar */}
        <header id="top-nav" className="h-16 border-b border-[#141414]/5 dark:border-white/5 flex items-center justify-between px-4 sm:px-8 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="relative w-full max-w-xl group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#141414]/40 dark:text-white/40 group-focus-within:text-[#141414] dark:group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Lookup assets, merchants, or hash..." 
                className="w-full pl-10 pr-4 py-1.5 bg-transparent border border-[#141414]/10 dark:border-white/10 rounded-full focus:outline-none focus:border-[#141414] dark:focus:border-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Tooltip content="Verified Treasury Balance" position="bottom">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#141414]/5 dark:bg-white/5 rounded-full border border-[#141414]/10 dark:border-white/10">
                 <Wallet size={14} className="text-[#141414]/60 dark:text-white/60" />
                 <span className="font-mono text-xs font-bold">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </Tooltip>
            <Tooltip content="Protocol Notifications" position="bottom">
              <NotificationCenter />
            </Tooltip>
            <div className="flex items-center gap-3 pl-4 border-l border-[#141414]/10 dark:border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold uppercase leading-none">{user?.email?.split('@')[0]}</p>
                <button 
                  onClick={() => setShowSubscription(true)}
                  className={cn(
                    "text-[8px] font-mono mt-1 px-1.5 py-0.5 rounded border uppercase tracking-widest transition-colors",
                    profile?.subscription_plan === 'premium' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    profile?.subscription_plan === 'pro' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-white/10 text-white/40 border-white/10"
                  )}
                >
                  {profile?.subscription_plan || 'FREE'} LINK
                </button>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] flex items-center justify-center font-bold text-xs uppercase shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                {user?.email?.[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div id="dashboard-content" className="flex-1 p-8 pb-24 md:pb-8 space-y-8">
          {error ? (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold uppercase tracking-tighter italic">Protocol Error</h3>
                <p className="text-[#141414]/40 dark:text-white/40 font-mono text-xs max-w-sm mx-auto">{error}</p>
              </div>
              <button 
                onClick={() => loadData()}
                className="px-8 py-3 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
              >
                Retry Connection
              </button>
            </div>
          ) : activeTab === 'inventory' ? (
            <>
              {/* Hero Welcome */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-[#141414]/10 dark:decoration-white/10">Merchant Dispatch / Private Cargo</h2>
                  <h1 className="text-4xl font-sans font-medium tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                    <Typewriter text="Inventory Control" speed={60} />
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Tooltip content="Filter assets by type, price, or status">
                    <button className="px-4 py-2 border border-[#141414] dark:border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-[#141414]/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
                       <Filter size={14} /> Filter
                    </button>
                  </Tooltip>
                  <Tooltip content="Register new digital asset to Nexus">
                    <button 
                      onClick={() => setShowUpload(true)}
                      className="px-6 py-2 bg-[#141414] dark:bg-white text-[#E4E3E0] dark:text-[#0a0a0a] rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Plus size={14} /> Dispatch New Asset
                    </button>
                  </Tooltip>
                </div>
              </div>

              {/* Grid Stats */}
              <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                  [1, 2, 3, 4].map(i => <div key={i} className="h-24 border border-[#141414]/5 dark:border-white/5 p-5 rounded-2xl bg-white/50 dark:bg-white/5 animate-pulse" />)
                ) : (
                  <>
                    <ZeroGravityWrapper><StatCard label="Live Assets" value={products.length.toString()} trend="+2" /></ZeroGravityWrapper>
                    <ZeroGravityWrapper><StatCard label="Total Revenue" value={`$${totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 1 })}${totalEarnings >= 1000 ? 'k' : ''}`} trend="+12.4%" /></ZeroGravityWrapper>
                    <ZeroGravityWrapper><StatCard label="Dispatch Latency" value="0.4ms" trend="up" /></ZeroGravityWrapper>
                    <ZeroGravityWrapper><StatCard label="Reputation Score" value="99.8%" trend="clean" /></ZeroGravityWrapper>
                  </>
                )}
              </div>

              {/* Asset Display */}
              <div id="main-grid" className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:items-start">
                <div className="xl:col-span-2 space-y-6">
                  <ErrorBoundary title="Failed to load asset directory">
                    {productsLoading ? (
                      <div className="bento-section p-0 divide-y divide-[#141414]/10 dark:divide-white/10 transition-colors">
                        <div className="px-6 py-4 bg-[#141414]/5 dark:bg-white/5 h-12" />
                        {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
                      </div>
                    ) : products.length > 0 ? (
                        <div className="bento-section p-0 overflow-hidden transition-colors">
                          <div className="border-b border-[#141414]/10 dark:border-white/10 px-6 py-4 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={toggleSelectAll}
                                className={cn(
                                  "w-5 h-5 rounded border transition-all flex items-center justify-center",
                                  selectedIds.size === products.length && products.length > 0 
                                    ? "bg-[#141414] dark:bg-white border-transparent" 
                                    : "border-[#141414]/20 dark:border-white/20 hover:border-[#141414]"
                                )}
                              >
                                {selectedIds.size === products.length && products.length > 0 && <Check size={12} className="text-white dark:text-black" />}
                              </button>
                              <h4 className="text-xs font-mono uppercase tracking-[0.2em] opacity-60">Active Inventories</h4>
                            </div>
                            <MoreVertical size={16} className="text-[#141414]/40 dark:text-white/40" />
                          </div>
                          
                          {/* Column Headers */}
                          <div className="grid grid-cols-5 px-6 py-2 bg-black/5 dark:bg-white/5 border-b border-[#141414]/5 dark:border-white/5">
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Identity</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Asset Name</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Status</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Last Mod</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 text-right">Valuation</span>
                          </div>

                          <div className="divide-y divide-[#141414]/10 dark:divide-white/10">
                            {products.map(p => (
                              <AssetRow 
                                key={p.id} 
                                id={p.id.slice(0, 8)} 
                                originalId={p.id}
                                name={p.title} 
                                status={p.status || 'Listed'} 
                                price={`$${p.price}`} 
                                type={p.type} 
                                updatedAt={p.updated_at || p.created_at}
                                selected={selectedIds.has(p.id)}
                                onToggle={() => toggleSelect(p.id)}
                                onView={() => setSelectedProduct(p)}
                              />
                            ))}
                          </div>
                        </div>
                    ) : (
                      <div className="h-64 border border-dashed border-[#141414]/20 dark:border-white/20 rounded-3xl flex flex-col items-center justify-center gap-4 text-[#141414]/40 dark:text-white/40">
                        <Package size={48} className="opacity-10" />
                        <p className="text-xs font-mono uppercase tracking-widest">No assets dispatched yet.</p>
                        <button onClick={() => setShowUpload(true)} className="text-[10px] font-bold uppercase underline underline-offset-4 hover:text-[#141414] dark:hover:text-white transition-colors">Start First Dispatch</button>
                      </div>
                    )}
                  </ErrorBoundary>
                </div>

                <div className="space-y-6 sticky top-[100px] h-fit">
                  <MarketPulse products={products} />
                  
                  <div className="border border-[#141414] dark:border-white/10 rounded-2xl p-6 bg-[#141414] dark:bg-white/5 text-[#E4E3E0] dark:text-white relative overflow-hidden group transition-colors">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-white/40">Network Activity</h4>
                          <span className="text-[10px] font-mono text-green-400">SYNCED</span>
                        </div>
                        
                        <div className="space-y-4">
                          <ActivityItem user="Sys_Admin" action="Verified" asset="Anti-Virus v4" time="2m ago" />
                          <ActivityItem user="Nexus_Node" action="Hashed" asset="Llama-3-Agent" time="14m ago" />
                        </div>

                        <button className="w-full py-3 bg-[#E4E3E0] dark:bg-white text-[#141414] dark:text-[#0a0a0a] rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                          View Activity Log
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'hub' ? (
            <div className="space-y-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-2 text-left">
                  <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic">The World's Best Digital Store</h2>
                  <h1 className="text-6xl font-sans font-medium tracking-tighter uppercase leading-none italic">
                    <Typewriter text="Buy & Sell Digital." speed={80} delay={400} />
                  </h1>
                </div>
                <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-[#141414]/10 dark:border-white/10 pt-4 lg:pt-0 lg:pl-8">
                   <div className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] font-bold">Protocol v4.0 Active // Node_14</div>
                </div>
              </div>

              {/* Spotlight - Premium Featured Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative group h-[500px] border border-white/5 rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-600 to-blue-900 text-white p-16 flex flex-col justify-between"
                >
                   <div className="space-y-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.5em] font-bold opacity-60">Nexus Spotlight</span>
                      <h3 className="text-7xl font-medium font-sans tracking-tighter uppercase leading-none italic">Neural <br /> Flux Pro.</h3>
                      <p className="text-white/60 text-lg max-w-sm">Next-generation cognitive architecture for automated trading clusters.</p>
                   </div>
                   <button className="w-fit px-10 py-5 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-110 active:scale-95 transition-all shadow-2xl">Initialize Acquisition</button>
                   <Cpu className="absolute -bottom-20 -right-20 w-80 h-80 opacity-20 rotate-12 transition-transform duration-[2s] group-hover:rotate-0" />
                </motion.div>

                <div className="grid grid-cols-1 gap-8">
                   <motion.div 
                     initial={{ opacity: 0, x: 40 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="relative group border border-white/5 rounded-[3rem] overflow-hidden bg-zinc-900 text-white p-10 flex flex-col justify-between"
                   >
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <span className="text-[9px] font-mono uppercase tracking-[0.4em] font-bold text-orange-400">Merchant Protocol</span>
                             <h4 className="text-3xl font-medium font-sans uppercase tracking-tighter">Become a <br /> Certified Vendor.</h4>
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                             <Crown className="text-orange-400" />
                          </motion.div>
                       </div>
                       <div className="flex items-end justify-between">
                          <p className="text-white/40 text-xs max-w-[200px]">Unlock unlimited shards and zero-fee transactions with Apex Core.</p>
                          <button onClick={() => setShowSubscription(true)} className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full hover:bg-orange-400 hover:text-black transition-colors">Upgrade Now</button>
                       </div>
                   </motion.div>

                   <motion.div 
                     initial={{ opacity: 0, x: 40, transition: { delay: 0.1 } }}
                     animate={{ opacity: 1, x: 0 }}
                     className="relative group border border-white/5 rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-3xl text-white p-10 flex flex-col justify-between"
                   >
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <span className="text-[9px] font-mono uppercase tracking-[0.4em] font-bold text-emerald-400">Node Sync</span>
                             <h4 className="text-3xl font-medium font-sans uppercase tracking-tighter italic">Explore Open <br /> Bounty Workspace.</h4>
                          </div>
                          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                             <Globe className="text-emerald-400" />
                          </div>
                       </div>
                       <button onClick={() => setActiveTab('jobs')} className="w-fit text-[10px] font-bold uppercase tracking-widest border border-white/10 px-6 py-3 rounded-full hover:bg-white/10 transition-colors">Query Bounties</button>
                   </motion.div>
                </div>
              </div>

              {/* Requirement Filters */}
              <div className="flex flex-col md:flex-row gap-4 pt-12 border-t border-[#141414]/10 dark:border-white/10 relative z-10">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#141414]/40 dark:text-white/40">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search strict requirements or product names..." 
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#111111] border border-[#141414]/20 dark:border-white/20 rounded-2xl text-sm placeholder:text-[#141414]/40 dark:placeholder:text-white/40 focus:outline-none focus:border-blue-500 uppercase tracking-widest font-mono transition-colors text-[#141414] dark:text-white"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#141414]/40 dark:text-white/40">
                    <Filter size={18} />
                  </div>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full md:w-64 pl-12 pr-8 py-4 bg-white dark:bg-[#111111] border border-[#141414]/20 dark:border-white/20 rounded-2xl text-sm focus:outline-none focus:border-blue-500 uppercase tracking-widest font-mono appearance-none transition-colors text-[#141414] dark:text-white"
                  >
                    <option value="All">All Categories</option>
                    <option value="music">Music & Audio</option>
                    <option value="script">Scripts & Tools (Python, etc.)</option>
                    <option value="website">Websites & Themes</option>
                    <option value="webapp">Web Applications</option>
                    <option value="software">Software & Desktop Apps</option>
                    <option value="data">Data & Databases</option>
                    <option value="security">Security & Pen-testing</option>
                    <option value="ai">AI & Neural Networks</option>
                    <option value="service">Development Services</option>
                    <option value="linux">Linux Distros</option>
                    <option value="visual">Visual Assets</option>
                    <option value="other">Other Assets</option>
                  </select>
                </div>
              </div>

              {productsLoading ? (
                <div id="market-grid-loading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                  {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div id="market-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pb-24">
                  {products.filter(p => {
                    const matchQuery = p.title.toLowerCase().includes(filterQuery.toLowerCase());
                    const matchType = filterType === 'All' || p.type.toLowerCase() === filterType.toLowerCase();
                    return matchQuery && matchType;
                  }).map(p => (
                    <MarketCard 
                      key={p.id}
                      id={p.id}
                      name={p.title} 
                      price={`$${p.price}`} 
                      seller={p.creator?.username || 'Unknown'} 
                      stats={{ speed: p.metadata.file_size, node: p.metadata.version }} 
                      tag={p.type}
                      updatedAt={p.updated_at || p.created_at}
                      thumbnail_url={p.thumbnail_url}
                      onBuy={() => setCheckoutProduct(p)}
                      onView={() => setSelectedProduct(p)}
                    />
                  ))}
                  {products.length === 0 && (
                     <div className="col-span-full h-64 border border-dashed border-[#141414]/20 dark:border-white/20 rounded-3xl flex items-center justify-center uppercase font-mono text-xs opacity-40">
                        Station empty. Awaiting dispatches.
                     </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'sales' ? (
             <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-[#141414]/10 dark:decoration-white/10">Merchant Revenue</h2>
                  <h1 className="text-4xl font-sans font-medium tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                    <Typewriter text="Sales Ledger" speed={60} />
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatCard 
                     label="Estimated Revenue" 
                     value={`$${sales.filter(s => s.status === 'completed' || s.status === 'released').reduce((acc, s) => acc + (s.amount - s.commission), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                     trend="+12.4%" 
                   />
                   <StatCard label="Dispatched Units" value={sales.length.toString()} trend="up" />
                   <StatCard label="Nexus Commission" value="5.00%" trend="stable" />
                </div>

                <div className="border border-[#141414] dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#141414]/30 shadow-sm transition-colors">
                   <div className="grid grid-cols-6 px-6 py-4 bg-[#141414] dark:bg-white text-[#E4E3E0] dark:text-[#0a0a0a] text-[10px] font-mono uppercase tracking-[0.2em] transition-colors">
                      <span>TX_HASH</span>
                      <span>Product</span>
                      <span>Gain</span>
                      <span>Proof / Method</span>
                      <span>Status</span>
                      <span className="text-right">Action</span>
                   </div>
                   <div className="divide-y divide-[#141414]/10 dark:divide-white/10">
                      {salesLoading ? (
                        [1,2,3].map(i => <SkeletonRow key={i} cols={6} />)
                      ) : (
                        <>
                          {sales.length === 0 && (
                            <div className="px-6 py-12 text-center opacity-20 uppercase tracking-widest text-[10px]">No sales recorded yet.</div>
                          )}
                          {sales.map(s => (
                            <div 
                              key={s.id} 
                              onClick={() => setOrderModal(s)}
                              className="grid grid-cols-6 px-6 py-5 items-center font-mono text-xs hover:bg-[#141414]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                               <span className="opacity-40 italic">#{s.id.slice(0,8)}...</span>
                               <span className="font-sans font-bold uppercase tracking-tight line-clamp-1 pr-2">{s.product?.title || 'Unknown Asset'}</span>
                               <span className="text-green-500 font-bold">+${(s.amount - s.commission).toFixed(2)}</span>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[9px] uppercase font-bold text-blue-500">{s.payment_method || 'Unknown'}</span>
                                 <span className="text-[9px] bg-black/5 dark:bg-white/10 p-1 rounded truncate max-w-[120px] select-all">{s.payment_proof || 'N/A'}</span>
                               </div>
                               <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">{s.status.replace('_', ' ')}</span>
                               <div className="text-right">
                                 {s.status === 'payment_sent' || s.status === 'pending' ? (
                                   <button 
                                     onClick={async () => {
                                       try {
                                         await api.orders.updateStatus(s.id, 'released');
                                         loadData();
                                       } catch (e) {
                                         alert('Failed to release product');
                                       }
                                     }}
                                     className="px-3 py-1.5 bg-[#141414] dark:bg-white text-white dark:text-black rounded text-[9px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
                                   >
                                     Release Product
                                   </button>
                                 ) : (
                                   <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Released</span>
                                 )}
                               </div>
                            </div>
                          ))}
                        </>
                      )}
                   </div>
                </div>
             </div>
          ) : activeTab === 'treasury' ? (
             <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic">Financial Protocol</h2>
                  <h1 className="text-4xl font-sans font-medium tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                    <Typewriter text="Treasury Ledger" speed={60} />
                  </h1>
                </div>

                <div className="border border-[#141414] dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-white/5 transition-colors">
                   <div className="grid grid-cols-5 px-6 py-4 bg-[#141414] dark:bg-white text-[#E4E3E0] dark:text-[#0a0a0a] text-[10px] font-mono uppercase tracking-[0.2em] transition-colors">
                      <span>Transaction ID</span>
                      <span>Asset Identity</span>
                      <span>Status</span>
                      <span>Comm. (5%)</span>
                      <span className="text-right">Total Paid</span>
                   </div>
                   <div className="divide-y divide-[#141414]/10 dark:divide-white/10">
                      {ordersLoading ? (
                         [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} cols={5} />)
                      ) : (
                        <>
                          {orders.map(o => (
                            <div 
                              key={o.id} 
                              onClick={() => setOrderModal(o)}
                              className="grid grid-cols-5 px-6 py-4 items-center font-mono text-xs hover:bg-[#141414]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                               <span className="opacity-40">#{o.id.slice(0,12)}</span>
                               <span className="font-sans font-bold">{o.product?.title || 'Unknown Asset'}</span>
                               <span className="flex items-center gap-2">
                                  <CheckCircle2 size={12} className="text-green-500" />
                                  <span className="uppercase text-[10px] tracking-widest text-green-600">Dispatched</span>
                                  {o.status === 'completed' && !reviewedProductIds.has(o.product_id) && (
                                    <Tooltip content="Submit encrypted quality feedback for this shard" position="left">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setReviewOrder(o); }}
                                        className="ml-2 px-2 py-0.5 border border-purple-500/30 text-purple-600 rounded-full text-[8px] font-bold uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all scale-95"
                                      >
                                        Rate Asset
                                      </button>
                                    </Tooltip>
                                  )}
                                  {reviewedProductIds.has(o.product_id) && (
                                    <span className="ml-2 text-[8px] font-bold uppercase tracking-widest text-blue-500 opacity-60 italic">Hashed Feedback</span>
                                  )}
                               </span>
                               <span className="text-blue-500 font-bold">${o.commission?.toFixed(2) || '0.00'}</span>
                               <span className="text-right font-bold">${o.amount.toFixed(2)}</span>
                            </div>
                          ))}
                          {orders.length === 0 && (
                            <div className="px-6 py-12 text-center opacity-20 uppercase tracking-widest text-[10px]">No transaction history found.</div>
                          )}
                        </>
                      )}
                   </div>
                </div>
              </div>
          ) : activeTab === 'hire' ? (
             <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-[#141414]/10 dark:decoration-white/10">Project Management & Talent Acquisition</h2>
                  <h1 className="text-4xl font-sans font-medium tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                    <Typewriter text="Hire & Track" speed={60} />
                  </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-1 space-y-6">
                      <div 
                        onClick={() => setShowPostJob(true)}
                        className="p-8 border border-[#141414] dark:border-white/10 rounded-2xl space-y-4 bg-[#141414] dark:bg-white/5 flex flex-col justify-center items-center text-center group cursor-pointer hover:border-[#34d399] transition-colors relative overflow-hidden h-64"
                      >
                         <div className="absolute inset-0 bg-gradient-to-tr from-[#34d399]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#34d399] mb-4 relative z-10 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                            <Plus size={24} />
                         </div>
                         <h3 className="text-lg font-bold uppercase tracking-tighter text-[#E4E3E0] dark:text-white relative z-10">Post Job Brief</h3>
                         <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest relative z-10">Signal a new requirement to the Nexus.</p>
                      </div>

                      {myJobs.length > 0 && (
                        <div className="space-y-4">
                           <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-40 font-bold border-b border-[#141414]/10 dark:border-white/10 pb-2">Your Job Posts</h3>
                           <div className="space-y-3">
                              {myJobs.map(job => (
                                <div key={job.id} className="p-4 border border-[#141414]/10 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/5 space-y-2">
                                   <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-mono text-blue-500 font-bold uppercase tracking-widest">Active</span>
                                      <span className="text-[10px] font-mono opacity-50">${job.budget}</span>
                                   </div>
                                   <h4 className="text-sm font-bold uppercase tracking-tight line-clamp-1">{job.title}</h4>
                                   <div className="flex justify-between items-center text-[9px] font-mono opacity-40 uppercase tracking-widest">
                                      <span>Apps: {myApplications.filter(a => a.job_id === job.id).length}</span>
                                      <span>ID: {job.id.slice(0,6)}</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="lg:col-span-2 space-y-6">
                      <h3 className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-40 font-bold border-b border-[#141414]/10 dark:border-white/10 pb-2">Application Tracking</h3>
                      {myApplications.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {myApplications.map(app => (
                            <div key={app.id} className="p-6 border border-[#141414]/10 dark:border-white/10 rounded-3xl space-y-4 bg-white dark:bg-[#141414]/30 group hover:border-[#141414] dark:hover:border-white/20 transition-all shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold border",
                                    app.status === 'pending' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                    app.status === 'accepted' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                    app.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                    "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                  )}>
                                    {app.status}
                                  </span>
                                  {app.file_url && (
                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold border border-purple-500/20">Portfolio Sent</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Bounty: ${app.job?.budget}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div>
                                  <h4 className="text-2xl font-bold uppercase tracking-tighter leading-none mb-2">{app.job?.title}</h4>
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-[#141414] dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold uppercase transition-colors">
                                      {app.developer?.username?.[0] || 'D'}
                                    </div>
                                    <p className="text-[11px] font-mono uppercase tracking-widest"><span className="opacity-40">Developer:</span> <span className="font-bold">{app.developer?.username || 'Unknown'}</span></p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setActiveWorkspace(app)}
                                  className="px-6 py-2 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                                >
                                  Open Workspace <ArrowUpRight size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-64 border border-dashed border-[#141414]/20 dark:border-white/20 rounded-3xl flex flex-col items-center justify-center gap-4 text-[#141414]/40 dark:text-white/40">
                          <Users size={48} className="opacity-10" />
                          <p className="text-xs font-mono uppercase tracking-widest">No signals received from developers yet.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          ) : activeTab === 'jobs' ? (
             <div className="space-y-8">
                <div className="space-y-2">
                   <h2 className="text-sm font-mono text-[#141414]/50 dark:text-white/50 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-[#141414]/10 dark:decoration-white/10">Open Opportunities</h2>
                   <h1 className="text-4xl font-sans font-medium tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                     <Typewriter text="Find Work" speed={60} />
                   </h1>
                </div>

                {myApplications.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-bold uppercase tracking-tighter border-b border-[#141414]/10 dark:border-white/10 pb-2 text-blue-500">My Active Work</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myApplications.map(app => (
                        <div key={app.id} className="p-6 border border-[#141414]/10 dark:border-white/10 rounded-2xl space-y-4 bg-white/50 dark:bg-white/5 group hover:border-[#141414] dark:hover:border-white/20 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold">
                              Status: {app.status}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold uppercase tracking-tighter leading-none mb-1">{app.job?.title}</h4>
                            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Client: {app.job?.client?.username || 'Unknown'}</p>
                          </div>
                          <button 
                            onClick={() => setActiveWorkspace(app)}
                            className="w-full py-2 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-all"
                          >
                            Resume Work
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {dbJobs.map(job => (
                      <div key={job.id} className="p-8 border border-[#141414] dark:border-white/10 rounded-2xl space-y-6 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group cursor-pointer lg:col-span-2">
                         <div className="flex justify-between items-start">
                            <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold border border-purple-500/20">{job.category}</span>
                            <div className="text-right">
                              <span className="text-xl font-mono font-bold block">${job.budget}</span>
                              <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">Budget</span>
                            </div>
                         </div>
                         <div className="space-y-4">
                           <h3 className="text-3xl font-bold uppercase tracking-tighter leading-none">{job.title}</h3>
                           <p className="text-sm font-sans opacity-70 leading-relaxed whitespace-pre-line">{job.description}</p>
                           <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-2 border-t border-[#141414]/10 dark:border-white/10 pt-4">Posted by: {job.client?.username || 'Unknown Client'} • Status: {job.status}</p>
                         </div>
                         {job.status === 'open' && (
                           <button 
                             onClick={() => setApplyJob(job)}
                             className="w-full lg:w-48 py-3 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all mt-4"
                           >
                             {job.client_id === user?.uid ? "Apply (Test Flow)" : "Apply to Job"}
                           </button>
                         )}
                      </div>
                   ))}
                   {dbJobs.length === 0 && (
                     <div className="col-span-full h-48 border border-dashed border-[#141414]/20 dark:border-white/20 rounded-3xl flex items-center justify-center uppercase font-mono text-xs opacity-40 italic mt-8">
                        No active jobs available.
                     </div>
                   )}
                </div>
             </div>
          ) : activeTab === 'support' ? (
             <SupportView />
          ) : activeTab === 'messages' ? (
             <Messenger />
          ) : activeTab === 'vault' ? (
             <Vault />
          ) : activeTab === 'admin' && isAdmin ? (
             <AdminDashboard />
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-[#141414]/20 dark:border-white/20 rounded-3xl transition-colors">
              <p className="text-sm font-mono uppercase tracking-[0.2em] opacity-40 italic flex flex-col items-center gap-4 transition-colors">
                <Zap size={24} />
                Node initialization in progress...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Network Status Rail */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#141414] dark:bg-white text-[white] dark:text-[#0a0a0a] flex items-center justify-between px-6 z-[100] transition-colors overflow-hidden">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#141414] dark:bg-white animate-pulse" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#141414] dark:text-white">Global Node: ONLINE</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[9px] font-mono opacity-60 uppercase tracking-widest">
            <span>Lat: 0.14ms</span>
            <span>Up: 99.98%</span>
            <span>Sec: AES-256</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 overflow-hidden max-w-[50%]">
          <div className="flex items-center gap-1.5 animate-marquee whitespace-nowrap">
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] opacity-40">Incoming Trans: </span>
            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">User_8209 acquired AntiGravity_Core // Hash: 0x9212...</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-40">V2.4.91</span>
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      </footer>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: -48, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[110] px-8 py-4 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full shadow-2xl flex items-center gap-8 border border-[#141414] dark:border-white"
          >
            <div className="flex items-center gap-3 pr-8 border-r border-white/20 dark:border-black/20">
               <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">
                 {selectedIds.size}
               </div>
               <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Assets Selected</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Tooltip content="Decommission selected assets (Cold Storage)" position="top" className="flex">
                <button 
                  onClick={handleBulkArchive}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 dark:hover:bg-black/5 rounded-full transition-all group"
                >
                  <Archive size={16} className="text-zinc-400 group-hover:text-white dark:group-hover:text-black" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Archive</span>
                </button>
              </Tooltip>
              <Tooltip content="Terminate shards permanently" position="top" className="flex">
                <button 
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-red-500 hover:text-white rounded-full transition-all group"
                >
                  <Trash2 size={16} className="text-red-500 group-hover:text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
                </button>
              </Tooltip>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 px-4"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Drop Sidebar Popup */}
      <DailyBest onSelectProduct={setSelectedProduct} />
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-[#141414]/10 dark:border-white/10 z-[60] flex items-center justify-between px-6 pb-safe">
        <button 
          onClick={() => setActiveTab('hub')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'hub' ? "text-blue-500" : "text-[#141414]/40 dark:text-white/40")}
        >
          <Globe size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'inventory' ? "text-blue-500" : "text-[#141414]/40 dark:text-white/40")}
        >
          <ShoppingBag size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">Assets</span>
        </button>
        <div className="relative -top-4">
          <button 
            onClick={() => setShowUpload(true)}
            className="w-14 h-14 bg-[#34d399] text-[#141414] rounded-full shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center justify-center transform transition-transform active:scale-95 border-4 border-white dark:border-[#050505]"
          >
            <Activity size={24} />
          </button>
        </div>
        <button 
          onClick={() => setActiveTab('sales')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'sales' ? "text-blue-500" : "text-[#141414]/40 dark:text-white/40")}
        >
          <TrendingUp size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">Sales</span>
        </button>
        <button 
          onClick={() => setProfileOpen(true)}
          className={cn("flex flex-col items-center gap-1", profileOpen ? "text-blue-500" : "text-[#141414]/40 dark:text-white/40")}
        >
          <Settings size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest hidden sm:block">Config</span>
        </button>
      </nav>
    </div>
  );
}

function TerminalBoot({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const sequence = [
    "> INITIATING NEURAL LINK PROTOCOL v2.4.9...",
    "> SCANNING BIOMETRIC SIGNATURE...",
    "> AUTHENTICATING MERCHANT CREDENTIALS...",
    "> STABILIZING QUANTUM ENCRYPTION TUNNEL...",
    "> SYNCHRONIZING WITH GLOBAL NODE_14...",
    "> LINK ESTABLISHED. ACCESS GRANTED."
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < sequence.length) {
        setMessages(prev => [...prev, sequence[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsFinished(true);
          setTimeout(onComplete, 800);
        }, 1000);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      animate={{ opacity: isFinished ? 0 : 1 }}
      className="fixed inset-0 bg-[#0a0a0a] z-[200] flex flex-col items-center justify-center font-mono p-8 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="grid grid-cols-12 h-full gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="border-r border-white h-full" />)}
        </div>
      </div>
      
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 text-[10px] opacity-40 uppercase tracking-[0.5em]">
          <div className="flex items-center gap-4">
            <Terminal size={14} />
            <span>Terminal Initialization</span>
          </div>
          <span>Mode: Secure</span>
        </div>

        <div className="space-y-4 min-h-[180px]">
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[11px] md:text-xs text-white/80 flex items-center gap-3"
            >
              <span className="text-blue-500 font-bold tracking-tighter">[*]</span>
              <Typewriter text={m} speed={20} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between">
           <div className="flex gap-1.5">
             <div className="w-2 h-2 rounded-full bg-red-400/20" />
             <div className="w-2 h-2 rounded-full bg-yellow-400/20" />
             <div className="w-2 h-2 rounded-full bg-green-400/20" />
           </div>
           <div className="text-[9px] opacity-30 uppercase tracking-widest font-bold">Nexus OS Kernel v4</div>
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-x-0 top-0 h-[100%] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none animate-scanline" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.8em] font-black"
      >
        Establishing Link
      </motion.div>
    </motion.div>
  );
}

function NavItem({ icon, label, active = false, count, onClick }: { icon: React.ReactNode, label: string, active?: boolean, count?: number, onClick?: () => void, key?: React.Key }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all group relative overflow-hidden",
      active ? "bg-[#141414] dark:bg-white text-[#E4E3E0] dark:text-[#0a0a0a]" : "hover:bg-[#141414]/5 dark:hover:bg-white/5"
    )}>
      <div className="flex items-center gap-4 relative z-10">
        <span className={cn("transition-colors", active ? "text-white dark:text-black" : "text-[#141414]/40 dark:text-white/40 group-hover:text-[#141414] dark:group-hover:text-white")}>
          {icon}
        </span>
        <span className="font-bold uppercase tracking-widest whitespace-nowrap">{label}</span>
      </div>
      {count && (
        <span className="bg-[#34d399] text-[#141414] text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
          {count}
        </span>
      )}
      {active && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent pointer-events-none" />}
    </button>
  );
}

function StatCard({ label, value, trend }: { label: string, value: string, trend: string, key?: React.Key }) {
  return (
    <div className="border border-[#141414]/10 dark:border-white/10 p-6 rounded-2xl bg-white dark:bg-white/5 shadow-sm hover:shadow-2xl hover:border-[#141414] dark:hover:border-white transition-all duration-500 group relative">
      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-20 transition-opacity">
         <Activity size={32} />
      </div>
      <p className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-30 mb-2 font-bold group-hover:opacity-100 transition-opacity">{label}</p>
      <div className="flex items-end justify-between">
        <Tooltip content="Estimated valuation based on market node consensus" position="right">
          <h4 className="text-4xl font-sans font-medium tracking-tighter uppercase leading-none transition-colors">{value}</h4>
        </Tooltip>
        <div className="flex items-center gap-1.5">
           {trend === 'up' ? <TrendingUp size={12} className="text-[#34d399]" /> : null}
           <span className={cn(
            "text-[9px] font-mono p-1 rounded font-bold uppercase tracking-widest",
            trend.startsWith('+') || trend === 'up' || trend === 'clean' ? "text-green-500 bg-green-500/10" : "text-[#141414]/40 dark:text-white/40 bg-black/5 dark:bg-white/5"
          )}>
            {trend === 'up' ? 'OPTIMAL' : trend === 'clean' ? 'ENCRYPTED' : trend}
          </span>
        </div>
      </div>
      <div className="mt-4 h-1 bg-[#141414]/5 dark:bg-white/5 rounded-full overflow-hidden">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: "70%" }}
           className="h-full bg-current opacity-40"
         />
      </div>
    </div>
  );
}

function AssetRow({ id, originalId, name, status, price, type, updatedAt, selected, onToggle, onView }: { id: string, originalId: string, name: string, status: string, price: string, type: string, updatedAt?: string, selected: boolean, onToggle: () => void, onView: () => void, key?: React.Key }) {
  const getStatusConfig = (s: string) => {
    switch (s.toLowerCase()) {
      case 'listed':
        return {
          dot: "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]",
          text: "text-green-600 dark:text-green-400"
        };
      case 'sold':
        return {
          dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
          text: "text-blue-600 dark:text-blue-400"
        };
      case 'archived':
        return {
          dot: "bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.5)]",
          text: "text-zinc-500 dark:text-zinc-400"
        };
      case 'processing':
        return {
          dot: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]",
          text: "text-yellow-600 dark:text-yellow-400"
        };
      default:
        return {
          dot: "bg-[#141414]/20 dark:bg-white/20",
          text: "text-[#141414]/40 dark:text-white/40"
        };
    }
  };

  const config = getStatusConfig(status);
  const formattedDate = updatedAt ? new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Unknown';

  return (
    <div 
      onClick={onView}
      className={cn(
        "grid grid-cols-5 px-6 py-4 items-center group transition-all duration-200 cursor-pointer overflow-hidden",
        selected 
          ? "bg-[#141414]/5 dark:bg-white/10" 
          : "hover:bg-[#141414] dark:hover:bg-white hover:text-[#E4E3E0] dark:hover:text-[#0a0a0a]"
      )}
    >
      <div className="flex items-center gap-4">
        <div 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            "w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0",
            selected 
              ? "bg-[#141414] dark:bg-white border-transparent" 
              : "border-[#141414]/20 dark:border-white/20 group-hover:border-white dark:group-hover:border-black"
          )}
        >
          {selected && <Check size={12} className="text-white dark:text-black" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono opacity-40 font-bold"># {id}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#141414]/20 dark:text-white/10 group-hover:text-white/40 dark:group-hover:text-[#0a0a0a]/40">{type}</span>
        </div>
      </div>
      <span className="text-sm font-sans font-medium line-clamp-1">{name}</span>
      <span className="flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-500", config.dot)} />
        <span className={cn("text-[10px] uppercase font-mono tracking-widest font-bold", config.text)}>{status}</span>
      </span>
      <span className="text-[10px] font-mono opacity-60 font-bold uppercase tracking-tight">{formattedDate}</span>
      <span className="text-sm font-mono text-right font-bold">{price}</span>
    </div>
  );
}

function ActivityItem({ user, action, asset, time, gain }: { user: string, action: string, asset: string, time: string, gain?: string, key?: React.Key }) {
  return (
    <div className="flex items-center justify-between group/item">
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-full border border-[#141414]/10 dark:border-white/10 flex items-center justify-center text-[10px] font-mono bg-[#141414]/5 dark:bg-white/5 transition-colors">
            {user[0]}
         </div>
         <div>
            <p className="text-[10px] font-mono transition-colors"><span className="text-[#141414]/40 dark:text-white/40">{user}</span> {action} <span className="text-[#141414] dark:text-white">{asset}</span></p>
            <p className="text-[9px] font-mono text-[#141414]/20 dark:text-white/20 uppercase tracking-widest transition-colors">{time}</p>
         </div>
      </div>
      {gain && <span className="text-[10px] font-mono text-[#34d399] font-bold">{gain}</span>}
    </div>
  )
}

function MarketCard({ id, name, price, seller, stats, tag, updatedAt, thumbnail_url, onBuy, onView }: { id: string, name: string, price: string, seller: string, stats: any, tag: string, updatedAt?: string, thumbnail_url?: string, onBuy: () => void, onView: () => void, key?: React.Key }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (id) {
       api.reviews.getByProductId(id).then(setReviews).catch(() => {});
    }
  }, [id]);

  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  
  const formattedDate = updatedAt ? new Date(updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  }) : 'Recently';

  const getTypeIcon = (t: string) => {
    switch (t.toLowerCase()) {
      case 'music': return <Zap size={40} className="text-orange-400" />;
      case 'script': return <Terminal size={40} className="text-blue-400" />;
      case 'ai': return <Cpu size={40} className="text-purple-400" />;
      case 'website': return <Globe size={40} className="text-emerald-400" />;
      default: return <Package size={40} className="text-white/20" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div 
        onClick={onView}
        className="aspect-[4/5] rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 p-1 flex flex-col relative overflow-hidden transition-all duration-700 hover:scale-[1.02] group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)] group-hover:border-white/20 cursor-pointer"
      >
         {/* Visual Core */}
         <div className="relative h-[65%] w-full rounded-[2.2rem] overflow-hidden bg-white/[0.02] flex items-center justify-center">
            {thumbnail_url ? (
              <img src={thumbnail_url} alt={name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex flex-col items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                {getTypeIcon(tag)}
                <span className="text-[10px] font-mono uppercase tracking-[0.4em]">{tag}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-60" />
            
            <div className="absolute top-6 left-6 flex items-center gap-2">
               <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">{tag}</span>
               </div>
            </div>

            <div className="absolute top-6 right-6">
              <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                <ArrowUpRight size={18} />
              </div>
            </div>
         </div>
         {/* Identity Meta */}
         <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
               <h3 className="text-2xl font-medium font-sans tracking-tight uppercase leading-tight text-white group-hover:text-blue-400 transition-colors line-clamp-1">{name}</h3>
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Node_ID: <span className="text-white/60">{seller}</span></p>
                  <span className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">{formattedDate}</span>
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
               <div className="flex flex-col">
                  <span className="text-[8px] font-mono uppercase tracking-widest text-white/20 mb-1">Contract Fee</span>
                  <span className="text-xl font-medium italic text-white">{price}</span>
               </div>
               <button 
                 onClick={(e) => { e.stopPropagation(); onBuy(); }}
                 className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
               >
                 <ShoppingCart size={18} />
               </button>
            </div>
         </div>

         {/* Interaction Overlays */}
         <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

       {reviews.length > 0 && (
          <div className="absolute -top-3 -left-3 px-4 py-2 bg-yellow-500 text-black rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-2xl scale-0 group-hover:scale-100 transition-transform z-20">
             <Star size={12} className="fill-black" />
             {avgRating.toFixed(1)}
          </div>
       )}
    </motion.div>
  );
}

function ReviewItem({ review }: { review: Review, key?: React.Key }) {
  return (
    <div className="p-4 border border-white/5 rounded-2xl space-y-3 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[8px] font-bold">
            {review.user?.username?.[0] || 'U'}
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">{review.user?.username || 'Anonymous'}</span>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={10} className={cn(s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-white/10")} />
          ))}
        </div>
      </div>
      <p className="text-[11px] font-sans text-white/80 leading-relaxed italic border-l border-blue-500/30 pl-3">"{review.comment}"</p>
    </div>
  )
}

function SkeletonRow({ cols = 4 }: { cols?: number, key?: React.Key }) {
  return (
    <div className={`grid grid-cols-${cols} px-6 py-5 items-center gap-4 animate-pulse`}>
      <div className="h-4 bg-[#141414]/5 dark:bg-white/5 rounded w-24 transition-colors" />
      <div className="h-4 bg-[#141414]/5 dark:bg-white/5 rounded w-full transition-colors" />
      <div className="h-4 bg-[#141414]/5 dark:bg-white/5 rounded w-16 transition-colors" />
      <div className="h-4 bg-[#141414]/5 dark:bg-white/5 rounded w-12 ml-auto transition-colors" />
    </div>
  );
}

function SkeletonCard({}: { key?: React.Key } = {}) {
  return (
    <div className="border border-[#141414] dark:border-white/10 rounded-2xl bg-white dark:bg-white/5 overflow-hidden flex flex-col h-[380px] animate-pulse transition-colors">
      <div className="flex-1 bg-[#141414]/5 dark:bg-white/5" />
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="h-4 bg-[#141414]/5 dark:bg-white/5 rounded w-20" />
          <div className="h-4 bg-[#141414]/5 dark:bg-white/5 rounded w-20" />
        </div>
        <div className="h-10 bg-[#141414]/5 dark:bg-white/5 rounded w-full mt-4" />
      </div>
    </div>
  );
}

function ReviewForm({ order, onClose, onSuccess }: { order: Order, onClose: () => void, onSuccess: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment) return;
    setLoading(true);
    try {
      await api.reviews.create(order.product_id, rating, comment);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#141414] border border-[#141414] dark:border-white/10 rounded-[40px] p-10 max-w-lg w-full space-y-8 shadow-2xl transition-colors"
      >
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-purple-500 uppercase tracking-[0.4em] font-bold">Experience Feedback</span>
          <h2 className="text-5xl font-medium font-sans tracking-tighter uppercase leading-none italic">{order.product?.title || 'Asset'}.</h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-125"
              >
                <Star 
                  size={32} 
                  className={cn(
                    "transition-colors",
                    s <= rating ? "fill-yellow-500 text-yellow-500" : "text-[#141414]/10 dark:text-white/10"
                  )} 
                />
              </button>
            ))}
          </div>

          <textarea 
            placeholder="Describe your synergy with this asset..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full h-32 bg-transparent border border-[#141414] dark:border-white/10 rounded-2xl p-6 focus:outline-none focus:border-[#141414] dark:focus:border-white font-mono text-xs resize-none transition-colors"
          />

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-5 border border-[#141414]/10 dark:border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || !comment}
              className="flex-1 py-5 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              Transmit Feedback
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [upiId, setUpiId] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT (TRC20)');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [nowpaymentsApiKey, setNowpaymentsApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt logic
    const loadConfig = async () => {
      try {
        const p = await api.profiles.get(user!.uid);
        if (p) {
          setUpiId(p.upi_id || '');
          setCryptoAddress(p.crypto_address || '');
          setCryptoNetwork(p.crypto_network || 'USDT (TRC20)');
          setPaypalEmail(p.paypal_email || '');
          setBankDetails(p.bank_details || '');
          setNowpaymentsApiKey(p.nowpayments_api_key || '');
        }
      } catch (err) {}
    };
    if (user) loadConfig();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.profiles.update({
        upi_id: upiId,
        crypto_address: cryptoAddress,
        crypto_network: cryptoNetwork,
        paypal_email: paypalEmail,
        bank_details: bankDetails,
        nowpayments_api_key: nowpaymentsApiKey
      });
      onClose();
    } catch (e) {
      alert("Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#141414] border border-[#141414] dark:border-white/10 rounded-[40px] p-10 max-w-lg w-full space-y-8 shadow-2xl transition-colors max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.4em] font-bold">System Config</span>
          <h2 className="text-5xl font-medium font-sans tracking-tighter uppercase leading-none italic">Payment Setup.</h2>
          <p className="text-xs opacity-60">Configure your direct payment channels for P2P transactions.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest uppercase opacity-50">Crypto Address</label>
            <div className="flex gap-2">
              <select 
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
                className="w-1/3 bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none font-mono"
              >
                <option value="USDT (TRC20)">USDT (TRC20)</option>
                <option value="USDT (ERC20)">USDT (ERC20)</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
              </select>
              <input 
                type="text" 
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                placeholder="0x..."
                className="w-2/3 bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest uppercase opacity-50">NOWPayments API Key</label>
            <input 
              type="text" 
              value={nowpaymentsApiKey}
              onChange={(e) => setNowpaymentsApiKey(e.target.value)}
              placeholder="Your NOWPayments Sandbox/Prod IPN Key"
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest uppercase opacity-50">PayPal Email</label>
            <input 
              type="email" 
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest uppercase opacity-50">Bank Details (IBAN / Account #)</label>
            <textarea 
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              placeholder="Bank Name, Account name, Account number, Routing/SWIFT/IBAN"
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono resize-y min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest uppercase opacity-50">UPI ID (India)</label>
            <input 
              type="text" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="username@bank"
              className="w-full bg-[#141414]/5 dark:bg-[#141414] border border-[#141414]/20 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 border border-[#141414]/10 dark:border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all text-center"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 bg-[#141414] dark:bg-white text-white dark:text-[#0a0a0a] rounded-full text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              Save Configuration
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SubscriptionModal({ onClose, currentPlan, onSuccess, apiKey }: { onClose: () => void, currentPlan?: SubscriptionPlan, onSuccess: () => void, apiKey?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'free' as SubscriptionPlan,
      name: 'Initial Node',
      price: '$0',
      description: 'Entry-level access for emerging developers.',
      features: ['5 Asset Slots', 'Standard Analytics', 'Nexus Support', 'Community Sync'],
      color: 'bg-white/5',
      border: 'border-white/10',
      text: 'text-white/60'
    },
    {
      id: 'pro' as SubscriptionPlan,
      name: 'Pro Shard',
      price: '$29.99',
      description: 'Enhanced throughput for professional merchants.',
      features: ['50 Asset Slots', 'Featured Listings (3)', '2.5% Commission', 'Priority Support', 'Advanced Analytics'],
      color: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      popular: true
    },
    {
      id: 'premium' as SubscriptionPlan,
      name: 'Apex Core',
      price: '$99.99',
      description: 'Maximum bandwidth for high-scale operations.',
      features: ['Unlimited Slots', 'Featured Listings (10)', '0% Commission', '24/7 Core Access', 'Custom Verification Badge'],
      color: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400'
    }
  ];

  const handleUpgrade = async (planId: SubscriptionPlan) => {
    if (planId === currentPlan) return;
    
    const planData = plans.find(p => p.id === planId);
    if (!planData) return;

    setLoading(planId);
    try {
      const priceVal = parseFloat(planData.price.replace('$', ''));
      if (priceVal > 0) {
        const res = await fetch('/api/create-nowpayments-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: priceVal,
            currency: 'usd',
            apiKey: apiKey,
            order_id: `sub_${planId}_${Date.now()}`,
            order_description: `${planData.name} Subscription Upgrade`
          })
        });
        
        let data;
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.warn("Backend API not found, falling back to manual subscription mode.", text.slice(0, 50));
          await api.subscriptions.upgrade(planId);
          onSuccess();
          alert("Subscription registered successfully! (Backend payment gateway was unavailable, manual mode activated).");
          return;
        }

        if (!res.ok) throw new Error(data.message || data.error || 'Failed to generate invoice');
        
        if (data.invoice_url) {
          window.open(data.invoice_url, '_blank');
        } else {
          throw new Error('No invoice URL returned');
        }
      }

      // Record upgrade in database
      await api.subscriptions.upgrade(planId);
      onSuccess();
    } catch (e: any) {
      alert("Subscription upgrade failed: " + (e.message || "Unknown error"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="max-w-6xl w-full my-auto"
      >
        <div className="text-center space-y-6 mb-16 px-4">
           <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2, type: "spring" }}
             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
           >
             <ShieldCheck size={12} />
             Nexus Calibration
           </motion.div>
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="text-6xl md:text-8xl font-sans font-medium tracking-tighter uppercase text-white leading-none drop-shadow-2xl"
           >
             Upgrade Shard.
           </motion.h2>
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="text-white/50 max-w-xl mx-auto text-lg/relaxed"
           >
             Select a subscription tier to increase your bandwidth and unlock proprietary market features.
           </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           {plans.map((p, idx) => (
             <motion.div 
               key={p.id}
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 + idx * 0.1, type: "spring", damping: 25, stiffness: 200 }}
               whileHover={{ y: -12, scale: 1.02 }}
               className={`relative p-10 rounded-[3rem] border ${p.border} ${p.color} flex flex-col justify-between group transition-shadow duration-500 hover:shadow-[0_40px_100px_-20px_rgba(255,255,255,0.05)] shadow-2xl backdrop-blur-md`}
             >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_10px_30px_rgba(59,130,246,0.4)]">Recommended</div>
                )}
                
                <div className="space-y-8">
                   <div className="space-y-3">
                      <h4 className={`text-[11px] font-mono uppercase tracking-[0.4em] font-bold flex items-center gap-3 ${p.text}`}>
                        {p.id === 'premium' ? <Crown size={14} className="drop-shadow-lg" /> : p.id === 'pro' ? <Zap size={14} className="drop-shadow-lg" /> : <Globe size={14} className="opacity-70" />}
                        {p.name}
                      </h4>
                      <p className="text-5xl md:text-6xl font-medium text-white tracking-tighter drop-shadow-md">{p.price}<span className="text-sm md:text-base opacity-30 ml-2 italic tracking-normal">/mo</span></p>
                   </div>
                   <p className="text-sm text-white/40 leading-relaxed max-w-[90%]">{p.description}</p>
                   <ul className="space-y-5 pt-8 border-t border-white/5">
                      {p.features.map((f, i) => (
                        <motion.li 
                           key={f} 
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: 0.6 + idx * 0.1 + i * 0.05 }}
                           className="flex items-center gap-4 text-xs md:text-sm text-white/70"
                        >
                           <div className={`w-1.5 h-1.5 rounded-full ${p.text === 'text-white/60' ? 'bg-white/40' : p.text.replace('text-', 'bg-')} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                           {f}
                        </motion.li>
                      ))}
                   </ul>
                </div>

                <motion.button 
                  whileHover={{ scale: p.id === currentPlan ? 1 : 1.05 }}
                  whileTap={{ scale: p.id === currentPlan ? 1 : 0.95 }}
                  onClick={() => handleUpgrade(p.id)}
                  disabled={loading !== null || p.id === currentPlan}
                  className={`mt-12 w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden ${
                    p.id === currentPlan 
                      ? "bg-white/5 border border-white/10 text-white/30 cursor-default" 
                      : "bg-white text-black group-hover:bg-blue-400 group-hover:text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  }`}
                >
                  {loading === p.id && <Loader2 className="animate-spin absolute left-[-20px]" size={14} />}
                  <span className="relative z-10">{p.id === currentPlan ? 'Current Shard Active' : 'Initialize Upgrade'}</span>
                </motion.button>
             </motion.div>
           ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center"
        >
           <button onClick={onClose} className="px-8 py-4 bg-[#141414]/50 border border-white/10 rounded-full text-white/40 hover:text-white hover:border-white/30 hover:bg-[#141414] transition-all uppercase font-mono text-[10px] tracking-[0.3em]">
             Abort Calibration
           </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
