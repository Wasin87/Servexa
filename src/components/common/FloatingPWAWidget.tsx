import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../contexts/LanguageContext';

export const FloatingPWAWidget: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isBangla } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('servexa_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('servexa_pwa_dismissed', 'true');
  };

  // If already installed or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  // Show if installable via Chrome/Android or if iOS device
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 bg-zinc-950/90 dark:bg-zinc-900/95 text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl border border-orange-500/40 backdrop-blur-md transition-all duration-300 animate-bounce [animation-duration:3s]">
        <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-md">
          <Smartphone className="w-5 h-5" />
        </div>

        <div className="text-left pr-1">
          <p className="text-[11px] sm:text-xs font-bold leading-tight">
            {isBangla ? 'Servexa অ্যাপ ইনস্টল করুন' : 'Install Servexa App'}
          </p>
          <p className="text-[9px] sm:text-[10px] text-zinc-300 font-medium">
            {isBangla ? 'দ্রুত বুকিং ও ট্র্যাকিং' : 'Fast booking & live tracking'}
          </p>
        </div>

        {isInstallable ? (
          <button
            onClick={install}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-[11px] sm:text-xs shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBangla ? 'ডাউনলোড' : 'Download'}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="px-2.5 py-1 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 font-bold text-[11px] sm:text-xs transition-colors shrink-0"
          >
            {isBangla ? 'আইওএস সেটআপ' : 'iOS Setup'}
          </button>
        )}

        {/* Close/Dismiss Cross Button */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
          aria-label="Close download prompt"
          title={isBangla ? 'বন্ধ করুন' : 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iOS Modal Instructions */}
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
              <p>১. Safari ব্রাউজারের <strong>Share</strong> (শেয়ার) আইকনে ট্যাপ করুন।</p>
              <p>২. মেনুটি স্ক্রল করে <strong>Add to Home Screen</strong> এ ট্যাপ করুন।</p>
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
};
