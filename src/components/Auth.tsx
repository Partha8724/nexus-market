import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../services/api';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Github, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { FloatingBackground, ZeroGravityWrapper, BackgroundVideo } from './AntiGravity';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize profile
        if (credential.user) {
          await api.profiles.update({
            username: email.split('@')[0],
            avatar_url: '',
            role: 'buyer'
          });
        }
        setMessage('Network node registered successfully.');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials or authentication method. Note: If you are using email/password, ensure it is enabled in the Firebase Console.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Authentication method not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Authentication window closed before completion.');
      } else if (err.message?.includes('third-party cookies')) {
        setError('Authentication failed: Browsers often block third-party cookies needed for Firebase Auth. Please enable them or use an Incognito window.');
      } else {
        setError(err.message || 'An unexpected error occurred during link initiation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please provide an identifier (email) to initiate recovery.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Recovery protocol initiated. Check your encrypted mail.');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate recovery link.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      // Initialize profile
      if (credential.user) {
        await api.profiles.update({
          username: credential.user.displayName || credential.user.email?.split('@')[0] || 'User',
          avatar_url: credential.user.photoURL || '',
          role: 'buyer'
        });
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials or authentication configuration. Check if Google Sign-In is enabled in Firebase Console.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google login popup was blocked. Please enable popups.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Google login window closed by user.');
      } else if (err.message?.includes('third-party cookies')) {
        setError('Authentication failed: Browsers often block third-party cookies needed for Firebase Auth. Please enable them or use an Incognito window.');
      } else {
        setError(err.message || 'Failed to establish Google link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-white relative overflow-hidden transition-colors duration-500">
      <FloatingBackground />
      <BackgroundVideo />
      {/* Visual Side - Recipe 11 style */}
      <div id="auth-visual" className="hidden lg:flex flex-col justify-between p-12 bg-[#0a0a0a] dark:bg-black text-[#f5f5f4] relative overflow-hidden z-10 transition-colors">
        <div id="auth-logo" className="z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
          </div>
          <span className="font-sans font-semibold tracking-tight text-xl uppercase italic underline underline-offset-4 decoration-white/20">Nexus Exchange</span>
        </div>

        <div id="auth-hero-text" className="z-10">
          <ZeroGravityWrapper>
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-7xl xl:text-8xl font-sans font-semibold leading-[0.88] tracking-[-0.04em] mb-8"
            >
              THE FUTURE <br />
              OF FOCUS.
            </motion.h1>
          </ZeroGravityWrapper>
          <p className="text-white/60 font-sans max-w-md text-lg">
            Join the elite circle of creators using Nexus to orchestrate their digital presence with surgical precision.
          </p>
        </div>

        <div id="auth-footer" className="z-10 flex justify-between items-end">
          <div className="writing-mode-vertical rotate-180 text-[10px] uppercase tracking-[0.2em] opacity-40">
            EST. 2026 / NEXUS CORE
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-40">
            SECURED BY FIREBASE
          </div>
        </div>

        {/* Ambient background elements */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-[80px]" />
      </div>

      {/* Form Side */}
      <div id="auth-form-side" className="flex items-center justify-center p-6 sm:p-12 md:p-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-5xl font-sans font-bold tracking-tighter text-[#0a0a0a] dark:text-white uppercase transition-colors">
              {isLogin ? 'Access Portal' : 'New Identity'}
            </h2>
            <p className="text-[#0a0a0a]/60 dark:text-white/60 font-mono text-xs uppercase tracking-widest transition-colors italic leading-relaxed">
              {isLogin ? "Authenticate to initiate secure session" : "Register new merchant node in network"}
            </p>
          </div>

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-[#0a0a0a]/30 dark:text-white/30 group-focus-within:text-[#0a0a0a] dark:group-focus-within:text-white transition-colors" />
                <input
                  id="email"
                  type="email"
                  placeholder="IDENTIFIER (@EMAIL)"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-transparent border border-[#0a0a0a]/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-[#0a0a0a] dark:focus:border-white transition-all font-mono text-xs uppercase tracking-widest"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-[#0a0a0a]/30 dark:text-white/30 group-focus-within:text-[#0a0a0a] dark:group-focus-within:text-white transition-colors" />
                <input
                  id="password"
                  type="password"
                  placeholder="SECURITY_HASH (PASSWORD)"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-transparent border border-[#0a0a0a]/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-[#0a0a0a] dark:focus:border-white transition-all font-mono text-xs uppercase tracking-widest"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-mono text-[#0a0a0a]/40 dark:text-white/40 hover:text-[#0a0a0a] dark:hover:text-white transition-colors uppercase tracking-widest"
                >
                  Forgot Security Hash?
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-mono uppercase tracking-widest border border-red-500/20 italic">
                ERROR: {error}
              </div>
            )}

            {message && (
              <div className="p-4 rounded-xl bg-green-500/10 text-green-500 text-[10px] font-mono uppercase tracking-widest border border-green-500/20 italic">
                MSG: {message}
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a] rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Initiate Link' : 'Establish Link'}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#0a0a0a]/10 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-[0.3em]">
              <span className="bg-white dark:bg-[#0a0a0a] px-6 text-[#0a0a0a]/30 dark:text-white/30 transition-colors uppercase">Network Bridge</span>
            </div>
          </div>

          <div id="oauth-buttons" className="grid grid-cols-2 gap-4 transition-colors">
            <button
              id="github-login"
              onClick={() => setError('GitHub Login not configured in this protocol.')}
              className="flex items-center justify-center gap-3 py-4 bg-transparent border border-[#0a0a0a]/10 dark:border-white/10 rounded-2xl hover:bg-[#0a0a0a]/5 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              <Github className="h-4 w-4" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">GitHub</span>
            </button>
            <button
              id="google-login"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 py-4 bg-transparent border border-[#0a0a0a]/10 dark:border-white/10 rounded-2xl hover:bg-[#0a0a0a]/5 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
              </svg>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Google</span>
            </button>
          </div>

          <div className="text-center font-mono text-[10px] uppercase tracking-widest text-[#0a0a0a]/40 dark:text-white/40 transition-colors">
            {isLogin ? "Neural node unrecognized?" : "Already part of the network?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#0a0a0a] dark:text-white font-bold underline underline-offset-4 decoration-[#0a0a0a]/20 dark:decoration-white/20 hover:decoration-[#0a0a0a] dark:hover:decoration-white transition-all uppercase"
            >
              {isLogin ? 'Request Access' : 'Authenticate'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
