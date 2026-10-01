import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PhoneCall, Mail, MapPin, Heart } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useLanguage } from '../../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t, isBangla } = useLanguage();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="lg" showTagline={true} />
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
              {t.footer.about}
            </p>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-xl text-orange-900 dark:text-orange-200 text-xs font-semibold flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>{t.footer.emergencyHelp}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-3">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  {t.nav.services}
                </Link>
              </li>
              <li>
                <Link to="/professionals" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  {t.nav.findPros}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  {t.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link to="/emergency" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
                  {t.nav.emergency}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                  {t.nav.safety}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-3">
              {t.footer.services}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/services/electrical" className="hover:text-orange-600 transition-colors">
                  {isBangla ? 'বৈদ্যুতিক সার্ভিস' : 'Electrical'}
                </Link>
              </li>
              <li>
                <Link to="/services/plumbing" className="hover:text-orange-600 transition-colors">
                  {isBangla ? 'প্লাম্বিং ও পাইপ' : 'Plumbing'}
                </Link>
              </li>
              <li>
                <Link to="/services/ac_repair" className="hover:text-orange-600 transition-colors">
                  {isBangla ? 'এসি রিপেয়ার' : 'AC Repair'}
                </Link>
              </li>
              <li>
                <Link to="/services/painting" className="hover:text-orange-600 transition-colors">
                  {isBangla ? 'রং মিস্ত্রি' : 'Painting'}
                </Link>
              </li>
              <li>
                <Link to="/services/carpentry" className="hover:text-orange-600 transition-colors">
                  {isBangla ? 'কাঠ মিস্ত্রি' : 'Carpentry'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Safety */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-3">
              {t.footer.contact}
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-zinc-500">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{t.footer.address}</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <PhoneCall className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{t.footer.phone}</span>
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{t.footer.email}</span>
              </li>
              <li className="pt-2">
                <Link
                  to="/become-professional"
                  className="inline-block px-3 py-1.5 text-xs font-bold rounded-lg border border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  {t.nav.becomePro}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            {t.footer.copyright}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>১০০% বিশ্বস্ত ও ভেরিফায়েড</span>
            </span>
            <span>·</span>
            <span>ঢাকা, চট্টগ্রাম ও সিলেট</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
