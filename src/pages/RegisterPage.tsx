import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { registerNewTechnician } = useApp();
  const { isBangla } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.trim().length < 6) {
      setErrorMsg(isBangla ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const res = await register({ name, email, phone, password, role });
    if (!res.success || !res.user) {
      setErrorMsg(res.error || (isBangla ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।' : 'Registration failed.'));
      setIsSubmitting(false);
      return;
    }

    if (role === 'TECHNICIAN') {
      registerNewTechnician(res.user, res.serverTechnicianId);
      setIsSubmitting(false);
      navigate('/technician/dashboard?tab=profile&onboarding=1');
    } else {
      setIsSubmitting(false);
      navigate('/customer/dashboard?tab=profile&onboarding=1');
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Logo size="lg" className="justify-center" />
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white pt-2">
            {isBangla ? 'নতুন Servexa একাউন্ট খুলুন' : 'Create an Account'}
          </h1>
          <p className="text-xs text-zinc-500">
            {isBangla ? 'সারা বাংলাদেশ থেকে সহজেই যোগ দিন' : 'Join from anywhere in Bangladesh'}
          </p>
        </div>

        {/* Role Segmented Switch */}
        <div className="flex p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              role === 'CUSTOMER'
                ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            👤 {isBangla ? 'গ্রাহক (Customer)' : 'Customer'}
          </button>
          <button
            type="button"
            onClick={() => setRole('TECHNICIAN')}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              role === 'TECHNICIAN'
                ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-xs font-bold'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            👷 {isBangla ? 'মিস্ত্রি (Technician)' : 'Technician'}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isBangla ? 'আপনার নাম' : 'Full Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isBangla ? 'যেমন: সাকিব হাসান' : 'e.g. Sakib Hasan'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isBangla ? 'ইমেইল' : 'Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isBangla ? 'মোবাইল নম্বর' : 'Phone Number'}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isBangla ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isBangla ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন' : 'At least 6 characters'}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {role === 'TECHNICIAN' ? (
            <div className="p-3 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 text-[11px] text-orange-900 dark:text-orange-200 flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <span>
                {isBangla
                  ? 'রেজিস্ট্রেশনের পর সরাসরি ড্যাশবোর্ডে গিয়ে আপনার সম্পূর্ণ বায়োডাটা ও NID ছবি (সামনে ও পেছনে) আপলোড করুন। অ্যাডমিন "দক্ষতা উত্তীর্ণ" অনুমোদন দিলে কাজ শুরু করতে পারবেন।'
                  : 'After signup, complete 100% of your biodata and upload NID front/back photos on your dashboard for Admin skill-test approval.'}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                {isBangla
                  ? 'রেজিস্ট্রেশনের পর আপনার বিভাগ, জেলা, এলাকা ও বিস্তারিত ঠিকানা দিয়ে প্রোফাইল ১০০% সম্পূর্ণ করে মিস্ত্রি বুক করতে পারবেন।'
                  : 'After signup, complete 100% of your profile and Bangladesh address on your dashboard to book verified professionals.'}
              </span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>
                {isSubmitting
                  ? (isBangla ? 'একাউন্ট তৈরি হচ্ছে...' : 'Creating account...')
                  : (isBangla ? 'রেজিস্ট্রেশন সম্পন্ন করুন' : 'Complete Registration')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>{isBangla ? 'ইতিমধ্যে একাউন্ট আছে? ' : 'Already have an account? '}</span>
          <Link to="/login" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            {isBangla ? 'লগইন করুন' : 'Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};
