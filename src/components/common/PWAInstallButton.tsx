import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../contexts/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isBangla } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide button if app is already running as standalone installed PWA
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        title={isBangla ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>{isBangla ? 'অ্যাপ ইনস্টল' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isBangla ? 'iOS এ ইনস্টল' : 'Install iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {isBangla ? 'iPhone/iPad এ অ্যাপ ইনস্টল করুন' : 'Install on iPhone / iPad'}
              </h3>
              
              <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed">
                <p>1. Safari ব্রাউজারের <strong>Share</strong> (শেয়ার) আইকনে ট্যাপ করুন।</p>
                <p>2. মেনুটি স্ক্রল করে <strong>Add to Home Screen</strong> এ ট্যাপ করুন।</p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-orange-500 text-white py-2 text-xs font-bold hover:bg-orange-600 transition"
              >
                {isBangla ? 'ঠিক আছে' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
