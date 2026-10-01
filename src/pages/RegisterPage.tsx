import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { isBangla } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [city, setCity] = useState('Dhaka');
  const [area, setArea] = useState('Dhanmondi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await register({ name, email, phone, role, city, area });
    setIsSubmitting(false);
    if (role === 'TECHNICIAN') navigate('/technician/dashboard');
    else navigate('/customer/dashboard');
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
            {isBangla ? 'সহজেই যোগ দিন ও দ্রুত সার্ভিস গ্রহণ করুন' : 'Join as customer or skilled professional'}
          </p>
        </div>

        {/* Role Segmented Switch */}
        <div className="flex p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              role === 'CUSTOMER'
                ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            👤 গ্রাহক (Customer)
          </button>
          <button
            type="button"
            onClick={() => setRole('TECHNICIAN')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              role === 'TECHNICIAN'
                ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            👷 মিস্ত্রি (Technician)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              আপনার নাম
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: সাকিব হাসান"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              ইমেইল
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              মোবাইল নম্বর
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              এলাকা (Dhaka Area)
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
            >
              <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
              <option value="Mirpur">মিরপুর (Mirpur)</option>
              <option value="Uttara">উত্তরা (Uttara)</option>
              <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
              <option value="Gulshan">গুলশান (Gulshan)</option>
              <option value="Farmgate">ফার্মগেট (Farmgate)</option>
              <option value="Badda">বাড্ডা (Badda)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'একাউন্ট তৈরি হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>ইতিমধ্যে একাউন্ট আছে? </span>
          <Link to="/login" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
            লগইন করুন
          </Link>
        </div>
      </div>
    </div>
  );
};
