import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ShieldCheck, CheckCircle2, ArrowRight, DollarSign, Users, Award } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const BecomeProfessionalPage: React.FC = () => {
  const { categories } = useApp();
  const { isBangla } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['electrical']);
  const [city, setCity] = useState('Dhaka');
  const [area, setArea] = useState('Mirpur');
  const [experienceYears, setExperienceYears] = useState('5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await register({
      name,
      email: email || `${phone}@servexa.demo`,
      phone,
      role: 'TECHNICIAN',
      city,
      area
    });

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-20 max-w-lg mx-auto px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          আবেদন সফলভাবে গ্রহণ করা হয়েছে!
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          আপনার প্রোফাইল ও এনআইডি যাচাইয়ের জন্য আমাদের টিম ২৪ ঘণ্টার মধ্যে <strong>{phone}</strong> নম্বরে যোগাযোগ করবে।
        </p>
        <button
          onClick={() => navigate('/technician/dashboard')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          টেকনিশিয়ান ড্যাশবোর্ডে প্রবেশ করুন
        </button>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-600 via-orange-500 to-amber-600 text-white p-8 sm:p-12 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
          <Wrench className="w-4 h-4" />
          <span>Servexa Pro Network</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          {isBangla ? 'দক্ষ মিস্ত্রি হিসেবে Servexa-তে যোগ দিন' : 'Grow Your Earnings with Servexa'}
        </h1>

        <p className="text-xs sm:text-sm text-orange-100 max-w-xl leading-relaxed">
          {isBangla
            ? 'প্রতিদিন সরাসরি আপনার এলাকায় নতুন নতুন কাজের সুযোগ পান। সম্পূর্ণ স্বাধীন কর্মঘণ্টা ও নিশ্চিত নিয়মিত আয়।'
            : 'Get high-paying jobs in your neighbourhood every day with verified customers and zero hassle.'}
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <DollarSign className="w-8 h-8 text-emerald-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">মাসিক ৪০,০০০৳+ আয়ের সুযোগ</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            কোনো মধ্যস্বত্বভোগী নেই। গ্রাহক থেকে সরাসরি আপনার নির্ধারিত ভিজিটিং ফি ও শ্রম মজুরি পান।
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <Users className="w-8 h-8 text-orange-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">আপনার নিজস্ব এলাকার কাজ</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            যে এলাকায় কাজ করতে স্বাচ্ছন্দ্যবোধ করেন শুধুমাত্র সেই এলাকা থেকেই রিকোয়েস্ট গ্রহণ করুন।
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <Award className="w-8 h-8 text-blue-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">আইডি ভেরিফায়েড সম্মানজনক পরিচয়</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Servexa ভেরিফায়েড ব্যাজের সাথে এলাকায় নিজের কাজের সুনাম ও নিয়মিত স্থায়ী কাস্টমার তৈরি করুন।
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            টেকনিশিয়ান রেজিস্ট্রেশন ফরম
          </h2>
          <p className="text-xs text-zinc-500">
            সহজ কয়েকটি তথ্য পূরণ করে আবেদন করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              আপনার পূর্ণ নাম (NID অনুযায়ী)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মোঃ রফিকুল ইসলাম"
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                মোবাইল নম্বর
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                জাতীয় পরিচয়পত্র (NID) নম্বর
              </label>
              <input
                type="text"
                required
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                placeholder="১০ বা ১৭ ডিজিটের এনআইডি"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
            </div>
          </div>

          {/* Skill Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              আপনার কাজের দক্ষতা নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.slice(0, 12).map((cat) => {
                const isSelected = selectedSkills.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleSkill(cat.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {isBangla ? cat.nameBn : cat.nameEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                কাজের প্রাথমিক এলাকা
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
              >
                <option value="Mirpur">মিরপুর (Mirpur)</option>
                <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
                <option value="Uttara">উত্তরা (Uttara)</option>
                <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
                <option value="Gulshan">গুলশান (Gulshan)</option>
                <option value="Badda">বাড্ডা (Badda)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                কাজের অভিজ্ঞতা (বছর)
              </label>
              <input
                type="number"
                min="1"
                max="35"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'আবেদন জমা দিন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
