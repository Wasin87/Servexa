import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Info,
  ArrowRight,
  Upload
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { UrgencyLevel } from '../types';

export const BookPage: React.FC = () => {
  const { categories, technicians, createBooking } = useApp();
  const { t, isBangla } = useLanguage();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramTechId = searchParams.get('techId') || '';
  const paramCatId = searchParams.get('categoryId') || 'electrical';
  const paramDesc = searchParams.get('desc') || '';
  const paramUrgent = searchParams.get('emergency') === 'true';

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(paramCatId);
  const [selectedTechId, setSelectedTechId] = useState<string>(paramTechId || (technicians[0]?.id || ''));
  const [problemDescription, setProblemDescription] = useState<string>(paramDesc);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [customerCity, setCustomerCity] = useState<string>(currentUser?.city || 'Dhaka');
  const [customerArea, setCustomerArea] = useState<string>(currentUser?.area || 'Mirpur');
  const [customerAddress, setCustomerAddress] = useState<string>(currentUser?.address || 'House 22, Road 4, Section 10');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('02:00 PM - 04:00 PM');
  const [urgency, setUrgency] = useState<UrgencyLevel>(paramUrgent ? 'emergency' : 'today');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const selectedTech = technicians.find((t) => t.id === selectedTechId) || technicians[0];

  // Pricing calculation
  const visitingFee = urgency === 'emergency' ? selectedTech.visitingFee + 150 : selectedTech.visitingFee;
  const labourMin = 300;
  const labourMax = 600;
  const estimatedTotalMin = visitingFee + labourMin;
  const estimatedTotalMax = visitingFee + labourMax;

  // Mock photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In web app, create object URL or demo sample picture
      const demoSample = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80';
      setMediaUrls((prev) => [...prev, demoSample]);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const booking = createBooking({
      categoryId: selectedCategory.id,
      serviceNameEn: selectedCategory.nameEn,
      serviceNameBn: selectedCategory.nameBn,
      technicianId: selectedTech.id,
      technicianName: selectedTech.name,
      technicianPhone: selectedTech.phone,
      technicianAvatar: selectedTech.avatar,
      problemDescription: problemDescription.trim() || 'সাধারণ সার্ভিস ও পরিদর্শন',
      mediaUrls,
      customerCity,
      customerArea,
      customerAddress,
      date,
      timeSlot,
      urgency,
      estimatedVisitingFee: visitingFee,
      estimatedLabourMin: labourMin,
      estimatedLabourMax: labourMax,
      warrantyDays: selectedTech.warrantyPeriodDays
    });

    setIsSubmitting(false);
    navigate(`/booking/${booking.id}`);
  };

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          {t.booking.title}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {t.booking.subtitle}
        </p>
      </div>

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Step 1 & 2: Service & Problem */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
              ১
            </span>
            <span>সার্ভিস ও সমস্যার বিবরণ</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                সার্ভিস ক্যাটাগরি
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBangla ? c.nameBn : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t.booking.selectedTech}
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.primaryArea} · ★{tech.rating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.booking.problemLabel}
            </label>
            <textarea
              rows={3}
              required
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="কী সমস্যা হচ্ছে বা কী কাজ করাতে চান বিস্তারিত লিখুন..."
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.booking.mediaUploadLabel}
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <Upload className="w-4 h-4 text-orange-500" />
                <span>ছবি সংযুক্ত করুন</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {mediaUrls.length > 0 && (
                <div className="flex items-center gap-2">
                  {mediaUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Uploaded preview"
                      className="w-10 h-10 rounded-lg object-cover border border-orange-500"
                    />
                  ))}
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    ✓ ছবি যুক্ত হয়েছে
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Location Details */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
              ২
            </span>
            <span>ঠিকানা ও অবস্থান</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                শহর (City)
              </label>
              <input
                type="text"
                disabled
                value={customerCity}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                এলাকা (Dhaka Area)
              </label>
              <select
                value={customerArea}
                onChange={(e) => setCustomerArea(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="Mirpur">মিরপুর (Mirpur)</option>
                <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
                <option value="Uttara">উত্তরা (Uttara)</option>
                <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
                <option value="Gulshan">গুলশান (Gulshan)</option>
                <option value="Banani">বনানী (Banani)</option>
                <option value="Bashundhara">বসুন্ধরা (Bashundhara)</option>
                <option value="Farmgate">ফার্মগেট (Farmgate)</option>
                <option value="Badda">বাড্ডা (Badda)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.booking.addressLabel}
            </label>
            <input
              type="text"
              required
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="বাসা নম্বর, রোড নম্বর, ফ্ল্যাট ইত্যাদি..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Step 4: Schedule & Urgency */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
              ৩
            </span>
            <span>সময়সূচি ও অগ্রাধিকার</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t.booking.selectDate}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t.booking.selectTime}
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="09:00 AM - 11:00 AM">সকাল ০৯:০০ - ১১:০০</option>
                <option value="11:00 AM - 01:00 PM">সকাল ১১:০০ - দুপুর ০১:০০</option>
                <option value="02:00 PM - 04:00 PM">দুপুর ০২:০০ - বিকাল ০৪:০০</option>
                <option value="04:00 PM - 06:00 PM">বিকাল ০৪:০০ - সন্ধ্যা ০৬:০০</option>
                <option value="07:00 PM - 09:00 PM">সন্ধ্যা ০৭:০০ - রাত ০৯:০০</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              {t.booking.urgencyLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  urgency === 'normal'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.booking.urgencyNormal}</span>
                <input
                  type="radio"
                  name="urgency"
                  value="normal"
                  checked={urgency === 'normal'}
                  onChange={() => setUrgency('normal')}
                  className="accent-orange-600"
                />
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  urgency === 'today'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.booking.urgencyToday}</span>
                <input
                  type="radio"
                  name="urgency"
                  value="today"
                  checked={urgency === 'today'}
                  onChange={() => setUrgency('today')}
                  className="accent-orange-600"
                />
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  urgency === 'emergency'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.booking.urgencyEmergency}</span>
                <input
                  type="radio"
                  name="urgency"
                  value="emergency"
                  checked={urgency === 'emergency'}
                  onChange={() => setUrgency('emergency')}
                  className="accent-rose-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Cost Estimation Summary */}
        <div className="bg-stone-50 dark:bg-zinc-800/60 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-orange-500" />
            <span>{t.booking.costEstimation}</span>
          </h2>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">{t.booking.visitingFee} (Doorstep Inspection)</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{visitingFee}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">{t.booking.labourCost}</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{labourMin}–৳{labourMax}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">{t.booking.partsCost}</span>
              <span className="text-zinc-400 italic">{t.booking.partsNotice}</span>
            </div>
            <div className="flex justify-between py-2 pt-3 font-bold text-sm">
              <span className="text-zinc-900 dark:text-white">{t.booking.totalEstimate}</span>
              <span className="text-orange-600 dark:text-orange-400">৳{estimatedTotalMin}–৳{estimatedTotalMax}</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
            * {t.booking.disclaimer}
          </p>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-md transition-all hover:scale-101 flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'প্রসেসিং হচ্ছে...' : t.booking.submitBooking}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
