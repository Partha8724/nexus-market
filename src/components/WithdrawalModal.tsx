import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, DollarSign, CreditCard, Wallet as WalletIcon, Banknote } from 'lucide-react';
import { api } from '../services/api';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

export default function WithdrawalModal({ isOpen, onClose, availableBalance, onSuccess }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount < 5) {
      setError('Minimum withdrawal is $5');
      return;
    }

    if (numAmount > availableBalance) {
      setError('Insufficient funds');
      return;
    }

    if (!method || !details) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.withdrawals.create({
        amount: numAmount,
        method,
        details
      });
      onSuccess();
      onClose();
      setAmount('');
      setMethod('');
      setDetails('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0a0a]/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#111111] w-full max-w-md rounded-[2.5rem] border border-[#141414]/10 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-[#141414]/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-sans font-bold flex items-center gap-2">
                  <ArrowUpRight className="text-blue-500" />
                  Request Withdrawal
                </h2>
                <p className="text-xs text-[#141414]/50 dark:text-white/50 mt-1">Available: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[#141414]/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#141414]/40 dark:text-white/40 font-bold">Amount to Withdraw</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]/40 dark:text-white/40 font-mono font-bold">$</div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="5"
                    className="w-full bg-[#141414]/5 dark:bg-white/5 border border-[#141414]/10 dark:border-white/10 rounded-2xl pl-8 pr-4 py-4 font-mono text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#141414]/40 dark:text-white/40 font-bold">Method</label>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { id: 'crypto', label: 'Crypto', icon: <WalletIcon size={16} /> },
                     { id: 'paypal', label: 'PayPal', icon: <CreditCard size={16} /> },
                     { id: 'bank', label: 'Bank', icon: <Banknote size={16} /> },
                     { id: 'upi', label: 'UPI', icon: <DollarSign size={16} /> }
                   ].map((m) => (
                     <button
                       key={m.id}
                       type="button"
                       onClick={() => setMethod(m.id)}
                       className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                         method === m.id 
                           ? 'bg-blue-500 border-blue-500 text-white' 
                           : 'bg-[#141414]/5 dark:bg-white/5 border-[#141414]/10 dark:border-white/10 hover:border-[#141414]/30 dark:hover:border-white/30'
                       }`}
                     >
                       {m.icon}
                       <span className="text-sm font-medium">{m.label}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#141414]/40 dark:text-white/40 font-bold">Payment Details</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. BTC Address, PayPal Email, or Bank details..."
                  className="w-full bg-[#141414]/5 dark:bg-white/5 border border-[#141414]/10 dark:border-white/10 rounded-2xl p-4 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amount || !method || !details}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-2xl font-sans font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Submit Request <ArrowUpRight size={18} /></>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
