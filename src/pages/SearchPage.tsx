import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, MapPin, Star, ArrowRight, Wrench } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { diagnoseProblemWithRules } from '../services/problemDiagnosis';

export const SearchPage: React.FC = () => {
  const { categories, technicians } = useApp();
  const { t, isBangla } = useLanguage();
  const [query, setQuery] = useState('');

  const diagnosis = query.trim().length > 3 ? diagnoseProblemWithRules(query, categories) : null;

  const matchedTechs = technicians.filter(
    (tech) =>
      tech.name.toLowerCase().includes(query.toLowerCase()) ||
      tech.primaryArea.toLowerCase().includes(query.toLowerCase()) ||
      tech.serviceAreas.some(a => a.toLowerCase().includes(query.toLowerCase())) ||
      tech.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
  );

  const matchedCategories = categories.filter(
    (c) =>
      c.nameEn.toLowerCase().includes(query.toLowerCase()) ||
      c.nameBn.includes(query) ||
      c.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'গ্লোবাল সার্চ ও স্মার্ট অ্যাসিস্ট্যান্ট' : 'Global Search & Smart Assistant'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500">
          {isBangla ? 'সার্ভিস, এলাকার নাম, বা আপনার সমস্যার কথা বাংলায় বা ইংরেজিতে লিখুন' : 'Search by problem, service name, technician or Dhaka neighborhood'}
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search.searchPlaceholder}
          className="w-full pl-12 pr-4 py-3.5 text-sm rounded-2xl border-2 border-orange-500/40 focus:border-orange-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md focus:outline-none"
        />
      </div>

      {/* Quick Search Tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-zinc-400">জনপ্রিয় খোঁজ:</span>
        {['মিরপুর ইলেকট্রিশিয়ান', 'পানির পাইপ লিক', 'এসি গ্যাস রিফিল', 'তালা আটকে গেছে', 'ধানমন্ডি প্লাম্বার'].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setQuery(tag)}
            className="px-3 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-orange-500 border border-transparent transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Natural Language Diagnosis Card */}
      {diagnosis && (
        <div className="p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Sparkles className="w-4 h-4" />
              <span>শনাক্তকৃত সমাধান: {diagnosis.categoryNameBn} ({diagnosis.confidence}% ম্যাচ)</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {diagnosis.reasoningBn}
            </p>
          </div>
          <Link
            to={`/book?categoryId=${diagnosis.categoryId}&desc=${encodeURIComponent(query)}`}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shrink-0 text-center"
          >
            সরাসরি বুকিং শুরু করুন
          </Link>
        </div>
      )}

      {/* Matched Categories */}
      {matchedCategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            মিলে যাওয়া সার্ভিস ({matchedCategories.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {matchedCategories.map((c) => (
              <Link
                key={c.id}
                to={`/professionals?category=${c.id}`}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {isBangla ? c.nameBn : c.nameEn}
                  </div>
                  <div className="text-[10px] text-zinc-400">৳{c.startingPrice} থেকে</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Matched Technicians */}
      {matchedTechs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            উপযুক্ত টেকনিশিয়ান ({matchedTechs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {matchedTechs.map((tech) => (
              <div
                key={tech.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="w-12 h-12 rounded-xl object-cover border border-orange-500"
                  />
                  <div>
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {tech.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{tech.rating}</span>
                      <span className="text-zinc-400 font-normal">({tech.completedJobs} কাজ)</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{tech.primaryArea}, ঢাকা</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/book?techId=${tech.id}`}
                  className="w-full py-2 text-center text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                >
                  {t.actions.bookNow}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
