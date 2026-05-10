import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText, Scale, Info, ScrollText, Users } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPage?: 'privacy' | 'terms' | 'refund' | 'rules' | 'seller' | 'community';
}

const LegalPages = {
  privacy: {
    title: 'Privacy Policy',
    icon: <Shield className="text-blue-500" />,
    content: `
      ## 1. Information We Collect
      NEXUS collects basic user information such as email address, username, and avatar for account creation. We also store transaction history and messaging data to provide marketplace services.

      ## 2. How We Use Data
      We use your data to facilitate transactions, improve platform performance, and ensure security. We do not sell your personal data to third parties.

      ## 3. Data Protection
      All data is stored securely using industry-standard encryption. Access to Sensitive Personal Information (PII) is strictly restricted.

      ## 4. Cookies
      We use functional cookies to maintain your session and preferences.
    `
  },
  terms: {
    title: 'Terms of Service',
    icon: <FileText className="text-purple-500" />,
    content: `
      ## 1. Acceptance of Terms
      By accessing NEXUS, you agree to be bound by these Terms of Service.

      ## 2. Marketplace Conduct
      Users must provide accurate information. Fraudulent activity, including scam listings or unauthorized chargebacks, will lead to immediate permanent ban.

      ## 3. Commissions
      NEXUS charges a 5% commission on all product sales and job payments to maintain the infrastructure.

      ## 4. Intellectual Property
      Sellers must own the rights to the products they list. NEXUS is not liable for copyright infringements but will remove infringing content upon valid proof.
    `
  },
  refund: {
    title: 'Refund Policy',
    icon: <Scale className="text-green-500" />,
    content: `
      ## 1. Digital Goods
      Due to the nature of digital products, refunds are generally not provided once a file has been downloaded or a service has been delivered, unless the product is significantly the same as described.

      ## 2. Dispute Resolution
      Buyers can open a support ticket if a product is faulty. NEXUS will mediate the dispute between the buyer and seller.

      ## 3. Worker Payments
      Payments for jobs are held in the NEXUS protocol until milestones are completed. Once funds are released to a worker, they cannot be refunded.
    `
  },
  rules: {
    title: 'Content Rules',
    icon: <ScrollText className="text-orange-500" />,
    content: `
      ## 1. Prohibited Items
      - Malicious software or ransomware
      - Stolen data or credentials
      - Nulled/Pirated scripts without proper licensing
      - Content that promotes illegal activities

      ## 2. Quality Standards
      All scripts and software must be functional. "Empty" listings or placeholder products will be removed.
    `
  },
  seller: {
    title: 'Seller Rules',
    icon: <Info className="text-pink-500" />,
    content: `
      ## 1. Transparency
      Sellers must provide accurate descriptions, clear demo links, and active support for their products.

      ## 2. Payouts
      Sellers can request withdrawals through the Worker Vault. Withdrawals are processed within 24-72 hours after verification.

      ## 3. Reputation
      Negative ratings repeatedly may lead to seller probation or account suspension.
    `
  },
  community: {
    title: 'Community Guidelines',
    icon: <Users className="text-yellow-500" />,
    content: `
      ## 1. Professionalism
      NEXUS is a professional marketplace. Harassment, hate speech, or abuse towards other users is strictly prohibited.

      ## 2. Anti-Spam
      Spamming the chat, job board, or reviews is not allowed.

      ## 3. Reporting
      Help keep the community safe by using the "Report" button on suspicious listings or profiles.
    `
  }
};

export default function LegalModal({ isOpen, onClose, initialPage = 'privacy' }: LegalModalProps) {
  const [activePage, setActivePage] = useState(initialPage);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-[#0a0a0a]/90 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-[#111111] w-full max-w-5xl h-[80vh] rounded-[2.5rem] border border-[#141414]/10 dark:border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden"
          >
            {/* Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#141414]/5 dark:border-white/5 bg-[#141414]/2 dark:bg-white/2 p-6 flex flex-col gap-2 overflow-y-auto">
              {Object.entries(LegalPages).map(([key, page]) => (
                <button
                  key={key}
                  onClick={() => setActivePage(key as any)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-medium ${
                    activePage === key
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'hover:bg-[#141414]/5 dark:hover:bg-white/5 text-[#141414]/60 dark:text-white/60'
                  }`}
                >
                  {React.cloneElement(page.icon as React.ReactElement, { size: 18, className: activePage === key ? 'text-white' : undefined })}
                  {page.title}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-[#141414]/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {LegalPages[activePage].icon}
                  <h2 className="text-xl font-bold font-sans">{LegalPages[activePage].title}</h2>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[#141414]/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 prose dark:prose-invert prose-sm max-w-none">
                 <div className="font-sans leading-relaxed text-[#141414]/80 dark:text-white/80 whitespace-pre-wrap">
                    {LegalPages[activePage].content.trim()}
                 </div>
                 
                 <div className="mt-12 pt-8 border-t border-[#141414]/5 dark:border-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#141414]/30 dark:text-white/30">
                       Last Updated: May 10, 2026 • NEXUS Protocol Compliance v2.0
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
