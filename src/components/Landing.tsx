import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Zap, Shield, Globe, Cpu, ArrowUpRight, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { FloatingBackground, ZeroGravityWrapper, FloatIn, BackgroundVideo } from './AntiGravity';
import Typewriter from './Typewriter';
import { NeuronBackground } from './NeuronBackground';
import LegalModal from './LegalModal';
import { Helmet } from 'react-helmet-async';

export default function Landing({ onAuth }: { onAuth: () => void }) {
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | 'refund' | 'rules' | 'seller' | 'community'>('privacy');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yDrift = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const rotateDrift = useTransform(scrollYProgress, [0, 1], [0, 15]);

  return (
    <div ref={containerRef} id="landing-root" className="min-h-screen bg-[#000000] text-white font-sans selection:bg-white selection:text-black relative overflow-hidden transition-colors duration-500">
      <Helmet>
        <title>NEXUS - Elite Digital Asset Marketplace & Freelance Hiring</title>
        <meta name="description" content="NEXUS: Built for scaling startups. Buy premium digital assets, software, SaaS, Python scripts, LLM AI models. Find work or hire top freelance developers, logo designers, programmers." />
        <meta name="keywords" content="hiring, free job programmer, find freelancer job, find programmer hiring, job logo designer, find work, free louncer, freelancer, logo, program, photo editing, video editing, viras tools, python, llm, ai models, scripts, source code, remote jobs, software marketplace" />
      </Helmet>
      <div className="neon-fog opacity-30" />
      <FloatingBackground />
      <BackgroundVideo />

      {/* Decorative Parallax Elements */}
      <motion.div 
        style={{ y: yDrift, rotate: rotateDrift }}
        className="absolute top-[20%] right-[10%] w-64 h-64 border border-dashed border-white/10 rounded-full pointer-events-none opacity-50 z-0 hidden lg:block"
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 300]), rotate: useTransform(scrollYProgress, [0, 1], [0, -20]) }}
        className="absolute top-[60%] left-[5%] w-96 h-96 border border-white/5 rounded-[3rem] pointer-events-none opacity-30 z-0 hidden lg:block"
      />
      
      {/* Navigation */}
      <nav id="nav" className="flex items-center justify-between px-8 py-6 border-b border-white/5 sticky top-0 bg-[#000000]/80 backdrop-blur-xl z-50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
          <span className="font-medium tracking-tighter text-lg uppercase">Nexus Market</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[10px] font-medium uppercase tracking-[0.2em] opacity-60">
          <a href="#explore" className="hover:opacity-100 transition-opacity">Explore</a>
          <a href="#buy" className="hover:opacity-100 transition-opacity">Buy</a>
          <a href="#sell" className="hover:opacity-100 transition-opacity">Sell</a>
          <a href="#vault" className="hover:opacity-100 transition-opacity">Vault</a>
          <a href="#hiring" className="hover:opacity-100 transition-opacity">Careers</a>
        </div>

        <button 
          onClick={onAuth}
          className="px-6 py-2 bg-white text-black rounded-full text-xs font-semibold uppercase tracking-widest hover:opacity-90 hover:scale-105 transition-all active:scale-[0.98]"
        >
          Access Portal
        </button>
      </nav>

      {/* Hero Section - Elite Premium Feel */}
      <section id="hero" className="relative min-h-screen border-b border-white/10 z-10 flex flex-col pt-20 bg-[#000000] overflow-hidden">
        <NeuronBackground />
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-white/5 rounded-full blur-[100px] opacity-50 mix-blend-screen animate-pulse duration-[10s]" />
        </div>

        <div className="flex-1 px-8 md:px-20 py-20 flex flex-col justify-center relative z-10">
          <ZeroGravityWrapper className="space-y-12">
            <div className="space-y-8 max-w-6xl text-center mx-auto">
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-medium font-sans tracking-tight pb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 leading-[0.9]">
                <Typewriter text="Google Anti-Gravity." speed={50} delay={300} />
              </h1>
              <p className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-[#86868b] max-w-4xl mx-auto leading-snug">
                The world's most advanced peer-to-peer asset exchange.<br />
                <span className="text-white">Zero restrictions. Pure freedom.</span>
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-center gap-8 pt-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-6"
              >
                <button 
                  onClick={onAuth}
                  className="px-8 py-4 rounded-full bg-white text-black flex items-center justify-center text-lg font-medium hover:scale-105 transition-all duration-500 group shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
                >
                  <span className="z-10">Start Exploring</span>
                  <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-6"
              >
                <div className="px-8 py-4 rounded-full backdrop-blur-xl bg-white/5 border border-white/10 text-white/90 font-light text-lg">
                     No subscriptions. <span className="font-medium text-white">Pay once.</span>
                </div>
              </motion.div>
            </div>
          </ZeroGravityWrapper>
        </div>

        {/* Feature Rail - Recipe 5/11 style */}
        <div className="border-t border-white/10 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 relative z-20 transition-colors">
          <HeroMetric label="Live Volume" value="1.4B+" subtext="USD Equivalent" />
          <HeroMetric label="Nodes" value="14,209" subtext="Secure Merchants" />
          <HeroMetric label="Uptime" value="99.98%" subtext="Network Stability" />
          <HeroMetric label="Avg Delivery" value="0.14s" subtext="Atomic Dispatch" />
        </div>
      </section>

      {/* Explore Products Section - Apple/Premium Style */}
      <section id="explore" className="relative py-32 lg:py-48 px-8 md:px-20 bg-[#000000] text-white overflow-hidden z-10 transition-colors">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-white/5 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto space-y-32">
          <div className="space-y-8 max-w-4xl">
             <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-[0.3em] backdrop-blur-md"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
               New Releases: V4.0 Logic Bricks
             </motion.div>
             <motion.h2 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="text-[12vw] lg:text-[8vw] font-black tracking-[-0.05em] leading-[0.85] uppercase transition-colors"
             >
               Explore <br />
               Synthetics.
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               transition={{ delay: 0.3 }}
               className="text-xl lg:text-3xl text-white/50 max-w-2xl leading-tight font-sans tracking-tight"
             >
               A curated collection of the world's most advanced digital artifacts. Engineered for performance, designed for the elite.
             </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
            <ProductCard 
              title="Neural Engine X" 
              category="AI // WEIGHTS" 
              price="4.2 ETH" 
              accent="blue"
              desc="High-density synaptic weights for real-time inference." 
            />
            <ProductCard 
              title="Aegis Payload" 
              category="SECURITY // KERNEL" 
              price="1.8 ETH" 
              accent="green"
              desc="Military-grade encryption module for secure data dispatch." 
            />
            <div className="md:col-span-2">
              <ProductCard 
                title="Atlas Web Framework" 
                category="WEB // CORE" 
                price="0.9 ETH" 
                accent="purple"
                featured
                desc="The most performant React boilerplate ever constructed. 0.02s initial TTI." 
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-12 py-20 border-y border-white/10">
             <div className="text-center space-y-4">
                <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.5em]">The Catalog Overflow</p>
                <h3 className="text-5xl lg:text-7xl font-sans font-medium tracking-tighter uppercase italic">Everything <br /> You Need.</h3>
             </div>
             <button 
               onClick={onAuth}
               className="group relative px-12 py-6 overflow-hidden rounded-full border border-white transition-all hover:bg-white hover:text-black"
             >
                <span className="relative z-10 text-xs font-bold uppercase tracking-[0.4em]">Explore All 12k+ Assets</span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
             </button>
          </div>
        </div>
      </section>

      {/* Buying Section - Marketplace Hub */}
      <section id="buy" className="px-8 py-20 lg:py-40 bg-[#000000] border-b border-[#ffffff]/10 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-[0.4em] font-bold">Acquisition Portal</span>
              <h2 className="text-6xl font-medium tracking-tighter uppercase leading-none transition-colors italic">Premium <br /> Assets.</h2>
            </div>
            <p className="text-xl text-white/60 max-w-sm">Browse 12,000+ verified digital assets. One-click licensing and instant neural linking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Nexus Core OS', price: '$2,400', tag: 'OS_KERNEL', seller: 'System_V' },
              { name: 'Grip-AV Advanced', price: '$850', tag: 'SECURITY', seller: 'Aegis_Lab' },
              { name: 'Neural-Sync-6', price: '$4,100', tag: 'AI_MODEL', seller: 'DeepMind_X' }
            ].map((p, idx) => (
              <div key={idx} className="p-8 border border-white/10 rounded-2xl space-y-6 hover:bg-white/5 text-white transition-all group overflow-hidden relative cursor-pointer" onClick={onAuth}>
                <div className="flex justify-between items-start">
                   <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">{p.tag}</span>
                   <ArrowUpRight className="opacity-0 group-hover:opacity-40 transition-opacity" />
                </div>
                <h3 className="text-3xl font-medium font-sans uppercase tracking-tighter">{p.name}</h3>
                <div className="flex justify-between items-end pt-4">
                  <span className="text-2xl font-bold">{p.price}</span>
                  <button className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">Acquire</button>
                </div>
                <div className="absolute -bottom-4 -right-4 text-[80px] font-medium opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none uppercase">{idx + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selling Section - Distribution Platform */}
      <section id="sell" className="px-8 py-20 lg:py-40 bg-[#000000] text-white relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
           <div className="grid grid-cols-12 h-full">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="border-r border-white/5" />)}
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 relative">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.4em] font-bold">Distribution Network</span>
              <h2 className="text-7xl font-medium font-sans tracking-tighter uppercase leading-[0.85]">Join the <br /> Merchants.</h2>
            </div>
            <p className="text-2xl text-white/40 max-w-lg font-light">Monetize your code, models, and digital templates. Access 1M+ active traders globally with 0.1s transaction finality.</p>
            
            <div className="space-y-6">
              <FeatureItem icon={<Shield size={20} />} title="Encrypted Vaults" desc="All assets are SHA-512 hashed and locked in cold storage until transaction verification." />
              <FeatureItem icon={<TrendingUp size={20} />} title="Global Scaling" desc="Automated distribution across 40+ edge nodes for instant worldwide delivery." />
            </div>

            <button onClick={onAuth} className="px-10 py-6 bg-white text-[#000000] rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
               Start Selling Now
            </button>
          </div>

          <div className="relative">
             <div className="aspect-square border border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                <div className="w-[80%] h-[80%] border border-dashed border-white/30 rounded-full" />
             </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                   <p className="text-6xl font-medium font-sans tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">0%</p>
                   <p className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-40">Portal Fees</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* The Vault Section - Security & Integrity */}
      <section id="vault" className="relative py-32 lg:py-48 px-8 md:px-20 bg-[#000000] border-y border-[#ffffff]/10 z-10 overflow-hidden transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-[0.4em] font-bold"
              >
                Security // Protocol 01
              </motion.div>
              <h2 className="text-7xl lg:text-9xl font-black tracking-[-0.06em] uppercase leading-[0.8] transition-colors">
                The <br /> Vault.
              </h2>
            </div>
            
            <p className="text-2xl text-white/40 max-w-lg leading-snug font-light">
              Your assets are protected by Nexus Sentinel. Multi-sig authentication, cold-storage rotation, and real-time shard encryption.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8">
               <div className="space-y-2">
                 <p className="text-4xl font-bold tracking-tighter">99.9%</p>
                 <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Security Integrity</p>
               </div>
               <div className="space-y-2">
                 <p className="text-4xl font-bold tracking-tighter">0.0ns</p>
                 <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Latent Vulnerability</p>
               </div>
            </div>
          </div>

          <div className="relative aspect-square">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border border-dashed border-white/10 rounded-full"
             />
             <div className="absolute inset-[15%] border border-white/20 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-3xl shadow-[0_0_80px_rgba(255,255,255,0.05)]">
                <Shield size={120} strokeWidth={0.5} className="text-blue-500 animate-pulse" />
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rotate-45" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent -rotate-45" />
          </div>
        </div>
      </section>

      {/* Hiring Section - Careers */}
      <section id="hiring" className="px-8 py-20 lg:py-40 bg-[#000000] text-white relative z-10 transition-colors overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 border-b border-white/10 pb-20">
             <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.4em] font-bold">Human Resources // Careers</span>
             <h2 className="text-8xl font-medium font-sans tracking-tighter uppercase">Expand our <br /> Intelligence.</h2>
             <p className="text-xl text-white/40 max-w-2xl mx-auto mt-8 font-sans font-light">We are looking for exceptional engineers, architects, and designers to build the future of digital commerce.</p>
          </div>

          <div className="space-y-4">
             {[
               { title: 'Neural Systems Architect', dept: 'Engineering', loc: 'Remote // Node_4', type: 'Full-time' },
               { title: 'Protocol Security Lead', dept: 'Security', loc: 'Zurich // Node_1', type: 'Contract' },
               { title: 'Frontend Interface Designer', dept: 'Creative', loc: 'Remote // Node_9', type: 'Full-time' }
             ].map((job, i) => (
                <div key={i} className="group p-8 border border-white/5 rounded-2xl hover:bg-white/5 flex flex-col md:flex-row justify-between items-center gap-8 cursor-pointer transition-all">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <span className="text-[10px] font-mono opacity-20 group-hover:opacity-100 transition-opacity uppercase tracking-widest">0{i+1} /</span>
                    <div className="space-y-1 text-center md:text-left">
                       <h4 className="text-3xl font-medium font-sans uppercase tracking-tighter">{job.title}</h4>
                       <div className="flex gap-4 text-[9px] font-mono uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                         <span>{job.dept}</span>
                         <span className="text-white">{job.loc}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="px-3 py-1 border border-current rounded-full text-[9px] font-mono uppercase tracking-widest opacity-40">{job.type}</span>
                    <button onClick={onAuth} className="w-12 h-12 rounded-full bg-white text-[#000000] flex items-center justify-center hover:scale-105 transition-transform">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
             ))}
          </div>

          <div className="pt-20 text-center">
             <button className="text-[10px] font-bold uppercase tracking-[0.4em] underline underline-offset-8 decoration-white/20 hover:decoration-white transition-all opacity-40 hover:opacity-100">
               View All 24 Open Positions
             </button>
          </div>
        </div>
      </section>

      {/* Grid Categories Section */}
      <section className="bg-[#000000] text-white border-b border-white/10 relative z-10 transition-colors">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-white/10">
            {[
              { name: 'Neural Models', icon: <Cpu />, desc: 'Pre-trained weights and architectural blueprints.' },
              { name: 'Software Suites', icon: <Zap />, desc: 'Enterprise binary tools and automation frameworks.' },
              { name: 'Linux Kernels', icon: <Globe />, desc: 'Custom optimized distributions for node operations.' },
              { name: 'Security Payloads', icon: <Shield />, desc: 'Advanced defensive scripts and auditing kits.' },
              { name: 'Web Architectures', icon: <ArrowUpRight />, desc: 'High-conversion frontend and backend templates.' },
              { name: 'Financial Logic', icon: <Wallet />, desc: 'Smart contracts and quantitative trading assets.' }
            ].map((c, idx) => (
              <div 
                key={c.name}
                className="group p-12 space-y-6 hover:bg-white/5 transition-all duration-500 cursor-pointer"
                onClick={onAuth}
              >
                <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                  {c.icon}
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-medium font-sans uppercase tracking-tighter">{c.name}</h3>
                   <p className="text-xs font-mono opacity-60 group-hover:opacity-100 uppercase tracking-widest font-light">{c.desc}</p>
                </div>
              </div>
            ))}
         </div>
      </section>

      {/* Feature Section */}
      <section id="assets" className="px-8 py-20 lg:py-40 max-w-7xl mx-auto space-y-20 relative z-10 bg-[#000000] text-white">
         <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <h2 className="text-6xl font-medium font-sans tracking-tighter uppercase leading-none transition-colors">Architected for <br /> Secure Commerce.</h2>
            <p className="text-xl text-white/60 max-w-sm font-light">Enterprise-grade infrastructure for buying and selling digital intellectual property.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-20">
            <FeatureItem 
              icon={<TrendingUp className="w-6 h-6" />}
              title="Verified Merchants"
              desc="Every seller undergoes KYC and technical review before their products hit the exchange."
            />
             <FeatureItem 
              icon={<Shield className="w-6 h-6" />}
              title="Automated Dispatch"
              desc="Digital products are automatically hashed and delivered to your inbox upon confirmed payment."
            />
             <FeatureItem 
              icon={<ShoppingCart className="w-6 h-6" />}
              title="Escrow Protected"
              desc="Funds are held in high-security vaults until both parties confirm cargo delivery."
            />
         </div>
      </section>

      <footer className="border-t border-white/5 bg-[#000000] text-white px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-white" />
          <span className="font-semibold tracking-tighter text-sm uppercase">Nexus Market</span>
        </div>
        <div className="flex gap-8 text-[10px] font-semibold uppercase tracking-widest opacity-40">
           <button onClick={() => { setLegalPage('terms'); setIsLegalOpen(true); }} className="hover:text-white transition-colors">Terms</button>
           <button onClick={() => { setLegalPage('privacy'); setIsLegalOpen(true); }} className="hover:text-white transition-colors">Privacy</button>
           <button onClick={() => { setLegalPage('refund'); setIsLegalOpen(true); }} className="hover:text-white transition-colors">Refunds</button>
           <button onClick={() => { setLegalPage('community'); setIsLegalOpen(true); }} className="hover:text-white transition-colors">Compliance</button>
        </div>
        <div className="text-[10px] font-mono opacity-40 uppercase">© 2026 NEXUS EXCHANGE TECHNOLOGIES</div>
      </footer>

      <LegalModal 
        isOpen={isLegalOpen} 
        onClose={() => setIsLegalOpen(false)} 
        initialPage={legalPage} 
      />
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-6 group cursor-pointer">
      <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-medium tracking-tight flex items-center gap-2 transition-colors">
          {title} <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-white/60 leading-relaxed font-light transition-colors">{desc}</p>
      </div>
    </div>
  )
}

function ProductCard({ title, category, price, desc, accent, featured = false }: { title: string, category: string, price: string, desc: string, accent: string, featured?: boolean }) {
  const getAccentColor = (a: string) => {
    switch(a) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-[#34D399]';
      case 'purple': return 'bg-[#A78BFA]';
      default: return 'bg-white';
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative rounded-[40px] p-8 md:p-12 overflow-hidden flex flex-col justify-between group cursor-pointer transition-all duration-700",
        featured ? "h-[600px] bg-gradient-to-br from-zinc-900 to-black border border-white/5" : "h-[500px] bg-zinc-900/50 border border-white/5"
      )}
    >
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2">
           <div className={cn("w-1.5 h-1.5 rounded-full", getAccentColor(accent))} />
           <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{category}</span>
        </div>
        <h3 className={cn("font-medium font-sans tracking-tighter uppercase transition-all duration-500", featured ? "text-5xl md:text-7xl group-hover:tracking-normal" : "text-4xl md:text-5xl group-hover:tracking-wider")}>{title}</h3>
        <p className="text-white/40 max-w-sm text-sm lg:text-lg font-sans tracking-wide font-light">{desc}</p>
      </div>

      <div className="flex items-end justify-between relative z-10">
        <div className="space-y-1">
           <p className="text-[10px] font-mono opacity-20 uppercase tracking-widest">Entry Price</p>
           <p className="text-3xl font-medium font-sans">{price}</p>
        </div>
        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.0)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
           <ArrowRight size={24} />
        </div>
      </div>

      {/* Futuristic "Stick" visual or accent glow */}
      <div className={cn(
        "absolute top-0 right-0 w-1 h-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity",
        getAccentColor(accent)
      )} />
      <div className={cn(
        "absolute -bottom-20 -right-20 w-64 h-64 blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000",
        getAccentColor(accent)
      )} />
    </motion.div>
  )
}

function HeroMetric({ label, value, subtext }: { label: string, value: string, subtext: string }) {
  return (
    <div className="p-8 md:p-12 space-y-4 group cursor-crosshair">
      <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] font-bold group-hover:text-white transition-colors">{label}</p>
      <div className="space-y-1">
        <h4 className="text-4xl md:text-5xl font-medium font-sans tracking-tighter uppercase leading-none">{value}</h4>
        <p className="text-[9px] font-mono opacity-20 uppercase tracking-widest">{subtext}</p>
      </div>
    </div>
  )
}
