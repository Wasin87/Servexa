import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Booking,
  BookingStatus,
  ChatMessage,
  Invoice,
  MaintenanceReminder,
  NotificationItem,
  PortfolioItem,
  ReportItem,
  Review,
  ServiceCategory,
  Technician,
  WarrantyClaim,
  AvailabilityStatus,
} from '../types';
import {
  initialCategories,
  initialTechnicians,
  initialBookings,
  initialNotifications,
} from '../data/seedData';
import { useAuth } from './AuthContext';
import { resolveCustomerCoordinates } from '../utils/geoUtils';
import { getStoredAuthToken, updateServerBookingStatus } from '../services/financeApi';

interface AppContextType {
  categories: ServiceCategory[];
  technicians: Technician[];
  bookings: Booking[];
  notifications: NotificationItem[];
  favorites: string[];
  comparedTechIds: string[];
  chatMessages: ChatMessage[];
  reviews: Review[];
  warranties: WarrantyClaim[];
  reports: ReportItem[];
  maintenanceReminders: MaintenanceReminder[];

  // Actions
  createBooking: (bookingInput: Partial<Booking>) => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus, noteEn?: string, noteBn?: string) => void;
  generateInvoice: (bookingId: string, invoiceData: Partial<Invoice>) => void;
  submitReview: (reviewInput: Omit<Review, 'id' | 'createdAt'>) => void;
  toggleFavorite: (technicianId: string) => void;
  isFavorite: (technicianId: string) => boolean;
  addToCompare: (technicianId: string) => boolean;
  removeFromCompare: (technicianId: string) => void;
  clearCompare: () => void;
  sendMessage: (bookingId: string, text: string, attachmentUrl?: string, senderRoleOverride?: 'CUSTOMER' | 'TECHNICIAN') => void;
  markChatMessagesRead: (bookingId: string, readerRole: 'CUSTOMER' | 'TECHNICIAN') => void;
  getUnreadChatCount: (bookingId?: string, forRole?: 'CUSTOMER' | 'TECHNICIAN') => number;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  submitWarrantyClaim: (claim: Omit<WarrantyClaim, 'id' | 'requestDate' | 'status'>) => void;
  updateWarrantyStatus: (claimId: string, status: WarrantyClaim['status'], note?: string) => void;
  submitReport: (report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => void;
  resolveReport: (reportId: string, resolution: string) => void;
  addMaintenanceReminder: (reminder: Omit<MaintenanceReminder, 'id' | 'active'>) => void;
  deleteMaintenanceReminder: (id: string) => void;
  updateTechnicianAvailability: (technicianId: string, availability: AvailabilityStatus) => void;
  verifyTechnicianField: (technicianId: string, field: 'phoneVerified' | 'nidVerified' | 'skillVerified' | 'platformVerified', value: boolean) => void;
  registerNewTechnician: (user: User, preferredTechId?: string | null) => Technician;
  updateTechnicianProfile: (technicianId: string, profileData: Partial<Technician>) => void;
  deleteTechnician: (technicianId: string) => void;
  addTechnicianPortfolio: (technicianId: string, item: Omit<PortfolioItem, 'id'>) => void;
  deleteTechnicianPortfolio: (technicianId: string, itemId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const toServexaId = (val?: string): string => {
  if (!val) return '';
  return val.replace(/KGO-/gi, 'SRV-').replace(/কেজিও-/g, 'এসআরভি-');
};

const toServexaWarrantyId = (id: string): string => {
  if (!id) return `SRV-WRN-${String(Math.floor(100000 + Math.random() * 900000))}`;
  if (id.startsWith('SRV-WRN-')) return id;
  if (id.startsWith('war-')) {
    const digits = id.replace(/\D/g, '').slice(-6).padStart(6, '0');
    return `SRV-WRN-${digits}`;
  }
  return toServexaId(id);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Load or initialize state with localStorage persistence
  const [categories, setCategories] = useState<ServiceCategory[]>(() => {
    const saved = localStorage.getItem('kormigo_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const withDefaultGeo = initialTechnicians.map(initTech => ({
      ...initTech,
      division: initTech.division || 'Dhaka',
      district: initTech.district || initTech.city || 'Dhaka'
    }));
    const saved = localStorage.getItem('kormigo_technicians');
    if (!saved) return withDefaultGeo;
    try {
      const parsed: Technician[] = JSON.parse(saved);
      const seedIds = new Set(withDefaultGeo.map(t => t.id));
      const customTechnicians = parsed.filter(p => !seedIds.has(p.id));
      const mergedSeeds = withDefaultGeo.map(initTech => {
        const found = parsed.find(p => p.id === initTech.id);
        if (!found) return initTech;
        return {
          ...initTech,
          ...found,
          division: found.division || initTech.division,
          district: found.district || initTech.district,
          latitude: found.latitude ?? initTech.latitude,
          longitude: found.longitude ?? initTech.longitude,
          emergencyAvailable: found.emergencyAvailable ?? initTech.emergencyAvailable,
          serviceRadiusKm: found.serviceRadiusKm ?? initTech.serviceRadiusKm
        };
      });
      return [...customTechnicians, ...mergedSeeds];
    } catch {
      return withDefaultGeo;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('kormigo_bookings');
    if (!saved) return initialBookings;
    try {
      const parsed: Booking[] = JSON.parse(saved);
      return parsed.map(b => ({
        ...b,
        bookingNumber: toServexaId(b.bookingNumber),
        invoice: b.invoice ? { ...b.invoice, bookingNumber: toServexaId(b.invoice.bookingNumber) } : undefined
      }));
    } catch {
      return initialBookings;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('kormigo_notifications');
    if (!saved) return initialNotifications;
    try {
      const parsed: NotificationItem[] = JSON.parse(saved);
      return parsed.map(n => ({
        ...n,
        titleEn: toServexaId(n.titleEn),
        titleBn: toServexaId(n.titleBn),
        messageEn: toServexaId(n.messageEn),
        messageBn: toServexaId(n.messageBn)
      }));
    } catch {
      return initialNotifications;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('kormigo_favorites');
    return saved ? JSON.parse(saved) : ['tech-1', 'tech-3'];
  });

  const [comparedTechIds, setComparedTechIds] = useState<string[]>([]);

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('kormigo_reviews');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rev-1',
        bookingId: 'book-2',
        customerId: 'user-cust-demo',
        customerName: 'সাকিব আল হাসান',
        customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        technicianId: 'tech-2',
        overallRating: 5,
        workQuality: 5,
        behavior: 5,
        punctuality: 5,
        priceFairness: 4,
        comment: 'অসাধারণ দ্রুত কাজ করেছেন। কোনো বাড়তি কথা নেই, লিকেজ সাথে সাথে বন্ধ করে দিয়েছেন। পরিচ্ছন্ন কাজ।',
        serviceName: 'প্লাম্বিং ও পাইপ সার্ভিস',
        createdAt: '2026-09-20'
      }
    ];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('kormigo_chat');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg-1',
        bookingId: 'book-1',
        senderId: 'tech-1',
        senderRole: 'TECHNICIAN',
        senderName: 'রহিম আহমেদ',
        message: 'আসসালামু আলাইকুম স্যার। আমি আপনার বাড়ির দিকে রওনা দিয়েছি। আনুমানিক ২০-২৫ মিনিট লাগবে।',
        timestamp: '2026-09-28T11:05:00Z',
        isRead: true
      },
      {
        id: 'msg-2',
        bookingId: 'book-1',
        senderId: 'user-cust-demo',
        senderRole: 'CUSTOMER',
        senderName: 'সাকিব আল হাসান',
        message: 'ঠিক আছে ভাই। গেটে এসে ফোন দিয়েন, আমি ৩য় তলার ফ্ল্যাট খুলে দেব।',
        timestamp: '2026-09-28T11:08:00Z',
        isRead: true
      }
    ];
  });

  const [warranties, setWarranties] = useState<WarrantyClaim[]>(() => {
    const saved = localStorage.getItem('kormigo_warranties');
    if (!saved) return [];
    try {
      const parsed: WarrantyClaim[] = JSON.parse(saved);
      return parsed.map(w => ({
        ...w,
        id: toServexaWarrantyId(w.id),
        bookingNumber: toServexaId(w.bookingNumber)
      }));
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('kormigo_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenanceReminders, setMaintenanceReminders] = useState<MaintenanceReminder[]>(() => {
    const saved = localStorage.getItem('kormigo_reminders');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rem-1',
        customerId: 'user-cust-demo',
        categoryId: 'ac_repair',
        titleEn: 'AC Master Jet Servicing',
        titleBn: 'এসি মাস্টার জেট ওয়াশ সার্ভিসিং',
        frequencyMonths: 6,
        lastServiceDate: '2026-04-15',
        nextDueDate: '2026-10-15',
        active: true
      },
      {
        id: 'rem-2',
        customerId: 'user-cust-demo',
        categoryId: 'appliance_repair',
        titleEn: 'Water Purifier Filter Cartridge',
        titleBn: 'পানি ফিল্টার কার্টিজ পরিবর্তন',
        frequencyMonths: 3,
        lastServiceDate: '2026-07-01',
        nextDueDate: '2026-10-01',
        active: true
      }
    ];
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('kormigo_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('kormigo_technicians', JSON.stringify(technicians));
  }, [technicians]);
  useEffect(() => {
    localStorage.setItem('kormigo_bookings', JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem('kormigo_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('kormigo_favorites', JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem('kormigo_reviews', JSON.stringify(reviews));
  }, [reviews]);
  useEffect(() => {
    localStorage.setItem('kormigo_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);
  useEffect(() => {
    localStorage.setItem('kormigo_warranties', JSON.stringify(warranties));
  }, [warranties]);
  useEffect(() => {
    localStorage.setItem('kormigo_reports', JSON.stringify(reports));
  }, [reports]);
  useEffect(() => {
    localStorage.setItem('kormigo_reminders', JSON.stringify(maintenanceReminders));
  }, [maintenanceReminders]);

  const createBooking = (input: Partial<Booking>): Booking => {
    const bookingNumber = input.bookingNumber || `SRV-2026-${String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6)}`;
    const areaVal = input.customerArea || currentUser?.area || 'Mirpur';
    const districtVal = input.customerDistrict || input.customerCity || currentUser?.district || currentUser?.city || 'Dhaka';
    const addressVal = input.customerAddress || currentUser?.address || 'House 1, Road 2';
    const resolvedCoords = resolveCustomerCoordinates(areaVal, addressVal, bookingNumber, districtVal);
    const estVisit = input.estimatedVisitingFee ?? 200;
    const estLabMin = input.estimatedLabourMin ?? 300;
    const estLabMax = input.estimatedLabourMax ?? 600;
    const newBooking: Booking = {
      id: input.id || `book-${Date.now()}`,
      bookingNumber,
      customerId: input.customerId || currentUser?.id || 'guest',
      customerName: input.customerName || currentUser?.name || 'Customer',
      customerPhone: input.customerPhone || currentUser?.phone || '01700-000000',
      customerDivision: input.customerDivision || currentUser?.division || 'Dhaka',
      customerDistrict: districtVal,
      customerCity: districtVal,
      customerArea: areaVal,
      customerAddress: addressVal,
      customerLat: input.customerLat ?? resolvedCoords.lat,
      customerLng: input.customerLng ?? resolvedCoords.lng,
      technicianId: input.technicianId || 'tech-1',
      technicianName: input.technicianName || 'রহিম আহমেদ',
      technicianPhone: input.technicianPhone || '01712-345678',
      technicianAvatar: input.technicianAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
      categoryId: input.categoryId || 'electrical',
      serviceNameEn: input.serviceNameEn || 'Electrical Service',
      serviceNameBn: input.serviceNameBn || 'বৈদ্যুতিক সার্ভিস',
      problemDescription: input.problemDescription || '',
      mediaUrls: input.mediaUrls || [],
      date: input.date || new Date().toISOString().split('T')[0],
      timeSlot: input.timeSlot || '10:00 AM - 12:00 PM',
      urgency: input.urgency || 'normal',
      estimatedVisitingFee: estVisit,
      estimatedLabourMin: estLabMin,
      estimatedLabourMax: estLabMax,
      estimatedTotalMin: input.estimatedTotalMin ?? (estVisit + estLabMin),
      estimatedTotalMax: input.estimatedTotalMax ?? (estVisit + estLabMax),
      finalTotal: input.finalTotal,
      status: input.status || 'REQUESTED',
      statusHistory: input.statusHistory || [
        {
          status: 'REQUESTED',
          timestamp: new Date().toISOString(),
          noteEn: 'Booking requested by customer.',
          noteBn: 'গ্রাহক বুকিং আবেদন সম্পন্ন করেছেন।'
        }
      ],
      paymentStatus: input.paymentStatus || 'PENDING',
      paymentMethod: input.paymentMethod || 'cash',
      warrantyDays: input.warrantyDays || 14,
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: input.updatedAt || new Date().toISOString()
    };

    setBookings(prev => [newBooking, ...prev]);

    // Send notifications to both customer and technician
    const customerNotif: NotificationItem = {
      id: `notif-${Date.now()}-c`,
      userId: newBooking.customerId,
      role: 'CUSTOMER',
      titleEn: 'Booking Confirmed!',
      titleBn: 'বুকিং আবেদন সফল হয়েছে!',
      messageEn: `Your booking ${newBooking.bookingNumber} for ${newBooking.serviceNameEn} is placed.`,
      messageBn: `আপনার ${newBooking.serviceNameBn} বুকিং (${newBooking.bookingNumber}) সফলভাবে গৃহীত হয়েছে।`,
      type: 'booking',
      link: `/booking/${newBooking.id}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const techNotif: NotificationItem = {
      id: `notif-${Date.now()}-t`,
      userId: newBooking.technicianId,
      role: 'TECHNICIAN',
      titleEn: 'New Job Request Received!',
      titleBn: 'নতুন কাজের রিকোয়েস্ট এসেছে!',
      messageEn: `Booking ${newBooking.bookingNumber} in ${newBooking.customerArea}.`,
      messageBn: `${newBooking.customerArea}-তে নতুন কাজের আবেদন (${newBooking.bookingNumber})।`,
      type: 'booking',
      link: `/technician/jobs`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [customerNotif, techNotif, ...prev]);

    return newBooking;
  };

  const updateBookingStatus = (
    bookingId: string,
    status: BookingStatus,
    noteEn?: string,
    noteBn?: string
  ) => {
    setBookings(prev =>
      prev.map(b => {
        if (b.id !== bookingId) return b;
        const historyItem = {
          status,
          timestamp: new Date().toISOString(),
          noteEn: noteEn || `Status updated to ${status}`,
          noteBn: noteBn || `স্ট্যাটাস পরিবর্তন: ${status}`
        };
        return {
          ...b,
          status,
          statusHistory: [...b.statusHistory, historyItem],
          updatedAt: new Date().toISOString()
        };
      })
    );

    // Notify customer
    const targetBooking = bookings.find(b => b.id === bookingId);
    if (targetBooking) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: targetBooking.customerId,
        role: 'CUSTOMER',
        titleEn: `Booking Status: ${status}`,
        titleBn: `বুকিং স্ট্যাটাস: ${status}`,
        messageEn: noteEn || `Your booking status changed to ${status}`,
        messageBn: noteBn || `আপনার বুকিং স্ট্যাটাস পরিবর্তিত হয়ে ${status} হয়েছে`,
        type: 'booking',
        link: `/booking/${bookingId}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [notif, ...prev]);
    }

    if (getStoredAuthToken()) {
      void updateServerBookingStatus(bookingId, status, noteEn, noteBn).catch(() => {});
    }
  };

  const generateInvoice = (bookingId: string, invoiceData: Partial<Invoice>) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const visitingFee = invoiceData.visitingFee ?? booking.estimatedVisitingFee;
    const labourCost = invoiceData.labourCost ?? 400;
    const partsCost = invoiceData.partsCost ?? 0;
    const discount = invoiceData.discount ?? 0;
    const subtotal = visitingFee + labourCost + partsCost;
    const total = Math.max(0, subtotal - discount);

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6)}`,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      technicianName: booking.technicianName,
      technicianPhone: booking.technicianPhone,
      serviceName: booking.serviceNameBn,
      issueDate: new Date().toISOString().split('T')[0],
      visitingFee,
      labourCost,
      partsCost,
      discount,
      subtotal,
      total,
      paymentMethod: invoiceData.paymentMethod || 'cash',
      paymentStatus: invoiceData.paymentStatus || 'PAID',
      paidAt: new Date().toISOString()
    };

    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, invoice, finalTotal: total, paymentStatus: invoice.paymentStatus, status: 'COMPLETED' } : b))
    );
  };

  const submitReview = (reviewInput: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewInput,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setReviews(prev => [newReview, ...prev]);

    // Mark booking as reviewed
    setBookings(prev =>
      prev.map(b => (b.id === reviewInput.bookingId ? { ...b, reviewed: true } : b))
    );

    // Recalculate technician rating & completed jobs
    setTechnicians(prev =>
      prev.map(t => {
        if (t.id !== reviewInput.technicianId) return t;
        const currentCount = t.reviewCount;
        const newRating = Number(((t.rating * currentCount + reviewInput.overallRating) / (currentCount + 1)).toFixed(1));
        return {
          ...t,
          rating: newRating,
          reviewCount: currentCount + 1,
          completedJobs: t.completedJobs + 1,
          healthScore: {
            ...t.healthScore,
            reviewScore: newRating,
            completedJobs: t.completedJobs + 1
          }
        };
      })
    );

    const reviewNotif: NotificationItem = {
      id: `notif-rev-${Date.now()}`,
      userId: reviewInput.technicianId,
      role: 'TECHNICIAN',
      titleEn: `New ${reviewInput.overallRating}★ Customer Feedback!`,
      titleBn: `⭐ নতুন গ্রাহক ফিডব্যাক (${reviewInput.overallRating}★)!`,
      messageEn: `${reviewInput.customerName} left feedback for ${reviewInput.serviceName}: "${reviewInput.comment.slice(0, 60)}"`,
      messageBn: `${reviewInput.customerName} আপনার "${reviewInput.serviceName}" কাজের ওপর ${reviewInput.overallRating}★ ফিডব্যাক দিয়েছেন।`,
      type: 'system',
      link: '/technician/dashboard',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [reviewNotif, ...prev]);
  };

  const toggleFavorite = (technicianId: string) => {
    setFavorites(prev =>
      prev.includes(technicianId) ? prev.filter(id => id !== technicianId) : [...prev, technicianId]
    );
  };

  const isFavorite = (technicianId: string) => favorites.includes(technicianId);

  const addToCompare = (technicianId: string) => {
    if (comparedTechIds.includes(technicianId)) return true;
    if (comparedTechIds.length >= 3) return false;
    setComparedTechIds(prev => [...prev, technicianId]);
    return true;
  };

  const removeFromCompare = (technicianId: string) => {
    setComparedTechIds(prev => prev.filter(id => id !== technicianId));
  };

  const clearCompare = () => {
    setComparedTechIds([]);
  };

  const sendMessage = (
    bookingId: string,
    text: string,
    attachmentUrl?: string,
    senderRoleOverride?: 'CUSTOMER' | 'TECHNICIAN'
  ) => {
    const booking = bookings.find(b => b.id === bookingId);
    const activeRole = senderRoleOverride || (currentUser?.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER');

    const isCustomer = activeRole === 'CUSTOMER';
    const senderId = isCustomer
      ? (currentUser?.role === 'CUSTOMER' ? currentUser.id : booking?.customerId || 'cust-1')
      : (currentUser?.role === 'TECHNICIAN' ? currentUser.id : booking?.technicianId || 'tech-1');
    const senderName = isCustomer
      ? (currentUser?.role === 'CUSTOMER' ? currentUser.name : booking?.customerName || 'গ্রাহক')
      : (currentUser?.role === 'TECHNICIAN' ? currentUser.name : booking?.technicianName || 'মিস্ত্রি');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      bookingId,
      senderId,
      senderRole: isCustomer ? 'CUSTOMER' : 'TECHNICIAN',
      senderName,
      message: text,
      attachmentUrl,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Create a real notification for the other party (NO RANDOM BOT AUTO-REPLY!)
    if (isCustomer) {
      // Customer sent message -> Notify Technician
      const techNotif: NotificationItem = {
        id: `notif-chat-${Date.now()}`,
        userId: booking?.technicianId || 'tech-1',
        role: 'TECHNICIAN',
        titleEn: `New message from ${senderName}`,
        titleBn: `${senderName} (গ্রাহক) নতুন মেসেজ দিয়েছেন`,
        messageEn: `"${text.length > 50 ? text.slice(0, 50) + '...' : text}"`,
        messageBn: `"${text.length > 50 ? text.slice(0, 50) + '...' : text}"`,
        type: 'message',
        link: `/technician/dashboard`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [techNotif, ...prev]);
    } else {
      // Technician sent message -> Notify Customer
      const custNotif: NotificationItem = {
        id: `notif-chat-${Date.now()}`,
        userId: booking?.customerId || 'cust-1',
        role: 'CUSTOMER',
        titleEn: `New message from ${senderName}`,
        titleBn: `${senderName} (মিস্ত্রি) মেসেজের উত্তর দিয়েছেন`,
        messageEn: `"${text.length > 50 ? text.slice(0, 50) + '...' : text}"`,
        messageBn: `"${text.length > 50 ? text.slice(0, 50) + '...' : text}"`,
        type: 'message',
        link: `/booking/${bookingId}`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [custNotif, ...prev]);
    }
  };

  const markChatMessagesRead = (bookingId: string, readerRole: 'CUSTOMER' | 'TECHNICIAN') => {
    setChatMessages(prev =>
      prev.map(msg => {
        if (msg.bookingId !== bookingId) return msg;
        if (readerRole === 'CUSTOMER' && msg.senderRole === 'TECHNICIAN' && !msg.isRead) {
          return { ...msg, isRead: true };
        }
        if (readerRole === 'TECHNICIAN' && msg.senderRole === 'CUSTOMER' && !msg.isRead) {
          return { ...msg, isRead: true };
        }
        return msg;
      })
    );
  };

  const getUnreadChatCount = (bookingId?: string, forRole?: 'CUSTOMER' | 'TECHNICIAN') => {
    const roleToCheck = forRole || (currentUser?.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER');
    return chatMessages.filter(msg => {
      if (bookingId && msg.bookingId !== bookingId) return false;
      if (roleToCheck === 'TECHNICIAN') {
        return msg.senderRole === 'CUSTOMER' && !msg.isRead;
      } else {
        return msg.senderRole === 'TECHNICIAN' && !msg.isRead;
      }
    }).length;
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const submitWarrantyClaim = (claim: Omit<WarrantyClaim, 'id' | 'requestDate' | 'status'>) => {
    const relatedBooking = bookings.find(b => b.id === claim.bookingId);
    const targetTechId = claim.technicianId || relatedBooking?.technicianId || 'tech-1';
    const relatedTech = technicians.find(t => t.id === targetTechId);

    const areaVal = claim.customerArea || relatedBooking?.customerArea || currentUser?.area || 'Dhanmondi';
    const addressVal = claim.customerAddress || relatedBooking?.customerAddress || currentUser?.address || 'Dhaka';
    const resolvedCoords = resolveCustomerCoordinates(areaVal, addressVal, claim.bookingNumber);

    const newClaim: WarrantyClaim = {
      ...claim,
      id: `SRV-WRN-${String(Math.floor(100000 + Math.random() * 900000))}`,
      bookingNumber: toServexaId(claim.bookingNumber),
      technicianId: targetTechId,
      technicianName: claim.technicianName || relatedBooking?.technicianName || relatedTech?.name || 'টেকনিশিয়ান',
      technicianPhone: claim.technicianPhone || relatedBooking?.technicianPhone || relatedTech?.phone || '',
      customerName: claim.customerName || relatedBooking?.customerName || currentUser?.name || 'গ্রাহক',
      customerPhone: claim.customerPhone || relatedBooking?.customerPhone || currentUser?.phone || '',
      customerArea: areaVal,
      customerAddress: addressVal,
      customerLat: claim.customerLat ?? relatedBooking?.customerLat ?? resolvedCoords.lat,
      customerLng: claim.customerLng ?? relatedBooking?.customerLng ?? resolvedCoords.lng,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'REQUESTED'
    };
    setWarranties(prev => [newClaim, ...prev]);

    setBookings(prev =>
      prev.map(b => (b.id === claim.bookingId ? { ...b, warrantyRequested: true } : b))
    );

    const adminNotif: NotificationItem = {
      id: `notif-war-admin-${Date.now()}`,
      userId: 'user-admin-demo',
      role: 'ADMIN',
      titleEn: `New Warranty Claim #${newClaim.id}`,
      titleBn: `🛡️ নতুন ওয়ারেন্টি ক্লেইম আবেদন (#${newClaim.id})`,
      messageEn: `${newClaim.customerName} submitted a warranty claim for ${newClaim.serviceName} (${newClaim.bookingNumber}, Tech: ${newClaim.technicianName}).`,
      messageBn: `${newClaim.customerName} (${newClaim.technicianName}-এর ${newClaim.bookingNumber} কাজের ওপর) ফ্রি ওয়ারেন্টি ক্লেইম করেছেন। অ্যাডমিন অনুমোদন প্রয়োজন।`,
      type: 'warranty',
      link: '/admin/dashboard',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [adminNotif, ...prev]);
  };

  const updateWarrantyStatus = (claimId: string, status: WarrantyClaim['status'], note?: string) => {
    const targetClaim = warranties.find(w => w.id === claimId);
    const today = new Date().toISOString().split('T')[0];

    setWarranties(prev =>
      prev.map(w => {
        if (w.id !== claimId) return w;
        const isAdminAction = status === 'APPROVED' || status === 'REJECTED';
        const isTechAction = status === 'ACCEPTED' || status === 'ON_THE_WAY' || status === 'RESOLVED';

        return {
          ...w,
          status,
          adminNote: isAdminAction ? (note || w.adminNote) : w.adminNote,
          technicianNote: isTechAction ? (note || w.technicianNote) : w.technicianNote,
          approvedDate: status === 'APPROVED' ? today : w.approvedDate,
          acceptedAt: status === 'ACCEPTED' ? new Date().toISOString() : w.acceptedAt,
          resolvedDate: status === 'RESOLVED' ? today : w.resolvedDate
        };
      })
    );

    if (!targetClaim) return;

    const newNotifications: NotificationItem[] = [];
    const ts = Date.now();

    if (status === 'APPROVED') {
      newNotifications.push({
        id: `notif-war-tech-${ts}`,
        userId: targetClaim.technicianId,
        role: 'TECHNICIAN',
        titleEn: `Approved Warranty Job #${targetClaim.id}`,
        titleBn: `🛡️ অনুমোদিত ওয়ারেন্টি ক্লেইম (#${targetClaim.id})`,
        messageEn: `Admin approved warranty claim #${targetClaim.id} (${targetClaim.bookingNumber}) for ${targetClaim.serviceName} and assigned it to you.`,
        messageBn: `অ্যাডমিন "${targetClaim.serviceName}"-এর ওয়ারেন্টি ক্লেইম (#${targetClaim.id}) অনুমোদন করে সরাসরি আপনার ড্যাশবোর্ডে পাঠিয়েছেন। অনুগ্রহ করে পিক করুন।`,
        type: 'warranty',
        link: '/technician/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      newNotifications.push({
        id: `notif-war-cust-${ts + 1}`,
        userId: targetClaim.customerId,
        role: 'CUSTOMER',
        titleEn: `Warranty Claim Approved`,
        titleBn: `✅ আপনার ওয়ারেন্টি ক্লেইম অনুমোদিত হয়েছে`,
        messageEn: `Admin approved claim #${targetClaim.id} (${targetClaim.bookingNumber}) and dispatched it to ${targetClaim.technicianName || 'your technician'}.`,
        messageBn: `অ্যাডমিন আপনার ওয়ারেন্টি ক্লেইম (#${targetClaim.id}) অনুমোদন করে টেকনিশিয়ান ${targetClaim.technicianName || ''}-এর কাছে পাঠিয়েছেন।`,
        type: 'warranty',
        link: '/customer/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } else if (status === 'REJECTED') {
      newNotifications.push({
        id: `notif-war-rej-${ts}`,
        userId: targetClaim.customerId,
        role: 'CUSTOMER',
        titleEn: `Warranty Claim Update`,
        titleBn: `ওয়ারেন্টি ক্লেইম পর্যালোচনা সম্পন্ন`,
        messageEn: note || `Warranty claim #${targetClaim.id} was not eligible.`,
        messageBn: note || `ওয়ারেন্টি ক্লেইম (#${targetClaim.id}) অনুমোদিত হয়নি।`,
        type: 'warranty',
        link: '/customer/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } else if (status === 'ACCEPTED') {
      newNotifications.push({
        id: `notif-war-acc-${ts}`,
        userId: targetClaim.customerId,
        role: 'CUSTOMER',
        titleEn: `Technician Picked Warranty Claim`,
        titleBn: `🔧 টেকনিশিয়ান ওয়ারেন্টি কাজ পিক করেছেন`,
        messageEn: `${targetClaim.technicianName || 'Technician'} accepted your warranty service #${targetClaim.id}.`,
        messageBn: `${targetClaim.technicianName || 'টেকনিশিয়ান'} আপনার ফ্রি ওয়ারেন্টি কাজ (#${targetClaim.id}) পিক করেছেন।`,
        type: 'warranty',
        link: '/customer/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } else if (status === 'ON_THE_WAY') {
      newNotifications.push({
        id: `notif-war-way-${ts}`,
        userId: targetClaim.customerId,
        role: 'CUSTOMER',
        titleEn: `Technician On The Way (Warranty)`,
        titleBn: `🚚 ওয়ারেন্টি সার্ভিসের জন্য টেকনিশিয়ান রওনা হয়েছেন`,
        messageEn: `${targetClaim.technicianName || 'Technician'} is heading to ${targetClaim.customerAddress || 'your location'} for free warranty service (#${targetClaim.id}).`,
        messageBn: `${targetClaim.technicianName || 'টেকনিশিয়ান'} ফ্রি ওয়ারেন্টি সার্ভিস (#${targetClaim.id}) দিতে আপনার ঠিকানায় রওনা হয়েছেন।`,
        type: 'warranty',
        link: '/customer/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } else if (status === 'RESOLVED') {
      newNotifications.push({
        id: `notif-war-res-c-${ts}`,
        userId: targetClaim.customerId,
        role: 'CUSTOMER',
        titleEn: `Warranty Service Resolved!`,
        titleBn: `✅ ওয়ারেন্টি সার্ভিস সম্পন্ন হয়েছে!`,
        messageEn: `Warranty repair #${targetClaim.id} for ${targetClaim.serviceName} is completed. Please share your feedback.`,
        messageBn: `"${targetClaim.serviceName}"-এর ফ্রি ওয়ারেন্টি সার্ভিস (#${targetClaim.id}) সম্পন্ন হয়েছে। অনুগ্রহ করে আপনার ফিডব্যাক জানান।`,
        type: 'warranty',
        link: '/customer/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      newNotifications.push({
        id: `notif-war-res-a-${ts + 1}`,
        userId: 'user-admin-demo',
        role: 'ADMIN',
        titleEn: `Warranty Claim Resolved (#${targetClaim.id})`,
        titleBn: `✔️ ওয়ারেন্টি ক্লেইম সম্পন্ন (#${targetClaim.id})`,
        messageEn: `${targetClaim.technicianName || 'Technician'} completed warranty service for ${targetClaim.customerName || 'customer'}.`,
        messageBn: `${targetClaim.technicianName || 'টেকনিশিয়ান'} সফলভাবে ওয়ারেন্টি সার্ভিস (#${targetClaim.id}) সম্পন্ন করেছেন।`,
        type: 'warranty',
        link: '/admin/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }
  };

  const submitReport = (report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => {
    const newReport: ReportItem = {
      ...report,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'OPEN'
    };
    setReports(prev => [newReport, ...prev]);

    setBookings(prev =>
      prev.map(b => (b.id === report.bookingId ? { ...b, status: 'DISPUTED' } : b))
    );
  };

  const resolveReport = (reportId: string, resolution: string) => {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: 'RESOLVED', adminResolution: resolution } : r))
    );
  };

  const addMaintenanceReminder = (reminder: Omit<MaintenanceReminder, 'id' | 'active'>) => {
    const newRem: MaintenanceReminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
      active: true
    };
    setMaintenanceReminders(prev => [newRem, ...prev]);
  };

  const deleteMaintenanceReminder = (id: string) => {
    setMaintenanceReminders(prev => prev.filter(r => r.id !== id));
  };

  const updateTechnicianAvailability = (technicianId: string, availability: AvailabilityStatus) => {
    setTechnicians(prev =>
      prev.map(t => (t.id === technicianId ? { ...t, availability } : t))
    );
  };

  const registerNewTechnician = (user: User, preferredTechId?: string | null): Technician => {
    const existing = technicians.find(t => t.userId === user.id || (user.email && t.email === user.email));
    if (existing) return existing;

    const newTech: Technician = {
      id: preferredTechId || `tech-${Date.now()}`,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bioEn: '',
      bioBn: '',
      rating: 5.0,
      reviewCount: 0,
      completedJobs: 0,
      responseRate: 100,
      startingPrice: 0,
      visitingFee: 0,
      experienceYears: 0,
      phone: user.phone,
      division: '',
      district: '',
      city: '',
      primaryArea: '',
      serviceAreas: [],
      skills: [],
      languages: ['বাংলা'],
      availability: 'offline',
      workingHours: '',
      phoneVerified: true,
      nidVerified: false,
      skillVerified: false,
      platformVerified: false,
      nidFrontImage: '',
      nidBackImage: '',
      featured: false,
      warrantyPeriodDays: 7,
      healthScore: {
        responseRate: 100,
        onTimeRate: 100,
        repeatRate: 100,
        completedJobs: 0,
        reviewScore: 5.0
      },
      portfolio: [],
      aboutEn: '',
      aboutBn: '',
      emergencyAvailable: false,
      serviceRadiusKm: 10
    };

    setTechnicians(prev => [newTech, ...prev]);

    const adminNotif: NotificationItem = {
      id: `notif-newtech-${Date.now()}`,
      userId: 'user-admin-demo',
      role: 'ADMIN',
      titleEn: `New Technician Registered: ${user.name}`,
      titleBn: `👷 নতুন টেকনিশিয়ান নিবন্ধন করেছেন: ${user.name}`,
      messageEn: `${user.name} (${user.phone}) registered as a technician. Review their biodata, NID & skill test in Admin KYC.`,
      messageBn: `${user.name} (📞 ${user.phone}) নতুন টেকনিশিয়ান হিসেবে সাইন আপ করেছেন। প্রোফাইল, NID ও "দক্ষতা উত্তীর্ণ" যাচাই করতে অ্যাডমিন ড্যাশবোর্ড দেখুন।`,
      type: 'system',
      link: '/admin/dashboard',
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [adminNotif, ...prev]);

    return newTech;
  };

  const verifyTechnicianField = (
    technicianId: string,
    field: 'phoneVerified' | 'nidVerified' | 'skillVerified' | 'platformVerified',
    value: boolean
  ) => {
    const targetTech = technicians.find(t => t.id === technicianId);
    setTechnicians(prev =>
      prev.map(t => (t.id === technicianId ? { ...t, [field]: value } : t))
    );

    if (targetTech && value && (field === 'skillVerified' || field === 'platformVerified' || field === 'nidVerified')) {
      const titleMap = {
        nidVerified: '✅ আপনার NID যাচাই সম্পন্ন হয়েছে',
        skillVerified: '🎉 অভিনন্দন! আপনি "দক্ষতা উত্তীর্ণ" হিসেবে অনুমোদিত',
        platformVerified: '🛡️ আপনি ভেরিফায়েড প্রো ব্যাজ পেয়েছেন'
      };
      const techNotif: NotificationItem = {
        id: `notif-kyc-${Date.now()}`,
        userId: targetTech.id,
        role: 'TECHNICIAN',
        titleEn: `Admin Verification Update`,
        titleBn: titleMap[field],
        messageEn: `Admin updated ${field} to verified on your profile.`,
        messageBn:
          field === 'skillVerified'
            ? 'অ্যাডমিন আপনার বায়োডাটা ও NID যাচাই করে আপনাকে "দক্ষতা উত্তীর্ণ" হিসেবে অনুমোদন দিয়েছেন। এখন থেকে আপনি কাজ পিক করতে পারবেন!'
            : 'অ্যাডমিন আপনার প্রোফাইল যাচাই আপডেট করেছেন।',
        type: 'system',
        link: '/technician/dashboard',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [techNotif, ...prev]);
    }
  };

  const updateTechnicianProfile = (technicianId: string, profileData: Partial<Technician>) => {
    setTechnicians(prev =>
      prev.map(t => (t.id === technicianId ? { ...t, ...profileData } : t))
    );
  };

  const deleteTechnician = (technicianId: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== technicianId));
  };

  const addTechnicianPortfolio = (technicianId: string, item: Omit<PortfolioItem, 'id'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: `port-${Date.now()}`
    };
    setTechnicians(prev =>
      prev.map(t =>
        t.id === technicianId ? { ...t, portfolio: [newItem, ...(t.portfolio || [])] } : t
      )
    );
  };

  const deleteTechnicianPortfolio = (technicianId: string, itemId: string) => {
    setTechnicians(prev =>
      prev.map(t =>
        t.id === technicianId ? { ...t, portfolio: (t.portfolio || []).filter(p => p.id !== itemId) } : t
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        categories,
        technicians,
        bookings,
        notifications,
        favorites,
        comparedTechIds,
        chatMessages,
        reviews,
        warranties,
        reports,
        maintenanceReminders,
        createBooking,
        updateBookingStatus,
        generateInvoice,
        submitReview,
        toggleFavorite,
        isFavorite,
        addToCompare,
        removeFromCompare,
        clearCompare,
        sendMessage,
        markChatMessagesRead,
        getUnreadChatCount,
        markNotificationRead,
        markAllNotificationsRead,
        submitWarrantyClaim,
        updateWarrantyStatus,
        submitReport,
        resolveReport,
        addMaintenanceReminder,
        deleteMaintenanceReminder,
        updateTechnicianAvailability,
        verifyTechnicianField,
        registerNewTechnician,
        updateTechnicianProfile,
        deleteTechnician,
        addTechnicianPortfolio,
        deleteTechnicianPortfolio,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
