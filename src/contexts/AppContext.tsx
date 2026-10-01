import React, { createContext, useContext, useState, useEffect } from 'react';
import {
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
  sendMessage: (bookingId: string, text: string, attachmentUrl?: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  submitWarrantyClaim: (claim: Omit<WarrantyClaim, 'id' | 'requestDate' | 'status'>) => void;
  updateWarrantyStatus: (claimId: string, status: WarrantyClaim['status'], adminNote?: string) => void;
  submitReport: (report: Omit<ReportItem, 'id' | 'createdAt' | 'status'>) => void;
  resolveReport: (reportId: string, resolution: string) => void;
  addMaintenanceReminder: (reminder: Omit<MaintenanceReminder, 'id' | 'active'>) => void;
  deleteMaintenanceReminder: (id: string) => void;
  updateTechnicianAvailability: (technicianId: string, availability: AvailabilityStatus) => void;
  verifyTechnicianField: (technicianId: string, field: 'phoneVerified' | 'nidVerified' | 'skillVerified' | 'platformVerified', value: boolean) => void;
  updateTechnicianProfile: (technicianId: string, profileData: Partial<Technician>) => void;
  deleteTechnician: (technicianId: string) => void;
  addTechnicianPortfolio: (technicianId: string, item: Omit<PortfolioItem, 'id'>) => void;
  deleteTechnicianPortfolio: (technicianId: string, itemId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Load or initialize state with localStorage persistence
  const [categories, setCategories] = useState<ServiceCategory[]>(() => {
    const saved = localStorage.getItem('kormigo_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('kormigo_technicians');
    if (!saved) return initialTechnicians;
    try {
      const parsed: Technician[] = JSON.parse(saved);
      // Merge with initialTechnicians to ensure latitude/longitude/emergency fields are populated
      return initialTechnicians.map(initTech => {
        const found = parsed.find(p => p.id === initTech.id);
        if (!found) return initTech;
        return {
          ...initTech,
          ...found,
          latitude: initTech.latitude,
          longitude: initTech.longitude,
          emergencyAvailable: initTech.emergencyAvailable,
          serviceRadiusKm: initTech.serviceRadiusKm
        };
      });
    } catch {
      return initialTechnicians;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('kormigo_bookings');
    return saved ? JSON.parse(saved) : initialBookings;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('kormigo_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
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
    return saved ? JSON.parse(saved) : [];
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
    const bookingNumber = `KGO-2026-${String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6)}`;
    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      bookingNumber,
      customerId: currentUser?.id || 'guest',
      customerName: currentUser?.name || input.customerName || 'Customer',
      customerPhone: currentUser?.phone || input.customerPhone || '01700-000000',
      customerCity: input.customerCity || currentUser?.city || 'Dhaka',
      customerArea: input.customerArea || currentUser?.area || 'Mirpur',
      customerAddress: input.customerAddress || currentUser?.address || 'House 1, Road 2',
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
      estimatedVisitingFee: input.estimatedVisitingFee || 200,
      estimatedLabourMin: input.estimatedLabourMin || 300,
      estimatedLabourMax: input.estimatedLabourMax || 600,
      estimatedTotalMin: (input.estimatedVisitingFee || 200) + (input.estimatedLabourMin || 300),
      estimatedTotalMax: (input.estimatedVisitingFee || 200) + (input.estimatedLabourMax || 600),
      status: 'REQUESTED',
      statusHistory: [
        {
          status: 'REQUESTED',
          timestamp: new Date().toISOString(),
          noteEn: 'Booking requested by customer.',
          noteBn: 'গ্রাহক বুকিং আবেদন সম্পন্ন করেছেন।'
        }
      ],
      paymentStatus: 'PENDING',
      paymentMethod: 'cash',
      warrantyDays: input.warrantyDays || 14,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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

  const sendMessage = (bookingId: string, text: string, attachmentUrl?: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      bookingId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      senderName: currentUser.name,
      message: text,
      attachmentUrl,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setChatMessages(prev => [...prev, newMsg]);

    // Simulate technician automated friendly acknowledgment after 1.5s if customer sends message
    if (currentUser.role === 'CUSTOMER') {
      setTimeout(() => {
        const autoReply: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          bookingId,
          senderId: 'tech-1',
          senderRole: 'TECHNICIAN',
          senderName: 'রহিম আহমেদ',
          message: 'জি ধন্যবাদ স্যার, আমি মেসেজ পেয়েছি। যথা সময়ে হাজির হচ্ছি।',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        setChatMessages(curr => [...curr, autoReply]);
      }, 1500);
    }
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
    const newClaim: WarrantyClaim = {
      ...claim,
      id: `war-${Date.now()}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'REQUESTED'
    };
    setWarranties(prev => [newClaim, ...prev]);

    setBookings(prev =>
      prev.map(b => (b.id === claim.bookingId ? { ...b, warrantyRequested: true } : b))
    );
  };

  const updateWarrantyStatus = (claimId: string, status: WarrantyClaim['status'], adminNote?: string) => {
    setWarranties(prev =>
      prev.map(w =>
        w.id === claimId
          ? {
              ...w,
              status,
              adminNote,
              resolvedDate: status === 'RESOLVED' ? new Date().toISOString().split('T')[0] : w.resolvedDate
            }
          : w
      )
    );
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

  const verifyTechnicianField = (
    technicianId: string,
    field: 'phoneVerified' | 'nidVerified' | 'skillVerified' | 'platformVerified',
    value: boolean
  ) => {
    setTechnicians(prev =>
      prev.map(t => (t.id === technicianId ? { ...t, [field]: value } : t))
    );
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
