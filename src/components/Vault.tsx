import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Order, JobApplication, Withdrawal } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import Typewriter from './Typewriter';
import WithdrawalModal from './WithdrawalModal';

export default function Vault() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [salesData, jobsData, withdrawalsData] = await Promise.all([
        api.orders.mySales(),
        api.applications.getMy('developer'),
        api.withdrawals.getMy()
      ]);
      setSales(salesData);
      setJobs(jobsData);
      setWithdrawals(withdrawalsData);
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate balance
  const completedSales = sales.filter(s => s.status === 'released' || s.status === 'completed');
  const salesEarnings = completedSales.reduce((acc, sale) => acc + (sale.amount - sale.commission), 0);
  
  const paidJobs = jobs.filter(j => j.status === 'paid');
  const jobsEarnings = paidJobs.reduce((acc, app) => acc + ((app.job?.budget || 0) * 0.95), 0);

  const totalEarnings = salesEarnings + jobsEarnings;
  
  const pendingOrCompletedWithdrawals = withdrawals.filter(w => w.status !== 'rejected');
  const withdrawnAmount = pendingOrCompletedWithdrawals.reduce((acc, w) => acc + w.amount, 0);

  const availableBalance = totalEarnings - withdrawnAmount;

  const allTransactions = [
    ...completedSales.map(s => ({
      id: `sale_${s.id}`,
      type: 'sale',
      amount: s.amount - s.commission,
      desc: `Sale: ${s.product?.title || s.product_id}${s.buyer?.username ? ` to ${s.buyer.username}` : ''}`,
      date: s.created_at,
      status: 'completed'
    })),
    ...paidJobs.map(j => ({
      id: `job_${j.id}`,
      type: 'job',
      amount: (j.job?.budget || 0) * 0.95,
      desc: `Job Payment: ${j.job?.title || 'Gig'}${j.client?.username ? ` from ${j.client.username}` : ''}`,
      date: j.created_at, 
      status: 'completed'
    })),
    ...withdrawals.map(w => ({
      id: `with_${w.id}`,
      type: 'withdrawal',
      amount: -w.amount,
      desc: `Withdrawal via ${w.method}`,
      date: w.created_at,
      status: w.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <Wallet className="w-8 h-8 mb-4 animate-bounce" />
        <div className="font-mono text-xs uppercase tracking-widest">Accessing Vault...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 text-left">
        <h2 className="text-sm font-sans text-[#141414]/50 dark:text-white/50 uppercase tracking-widest font-medium">Finance Protocol</h2>
        <h1 className="text-4xl md:text-5xl font-sans font-semibold tracking-tight">
          The Vault
        </h1>
        <p className="text-sm text-[#141414]/60 dark:text-white/60 max-w-xl">Manage your earnings, request withdrawals, and view your complete financial transaction history across all services.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        <div className="lg:col-span-1 space-y-8">
          <div className="p-8 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] dark:from-white/10 dark:to-white/5 text-white dark:text-white rounded-[2rem] relative overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                   <Wallet size={24} className="text-white" />
                </div>
                <h3 className="text-sm font-sans font-medium text-white/80 uppercase tracking-wider">Available Balance</h3>
              </div>
              <div className="text-4xl md:text-5xl font-sans font-medium tracking-tight flex items-center mt-2">
                <span className="text-2xl mr-1 text-[#141414]/50 dark:text-white/50">$</span>
                {availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-sans border-b border-white/10 pb-3">
                  <span className="text-white/60">Total Revenue</span>
                  <span className="font-medium">${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-sans pt-1">
                  <span className="text-white/60">Withdrawn</span>
                  <span className="font-medium">${withdrawnAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={availableBalance < 5}
                  className="mt-6 w-full py-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-white/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                >
                  <ArrowUpRight size={18} /> Request Withdrawal
                </button>
              </div>
            </div>
            
            <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                  <Wallet size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-bold">Secure Settlement</h4>
                  <p className="text-xs opacity-60">Verified payments via the scrypto network transition layer.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="p-8 bg-white dark:bg-[#141414] rounded-[2rem] border border-[#141414]/10 dark:border-white/10 h-full shadow-sm flex flex-col">
            <h3 className="font-sans text-xl font-semibold mb-6 flex items-center justify-between">
              Transaction History
              <span className="text-xs font-medium bg-[#141414]/5 dark:bg-white/10 px-3 py-1 rounded-full text-[#141414]/60 dark:text-white/60">
                {allTransactions.length} Transactions
              </span>
            </h3>

            
            {allTransactions.length === 0 ? (
              <div className="flex justify-center items-center h-40 opacity-50 font-sans text-sm">
                No transactions found.
              </div>
            ) : (
              <div className="space-y-3">
                {allTransactions.map((tx) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    key={tx.id} 
                    className="flex items-center justify-between p-4 bg-[#141414]/[0.02] hover:bg-[#141414]/[0.04] dark:bg-white/[0.02] dark:hover:bg-white/[0.04] rounded-2xl border border-transparent transition-all cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                        tx.amount > 0 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      )}>
                        {tx.amount > 0 ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                      </div>
                      <div>
                        <div className="font-sans font-medium text-base text-[#141414] dark:text-white">{tx.desc}</div>
                        <div className="font-sans text-xs text-[#141414]/50 dark:text-white/50 flex items-center gap-2 mt-1">
                          <span>{new Date(tx.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</span>
                          <span className="w-1 h-1 rounded-full bg-current opacity-30" />
                          <span className={cn(
                            "flex items-center gap-1 font-medium",
                            tx.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                            tx.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          )}>
                            {tx.status === 'completed' && <CheckCircle size={12} />}
                            {tx.status === 'pending' && <Clock size={12} />}
                            {tx.status === 'rejected' && <XCircle size={12} />}
                            <span className="capitalize">{tx.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-sans font-semibold text-lg whitespace-nowrap ml-4",
                      tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-[#141414] dark:text-white"
                    )}>
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <WithdrawalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        availableBalance={availableBalance}
        onSuccess={loadData}
      />
    </div>
  );
}
