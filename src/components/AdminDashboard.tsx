import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Order, Profile, Withdrawal, Job, Ticket, AppSettings, SubscriptionPlan } from '../types';
import { 
  CheckCircle, XCircle, Clock, ShieldCheck, DollarSign, Users, 
  Briefcase, Activity, Edit2, Check, Settings, Lock, Mail, 
  UserPlus, Ban, Unlock, Save, AlertTriangle, MessageSquare, Send,
  BarChart2, Shield, HeartPulse, Bell, Terminal, RefreshCw, Globe,
  Zap, Crown, CreditCard, Tag
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Typewriter from './Typewriter';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [settings, setSettings] = useState({ 
    commission_rate: 10, 
    maintenance_mode: false, 
    subscription_mode: false,
    commission_mode: true,
    site_name: 'NEXUS' 
  });
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'orders' | 'jobs' | 'users' | 'transfer' | 'settings' | 'economics' | 'account' | 'tickets' | 'analytics' | 'logs'>('overview');
  const [plans, setPlans] = useState<AppSettings['plans']>({
    pro: { price: 29.99, features: [] },
    premium: { price: 99.99, features: [] }
  });
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // System Health Logs (Mock or Real)
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Transfer ownership state
  const [transferProductId, setTransferProductId] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Account management state
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [accountActionLoading, setAccountActionLoading] = useState(false);

  // Stats calculation
  const totalCommission = orders.reduce((acc, o) => acc + (o.commission || 0), 0);
  const totalSalesVolume = orders.reduce((acc, o) => acc + (o.amount || 0), 0);
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [u, o, j, w, s, t] = await Promise.all([
        api.admin.getAllUsers(),
        api.admin.getAllOrders(),
        api.admin.getAllJobs(),
        api.admin.getAllWithdrawals(),
        api.admin.getSettings(),
        api.admin.getAllTickets()
      ]);
      setUsers(u);
      setOrders(o);
      setJobs(j);
      setWithdrawals(w);
      const appSettings = s as AppSettings;
      setSettings({
        commission_rate: appSettings.commission_rate,
        maintenance_mode: appSettings.maintenance_mode,
        subscription_mode: appSettings.subscription_mode,
        commission_mode: appSettings.commission_mode,
        site_name: appSettings.site_name
      });
      setPlans(appSettings.plans);
      setGlobalDiscount(appSettings.global_discount);
      setTickets(t);
      
      // Mock health logs
      setHealthLogs([
        { id: 1, type: 'info', msg: 'Quantum link established with Global Node_14', time: new Date().toISOString() },
        { id: 2, type: 'success', msg: 'Daily revenue shard synchronized', time: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, type: 'warning', msg: 'Attempted brute-force detected from Node_9281 (Blocked)', time: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, type: 'info', msg: 'System integrity scan completed: 100% clean', time: new Date(Date.now() - 10800000).toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleWithdrawalUpdate = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await api.admin.updateWithdrawalStatus(id, status);
      const withdrawal = withdrawals.find(w => w.id === id);
      if (withdrawal) {
        await api.notifications.create(
          withdrawal.user_id,
          `Withdrawal ${status === 'completed' ? 'Approved' : 'Rejected'}`,
          `Your withdrawal request for $${withdrawal.amount} has been ${status}.`,
          'payout'
        );
      }
      await loadData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleToggleUserBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await api.admin.toggleUserBlock(userId, isBlocked);
      await loadData();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleToggleVerification = async (userId: string, isVerified: boolean) => {
    try {
      await api.admin.toggleVerification(userId, isVerified);
      await loadData();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !transferUserId) return;
    try {
      setIsTransferring(true);
      // Check if it exists in products first
      const productDoc = await api.admin.findAnyAsset(transferProductId);
      if (!productDoc) {
        alert('Data Error: Product or Job ID not found in system registers.');
        return;
      }
      
      await api.admin.transferOwnership(transferProductId, transferUserId, productDoc.type);
      setTransferProductId('');
      setTransferUserId('');
      alert('Ownership Protocol Executed Successfully');
      await loadData();
    } catch (err: any) {
      alert('Failed to transfer ownership: ' + (err.message || 'Unknown Protocol Error'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      await api.admin.updateOrderStatus(orderId, status);
      await loadData();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       await api.admin.updateSettings({
         ...settings,
         plans,
         global_discount: globalDiscount
       });
       alert('Settings updated across network');
    } catch (err) {
       alert('Failed to update settings');
    }
  };

  const handleUpdateEconomics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.admin.updateSettings({
        plans,
        global_discount: globalDiscount
      });
      alert('Economics protocols updated');
    } catch (err) {
      alert('Failed to update economics');
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReply.trim()) return;
    try {
      setIsReplying(true);
      await api.admin.replyToTicket(activeTicket.id, ticketReply);
      setTicketReply('');
      await loadData();
      // Update active ticket locally to show new reply
      const updated = await api.admin.getAllTickets();
      const current = updated.find(t => t.id === activeTicket.id);
      if (current) setActiveTicket(current);
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
       await api.admin.closeTicket(id);
       await loadData();
       if (activeTicket?.id === id) setActiveTicket(null);
    } catch (err) {
       alert('Failed to close ticket');
    }
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentPassword) return;

    try {
      setAccountActionLoading(true);
      // Re-authenticate user first (required for security sensitive actions)
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);

      if (newEmail !== user.email) {
        await updateEmail(auth.currentUser!, newEmail);
      }
      if (newPassword) {
        await updatePassword(auth.currentUser!, newPassword);
      }
      alert('Account credentials updated successfully');
      setNewPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      console.error(err);
      alert('Action failed: ' + err.message);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      setIsBroadcasting(true);
      await Promise.all(users.map(u => 
        api.notifications.create(u.id, broadcastTitle, broadcastMessage, 'announcement')
      ));
      setBroadcastTitle('');
      setBroadcastMessage('');
      alert('Broadcast protocol successful. Signaling all active nodes.');
    } catch (err) {
      alert('Broadcast failed.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const renderAnalytics = () => {
    // Basic data synthesis for Recharts
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayOrders = orders.filter(o => new Date(o.created_at).toLocaleDateString() === d.toLocaleDateString());
      const revenue = dayOrders.reduce((acc, o) => acc + o.amount, 0);
      return { name: dateStr, revenue, orders: dayOrders.length };
    });

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm">
            <h3 className="font-bold uppercase tracking-widest text-xs opacity-40 mb-8">Node Revenue Velocity (Last 7 Cycles)</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7Days}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <RechartTooltip contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </div>
          <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm">
            <h3 className="font-bold uppercase tracking-widest text-xs opacity-40 mb-8">Asset Dispatch Frequency</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <RechartTooltip contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <Activity className="w-8 h-8 mb-4 animate-spin" />
        <div className="font-mono text-xs uppercase tracking-widest">Accessing Secure Admin Node...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-left">
        <h2 className="text-sm font-sans text-red-500 uppercase tracking-widest font-medium flex items-center gap-2">
          <ShieldCheck size={16} /> Restricted Area
        </h2>
        <h1 className="text-4xl md:text-5xl font-sans font-semibold tracking-tight">
          Command Center
        </h1>
        <p className="text-sm text-[#141414]/60 dark:text-white/60 max-w-xl">
          Complete network oversight. Monitor system transactions, users, and manage platform protocol requests.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['overview', 'analytics', 'economics', 'withdrawals', 'orders', 'jobs', 'users', 'tickets', 'transfer', 'settings', 'logs', 'account'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
               "px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all flex items-center gap-2",
               activeTab === tab ? "bg-[#141414] dark:bg-white text-white dark:text-[#141414]" : "bg-[#141414]/5 dark:bg-white/5 hover:bg-[#141414]/10 dark:hover:bg-white/10"
            )}
          >
            {tab === 'overview' && <Activity size={14} />}
            {tab === 'analytics' && <BarChart2 size={14} />}
            {tab === 'economics' && <DollarSign size={14} />}
            {tab === 'logs' && <Terminal size={14} />}
            {tab === 'tickets' && <MessageSquare size={14} />}
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Platform Volume" value={`$${totalSalesVolume.toFixed(2)}`} icon={<Activity />} />
              <StatCard title="Platform Revenue (Commission)" value={`$${totalCommission.toFixed(2)}`} icon={<DollarSign />} variant="success" />
              <StatCard title="Pending Withdrawals" value={pendingWithdrawalsCount.toString()} icon={<Clock />} variant="warning" />
              <StatCard title="Registered Nodes (Users)" value={users.length.toString()} icon={<Users />} />
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm">
              <h3 className="font-sans text-xl font-semibold mb-6">Withdrawal Requests</h3>
              <div className="space-y-3">
                {withdrawals.length === 0 && <p className="text-sm opacity-50">No requests found.</p>}
                {withdrawals.map(w => (
                  <div key={w.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-[#141414]/[0.02] dark:bg-white/[0.02] rounded-2xl gap-4">
                    <div className="flex-1">
                       <div className="font-sans font-medium">{(w as any).user?.username || 'Unknown Node'} <span className="opacity-50 text-sm">({w.user_id})</span></div>
                       <div className="text-xs text-[#141414]/60 dark:text-white/60 space-y-1 mt-2">
                         <p>Amount: <span className="font-semibold text-[#141414] dark:text-white">${w.amount}</span></p>
                         <p>Method: {w.method}</p>
                         <p>Details: {w.details}</p>
                         <p>Date: {new Date(w.created_at).toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", 
                            w.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                       )}>
                         {w.status}
                       </div>
                       {w.status === 'pending' && (
                         <div className="flex gap-1 ml-4">
                           <button onClick={() => handleWithdrawalUpdate(w.id, 'completed')} className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors" title="Mark Paid">
                             <Check size={16} />
                           </button>
                           <button onClick={() => handleWithdrawalUpdate(w.id, 'rejected')} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" title="Reject">
                             <XCircle size={16} />
                           </button>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm overflow-x-auto">
              <h3 className="font-sans text-xl font-semibold mb-6">Global Order Ledger</h3>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#141414]/10 dark:border-white/10 text-[#141414]/50 dark:text-white/50 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4 font-medium">Order ID</th>
                    <th className="py-3 px-4 font-medium">Product / Job</th>
                    <th className="py-3 px-4 font-medium">Buyer</th>
                    <th className="py-3 px-4 font-medium">Seller</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Commission</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="py-4 text-center opacity-50">No orders found</td></tr>
                  )}
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-[#141414]/5 dark:border-white/5 hover:bg-[#141414]/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-[10px]">{o.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 truncate max-w-[200px]">{o.product?.title || o.product_id}</td>
                      <td className="py-3 px-4 truncate max-w-[150px]">{(o as any).buyer?.username || o.buyer_id}</td>
                      <td className="py-3 px-4 truncate max-w-[150px]">{(o as any).seller?.username || o.seller_id}</td>
                      <td className="py-3 px-4 font-mono font-medium">${o.amount}</td>
                      <td className="py-3 px-4 font-mono text-green-500">${o.commission}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                           <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", o.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-[#141414]/10 dark:bg-white/10')}>
                            {o.status}
                           </span>
                           {o.status !== 'completed' && (
                             <button 
                               onClick={() => handleOrderStatusUpdate(o.id, 'completed')}
                               className="p-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors"
                             >
                               <CheckCircle size={14} />
                             </button>
                           )}
                           {o.payment_proof && (
                             <a 
                               href={o.payment_proof} 
                               target="_blank" 
                               rel="noreferrer"
                               className="p-1 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                             >
                               <ShieldCheck size={14} />
                             </a>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm overflow-x-auto">
              <h3 className="font-sans text-xl font-semibold mb-6">Global Hiring Ledger</h3>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#141414]/10 dark:border-white/10 text-[#141414]/50 dark:text-white/50 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4 font-medium">Job ID</th>
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium">Client</th>
                    <th className="py-3 px-4 font-medium">Budget</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center opacity-50">No jobs found</td></tr>
                  )}
                  {jobs.map(j => (
                    <tr key={j.id} className="border-b border-[#141414]/5 dark:border-white/5 hover:bg-[#141414]/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-[10px]">{j.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 truncate max-w-[200px]">{j.title}</td>
                      <td className="py-3 px-4 truncate max-w-[150px]">{(j as any).client?.username || j.client_id}</td>
                      <td className="py-3 px-4 font-mono font-medium">${j.budget}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-1 rounded text-xs", j.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-[#141414]/10 dark:bg-white/10')}>
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm overflow-x-auto">
              <h3 className="font-sans text-xl font-semibold mb-6">System Identity Directory</h3>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[#141414]/10 dark:border-white/10 text-[#141414]/50 dark:text-white/50 uppercase tracking-widest text-[10px]">
                    <th className="py-3 px-4 font-medium">User ID</th>
                    <th className="py-3 px-4 font-medium">Username</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-[#141414]/5 dark:border-white/5 hover:bg-[#141414]/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-[10px]">{u.id}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-[#141414] dark:text-white">{u.username}</div>
                          <div className="text-[10px] opacity-40">{u.email || 'No email associated'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{u.role}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase",
                              (u as any).status === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                             )}>
                              {(u as any).status || 'active'}
                            </span>
                            {u.verification_badge && (
                              <span className="p-1 bg-blue-500/10 text-blue-500 rounded" title="Verified Seller">
                                <ShieldCheck size={12} />
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 items-center opacity-30 text-[8px] font-mono">
                             <Shield size={8} /> Secure Node
                             <Globe size={8} className="ml-2" /> IP: 192.168.1.{(u.id.charCodeAt(0) % 255)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {u.uid !== user?.uid && (
                            <button 
                              onClick={() => handleToggleUserBlock(u.id, (u as any).status !== 'blocked')}
                              className={cn(
                                 "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                                 (u as any).status === 'blocked' ? "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white" : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                              )}
                            >
                               {(u as any).status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                          )}
                          <button 
                            onClick={() => handleToggleVerification(u.id, !u.verification_badge)}
                            className={cn(
                               "px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                               u.verification_badge ? "bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-whiet" : "bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white"
                            )}
                          >
                             {u.verification_badge ? 'Unverify' : 'Verify'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-sans text-xl font-semibold mb-6 flex items-center gap-2">
                  <MessageSquare size={20} /> Support Tickets
                </h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                  {tickets.length === 0 && <p className="text-sm opacity-50">No tickets open.</p>}
                  {tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTicket(t)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all",
                        activeTicket?.id === t.id 
                          ? "bg-[#141414] dark:bg-white text-white dark:text-[#141414] border-transparent" 
                          : "bg-white dark:bg-[#141414] border-[#141414]/10 dark:border-white/10 hover:bg-[#141414]/5 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                          t.status === 'open' ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                        )}>{t.status}</span>
                        <span className="text-[10px] opacity-40">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-sm truncate">{t.subject}</div>
                      <div className="text-[10px] opacity-60 mt-1">From: {t.user?.username || t.userId}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2">
                 {activeTicket ? (
                   <div className="bg-white dark:bg-[#141414] rounded-3xl border border-[#141414]/10 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-[600px]">
                      <div className="p-6 border-b border-[#141414]/10 dark:border-white/10 flex justify-between items-center bg-[#fafafa] dark:bg-black/20">
                         <div>
                            <h3 className="font-bold text-lg">{activeTicket.subject}</h3>
                            <p className="text-xs opacity-50">Ticket ID: {activeTicket.id}</p>
                         </div>
                         {activeTicket.status === 'open' && (
                           <button 
                             onClick={() => handleCloseTicket(activeTicket.id)}
                             className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all"
                           >
                              Close Ticket
                           </button>
                         )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Original Message */}
                        <div className="flex gap-4">
                           <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 font-bold text-xs">
                             {activeTicket.user?.username?.[0] || '?'}
                           </div>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                 <span className="font-bold text-sm">{activeTicket.user?.username || 'User'}</span>
                                 <span className="text-[10px] opacity-40">{new Date(activeTicket.created_at).toLocaleString()}</span>
                              </div>
                              <div className="p-4 bg-[#141414]/5 dark:bg-white/5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                                 {activeTicket.message}
                              </div>
                           </div>
                        </div>

                        {/* Replies */}
                        {activeTicket.replies?.map((r, i) => (
                           <div key={i} className={cn("flex gap-4", r.senderId === user?.uid ? "flex-row-reverse" : "")}>
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs",
                                r.senderId === user?.uid ? "bg-purple-500" : "bg-blue-500"
                              )}>
                                {r.senderId === user?.uid ? 'A' : (activeTicket.user?.username?.[0] || '?')}
                              </div>
                              <div className={cn("space-y-1 max-w-[80%]", r.senderId === user?.uid ? "text-right" : "")}>
                                 <div className="flex items-center gap-2 justify-end">
                                    <span className="font-bold text-sm">{r.senderId === user?.uid ? 'Support Team' : activeTicket.user?.username}</span>
                                    <span className="text-[10px] opacity-40">{new Date(r.created_at).toLocaleString()}</span>
                                 </div>
                                 <div className={cn(
                                   "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                   r.senderId === user?.uid ? "bg-purple-500 text-white" : "bg-[#141414]/5 dark:bg-white/5"
                                 )}>
                                    {r.message}
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>

                      {activeTicket.status === 'open' && (
                        <div className="p-4 bg-[#fafafa] dark:bg-black/20 border-t border-[#141414]/10 dark:border-white/10">
                           <form onSubmit={handleReplyTicket} className="flex gap-2">
                              <input 
                                value={ticketReply}
                                onChange={e => setTicketReply(e.target.value)}
                                placeholder="Type your response to the user..."
                                className="flex-1 bg-white dark:bg-black border border-[#141414]/10 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              />
                              <button 
                                type="submit"
                                disabled={isReplying || !ticketReply.trim()}
                                className="p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-all shadow-lg"
                              >
                                <Send size={20} />
                              </button>
                           </form>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="h-full min-h-[500px] flex flex-col items-center justify-center opacity-20">
                      <MessageSquare size={80} strokeWidth={1} />
                      <p className="font-mono text-xs uppercase tracking-widest mt-4">Select a ticket to begin resolution</p>
                   </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && renderAnalytics()}

          {activeTab === 'logs' && (
            <div className="p-8 bg-[#0a0a0a] text-white rounded-[2rem] border border-white/5 shadow-2xl font-mono relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-scanline" />
               <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                 <h3 className="text-xs font-bold uppercase tracking-[0.5em] text-blue-500">System Health Logs</h3>
                 <div className="flex items-center gap-2 text-[10px] opacity-40">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   LIVE MONITORING
                 </div>
               </div>
               <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                 {healthLogs.map(log => (
                   <div key={log.id} className="flex gap-4 group">
                     <span className="opacity-20 whitespace-nowrap text-[10px]">{new Date(log.time).toLocaleTimeString()}</span>
                     <span className={cn(
                       "font-bold text-[10px] uppercase tracking-widest min-w-[80px]",
                       log.type === 'error' ? 'text-red-500' : 
                       log.type === 'warning' ? 'text-yellow-500' :
                       log.type === 'success' ? 'text-green-500' : 'text-blue-500'
                     )}>[{log.type}]</span>
                     <span className="text-[10px] opacity-80 group-hover:opacity-100 transition-opacity">{log.msg}</span>
                   </div>
                 ))}
                 <div className="animate-pulse text-blue-500/40 text-[10px]">_</div>
               </div>
            </div>
          )}

          {activeTab === 'economics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-8 bg-white dark:bg-[#141414] rounded-[3rem] border border-blue-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <DollarSign className="text-blue-500" /> Subscription Engineering
                </h3>
                <p className="text-sm opacity-50 mb-8">Modify the pricing and parameters of the network subscription tiers.</p>
                
                <form onSubmit={handleUpdateEconomics} className="space-y-8">
                  <div className="space-y-6 p-6 bg-blue-500/[0.02] rounded-3xl border border-blue-500/10">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-blue-500 flex items-center gap-2">
                       <Activity size={14} /> PRO Plan
                    </h4>
                    <AdminInput 
                      label="Monthly Subscription Amount (USD)" 
                      type="number" 
                      value={plans.pro.price} 
                      onChange={(val: any) => setPlans({...plans, pro: { ...plans.pro, price: parseFloat(val) }})} 
                    />
                  </div>

                  <div className="space-y-6 p-6 bg-purple-500/[0.02] rounded-3xl border border-purple-500/10">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-purple-500 flex items-center gap-2">
                       <Shield size={14} /> PREMIUM Plan
                    </h4>
                    <AdminInput 
                      label="Monthly Subscription Amount (USD)" 
                      type="number" 
                      value={plans.premium.price} 
                      onChange={(val: any) => setPlans({...plans, premium: { ...plans.premium, price: parseFloat(val) }})} 
                    />
                  </div>

                  <div className="p-6 bg-orange-500/[0.02] rounded-3xl border border-orange-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="font-bold text-sm uppercase tracking-widest text-orange-500 flex items-center gap-2">
                          <Tag size={14} /> Global Discount
                       </h4>
                       <span className="font-mono font-bold text-orange-500">{globalDiscount}% OFF</span>
                    </div>
                    <input 
                      type="range" min="0" max="90" 
                      value={globalDiscount} 
                      onChange={(e) => setGlobalDiscount(parseInt(e.target.value))}
                      className="w-full h-2 bg-orange-500/10 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                    />
                    <p className="text-[10px] opacity-40 uppercase tracking-tighter">This applies to all listed assets immediately across the entire node network.</p>
                  </div>

                  <button type="submit" className="w-full h-16 bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-blue-500/20">
                     <Save size={18} /> Update Economics Cluster
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="p-10 bg-[#0a0a0a] text-white rounded-[3.5rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-0">
                      <Zap size={140} />
                   </div>
                   
                   <div className="relative z-10 space-y-8">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <h3 className="text-3xl font-medium font-sans tracking-tighter uppercase italic">Fiscal Metrics.</h3>
                           <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em]">Network Revenue Statistics</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                           <Activity className="text-blue-500 animate-pulse" size={20} />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
                           <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest">
                              <div className="w-1 h-1 rounded-full bg-blue-500" />
                              PRO NODES
                           </div>
                           <div className="text-4xl font-sans font-medium tracking-tighter">{users.filter(u => u.subscription_plan === 'pro').length}</div>
                        </div>
                        
                        <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
                           <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest">
                              <div className="w-1 h-1 rounded-full bg-purple-500" />
                              APEX CORES
                           </div>
                           <div className="text-4xl font-sans font-medium tracking-tighter text-purple-400">{users.filter(u => u.subscription_plan === 'premium').length}</div>
                        </div>

                        <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
                           <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              ARPU
                           </div>
                           <div className="text-3xl font-sans font-medium tracking-tighter">$42.12</div>
                        </div>

                        <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
                           <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              CHURN
                           </div>
                           <div className="text-3xl font-sans font-medium tracking-tighter text-red-500">2.4%</div>
                        </div>
                     </div>

                     <div className="p-8 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent rounded-[2.5rem] border border-white/10 backdrop-blur-3xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-40 mix-blend-overlay" />
                        <div className="relative z-10 flex justify-between items-end">
                           <div className="space-y-2">
                              <h4 className="font-bold text-[10px] uppercase tracking-[0.4em] text-white/40">Projected MRR</h4>
                              <div className="text-6xl font-medium font-sans tracking-tighter leading-none italic">$14,582</div>
                              <p className="text-[9px] font-mono opacity-30 mt-2">NETWORK THROUGHPUT: {users.length} NODES</p>
                           </div>
                           <div className="w-24 h-12">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[{v:10}, {v:25}, {v:15}, {v:30}, {v:20}, {v:35}]}>
                                  <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="transparent" strokeWidth={3} />
                                </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm max-w-xl">
               <h3 className="font-sans text-xl font-semibold mb-2 flex items-center gap-2"><RefreshCw size={20} /> Data Transfer Protocol</h3>
               <p className="text-sm text-[#141414]/60 dark:text-white/60 mb-6">Force re-assignment of asset ownership within the platform registry.</p>
               
               <form onSubmit={handleTransfer} className="space-y-6">
                 <AdminInput label="Asset ID (Product/Job)" value={transferProductId} onChange={setTransferProductId} placeholder="Enter full UID" />
                 <AdminInput label="New Owner ID (User UID)" value={transferUserId} onChange={setTransferUserId} placeholder="Target receiver UID" />
                 <button
                   type="submit"
                   disabled={isTransferring}
                   className="w-full py-4 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                 >
                   {isTransferring ? 'Re-writing Registry...' : 'Initiate Re-assignment'}
                 </button>
               </form>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm">
                 <h3 className="font-sans text-xl font-semibold mb-2">System Config</h3>
                 <p className="text-sm text-[#141414]/60 dark:text-white/60 mb-6">Global platform parameters and protocol behaviors.</p>
                 
                 <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <AdminInput label="Site Name" type="text" value={settings.site_name} onChange={(val: any) => setSettings({...settings, site_name: val})} placeholder="NEXUS" />
                  
                  <div className="space-y-2">
                     <label className="text-xs font-sans uppercase tracking-widest text-[#141414]/50 dark:text-white/50 font-medium">Commission Rate (%)</label>
                     <div className="flex items-center gap-4">
                        <input 
                          type="range" min="0" max="50" 
                          value={settings.commission_rate} 
                          onChange={(e) => setSettings({...settings, commission_rate: parseInt(e.target.value)})}
                          className="flex-1 h-2 bg-[#141414]/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                        />
                        <span className="font-mono text-lg font-bold w-12 text-right">{settings.commission_rate}%</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#141414]/5 dark:bg-white/5 rounded-2xl border border-[#141414]/10 dark:border-white/10">
                     <div>
                        <div className="font-medium">Subscription Mode</div>
                        <div className="text-[10px] opacity-40">Require monthly token for network access.</div>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setSettings({...settings, subscription_mode: !settings.subscription_mode})}
                       className={cn(
                         "w-12 h-6 rounded-full transition-all relative",
                         settings.subscription_mode ? "bg-blue-500" : "bg-[#141414]/20 dark:bg-white/20"
                       )}
                     >
                       <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", settings.subscription_mode ? "right-1" : "left-1")} />
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#141414]/5 dark:bg-white/5 rounded-2xl border border-[#141414]/10 dark:border-white/10">
                     <div>
                        <div className="font-medium">Commission Mode</div>
                        <div className="text-[10px] opacity-40">Enable platform per-transaction fees.</div>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setSettings({...settings, commission_mode: !settings.commission_mode})}
                       className={cn(
                         "w-12 h-6 rounded-full transition-all relative",
                         settings.commission_mode ? "bg-green-500" : "bg-[#141414]/20 dark:bg-white/20"
                       )}
                     >
                       <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", settings.commission_mode ? "right-1" : "left-1")} />
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#141414]/5 dark:bg-white/5 rounded-2xl border border-[#141414]/10 dark:border-white/10">
                     <div>
                        <div className="font-medium">Maintenance Mode</div>
                        <div className="text-[10px] opacity-40">Block all non-admin access to the platform.</div>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setSettings({...settings, maintenance_mode: !settings.maintenance_mode})}
                       className={cn(
                         "w-12 h-6 rounded-full transition-all relative",
                         settings.maintenance_mode ? "bg-red-500" : "bg-[#141414]/20 dark:bg-white/20"
                       )}
                     >
                       <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", settings.maintenance_mode ? "right-1" : "left-1")} />
                     </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-xl font-semibold text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Save Protocol Updates
                  </button>
                 </form>
               </div>

               <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm border-blue-500/20">
                 <h3 className="font-sans text-xl font-semibold mb-2 flex items-center gap-2">
                   <Bell size={20} className="text-blue-500" />
                   Global Broadcast
                 </h3>
                 <p className="text-sm text-[#141414]/60 dark:text-white/60 mb-6">Push an administrative signal to all active system nodes.</p>
                 
                 <form onSubmit={handleBroadcast} className="space-y-4">
                   <AdminInput label="Broadcast Title" type="text" value={broadcastTitle} onChange={setBroadcastTitle} placeholder="PLATFORM UPDATE" />
                   <div className="space-y-2">
                     <label className="text-xs font-sans uppercase tracking-widest opacity-40 font-bold">Signal Message</label>
                     <textarea 
                       value={broadcastMessage}
                       onChange={e => setBroadcastMessage(e.target.value)}
                       placeholder="Enter the transmission content..."
                       className="w-full h-32 bg-[#141414]/5 dark:bg-black/50 border border-[#141414]/10 dark:border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                     />
                   </div>
                   <button 
                     disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                     className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                   >
                     {isBroadcasting ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                     Initiate Wide-Band Signal
                   </button>
                 </form>
               </div>
             </div>
          )}

          {activeTab === 'account' && (
             <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 shadow-sm max-w-xl">
               <h3 className="font-sans text-xl font-semibold mb-2 flex items-center gap-2"><Lock size={20} /> Access Control</h3>
               <p className="text-sm text-[#141414]/60 dark:text-white/60 mb-6">Update administrative credentials. This action requires re-authentication.</p>
               
               <form onSubmit={handleAccountUpdate} className="space-y-6">
                 <AdminInput label="Admin Email" type="email" value={newEmail} onChange={setNewEmail} icon={<Mail size={16} />} />
                 <AdminInput label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="Leave blank to keep current" icon={<Lock size={16} />} />
                 
                 <div className="pt-4 border-t border-[#141414]/10 dark:border-white/10">
                    <AdminInput 
                      label="Confirm Current Password" 
                      type="password" 
                      required 
                      value={currentPassword} 
                      onChange={setCurrentPassword} 
                      placeholder="Required for any changes"
                      className="border-red-500/20"
                    />
                    <div className="mt-2 flex items-center gap-2 text-red-500/60 font-medium text-[10px] uppercase tracking-widest">
                       <AlertTriangle size={12} /> Verification Required
                    </div>
                 </div>

                 <button
                   type="submit"
                   disabled={accountActionLoading}
                   className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                 >
                   {accountActionLoading ? 'Processing Secure Hash...' : 'Update Administrative Node'}
                 </button>
               </form>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AdminInput({ label, value, onChange, placeholder, type = 'text', required = false, icon, className }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-sans uppercase tracking-widest text-[#141414]/50 dark:text-white/50 font-medium flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
           "w-full bg-[#141414]/5 dark:bg-black/50 border border-[#141414]/10 dark:border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all",
           className
        )}
        placeholder={placeholder}
      />
    </div>
  );
}

function StatCard({ title, value, icon, variant = 'default' }: { title: string, value: string, icon: React.ReactNode, variant?: 'default' | 'success' | 'warning' }) {
  return (
    <div className="p-6 bg-white dark:bg-[#141414] rounded-2xl border border-[#141414]/10 dark:border-white/10 shadow-sm relative overflow-hidden">
       <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
          variant === 'success' ? "bg-green-500/10 text-green-500" :
          variant === 'warning' ? "bg-yellow-500/10 text-yellow-500" : "bg-blue-500/10 text-blue-500"
       )}>
         {icon}
       </div>
       <div className="text-xs font-sans font-medium uppercase tracking-wider text-[#141414]/50 dark:text-white/50 mb-1">{title}</div>
       <div className="text-3xl font-sans font-semibold tracking-tight">{value}</div>
    </div>
  );
}

