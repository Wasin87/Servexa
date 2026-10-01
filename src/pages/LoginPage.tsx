import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShieldCheck, UserCheck, Wrench, Lock, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
    navigate('/');
  };

  const handleDemoClick = (role: UserRole) => {
    quickDemoLogin(role);
    if (role === 'TECHNICIAN') navigate('/technician/dashboard');
    else if (role === 'ADMIN') navigate('/admin/dashboard');
    else navigate('/customer/dashboard');
  };

  return (
    <div className="py-12 max-w-md mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Logo size="lg" className="justify-center" />
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white pt-2">
            {isBangla ? 'Servexa একাউন্টে লগইন করুন' : 'Sign in to Servexa'}
          </h1>
          <p className="text-xs text-zinc-500">
            {isBangla ? 'আপনার একাউন্টে প্রবেশ করে বুকিং নিয়ন্ত্রণ করুন' : 'Enter your credentials to access your dashboard'}
          </p>
        </div>

        {/* Quick 1-Click Demo Login Selector */}
        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-2.5">
          <div className="text-[11px] font-bold text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-orange-600" />
            <span>{isBangla ? 'ডেমো অ্যাকাউন্ট দ্রুত লগইন (১-ক্লিক)' : 'One-Click Demo Access'}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoClick('CUSTOMER')}
              className="py-2 px-2 rounded-xl bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 text-zinc-800 dark:text-zinc-200 font-semibold text-center transition-colors shadow-2xs"
            >
              👤 গ্রাহক
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('TECHNICIAN')}
              className="py-2 px-2 rounded-xl bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 text-zinc-800 dark:text-zinc-200 font-semibold text-center transition-colors shadow-2xs"
            >
              👷 মিস্ত্রি
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('ADMIN')}
              className="py-2 px-2 rounded-xl bg-white dark:bg-zinc-800 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 text-zinc-800 dark:text-zinc-200 font-semibold text-center transition-colors shadow-2xs"
            >
              👨‍💼 অ্যাডমিন
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              ইমেইল বা ফোন নম্বর
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@servexa.demo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              পাসওয়ার্ড
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>{isSubmitting ? 'লগইন হচ্ছে...' : 'লগইন করুন'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>নতুন গ্রাহক? </span>
          <Link to="/register" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            নতুন একাউন্ট খুলুন
          </Link>
        </div>
      </div>
    </div>
  );
};
