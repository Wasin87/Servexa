import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const NotFoundPage: React.FC = () => {
  const { isBangla } = useLanguage();

  return (
    <div className="py-24 max-w-md mx-auto px-4 text-center space-y-4">
      <div className="text-6xl font-black text-orange-600">404</div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        {isBangla ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি' : 'Page Not Found'}
      </h1>
      <p className="text-xs text-zinc-500">
        {isBangla
          ? 'আপনি যে পেজটিতে যাওয়ার চেষ্টা করছেন তা পরিবর্তিত হয়েছে অথবা মুছে ফেলা হয়েছে।'
          : 'The page you are looking for does not exist or has been moved.'}
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
        >
          <Home className="w-4 h-4" />
          <span>{isBangla ? 'হোমপেজে ফিরে যান' : 'Back to Home'}</span>
        </Link>
      </div>
    </div>
  );
};
