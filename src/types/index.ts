export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

export type AvailabilityStatus = 'available' | 'busy' | 'offline';

export type UrgencyLevel = 'normal' | 'today' | 'emergency';

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'CASH_ON_SERVICE' | 'REFUNDED';
export type PaymentMethod = 'cash' | 'bkash' | 'nagad';

export type WarrantyStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  city: string;
  area: string;
  address?: string;
  nidVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: string;
}

export interface ServiceCategory {
  id: string;
  nameEn: string;
  nameBn: string;
  icon: string;
  descriptionEn: string;
  descriptionBn: string;
  startingPrice: number;
  popular?: boolean;
  emergencyAvailable?: boolean;
  activeProfessionals: number;
  tags: string[];
}

export interface PortfolioItem {
  id: string;
  titleEn: string;
  titleBn: string;
  category: string;
  descriptionEn: string;
  descriptionBn: string;
  beforeImage: string;
  afterImage: string;
  completedDate: string;
}

export interface HealthScore {
  responseRate: number; // percentage (e.g. 96)
  onTimeRate: number;   // percentage (e.g. 98)
  repeatRate: number;   // percentage (e.g. 88)
  completedJobs: number;// count (e.g. 340)
  reviewScore: number;  // 4.9
}

export interface Technician {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  bioEn: string;
  bioBn: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseRate: number;
  startingPrice: number;
  visitingFee: number;
  experienceYears: number;
  phone: string;
  city: string;
  primaryArea: string;
  serviceAreas: string[];
  skills: string[]; // Category IDs or names
  languages: string[];
  availability: AvailabilityStatus;
  workingHours: string;
  phoneVerified: boolean;
  nidVerified: boolean;
  skillVerified: boolean;
  platformVerified: boolean;
  featured?: boolean;
  warrantyPeriodDays: number;
  healthScore: HealthScore;
  portfolio: PortfolioItem[];
  aboutEn: string;
  aboutBn: string;
  latitude?: number;
  longitude?: number;
  emergencyAvailable?: boolean;
  serviceRadiusKm?: number;
}

export interface StatusHistoryItem {
  status: BookingStatus;
  timestamp: string;
  noteEn: string;
  noteBn: string;
}

export interface Quotation {
  id: string;
  bookingId: string;
  technicianId: string;
  technicianName: string;
  visitingFee: number;
  labourCost: number;
  partsEstimate: number;
  totalCost: number;
  estimatedDays: number;
  note: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  technicianName: string;
  technicianPhone: string;
  serviceName: string;
  issueDate: string;
  visitingFee: number;
  labourCost: number;
  partsCost: number;
  discount: number;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string; // e.g. KGO-2026-000123
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerArea: string;
  customerAddress: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  technicianAvatar: string;
  categoryId: string;
  serviceNameEn: string;
  serviceNameBn: string;
  problemDescription: string;
  mediaUrls: string[];
  date: string;
  timeSlot: string;
  urgency: UrgencyLevel;
  estimatedVisitingFee: number;
  estimatedLabourMin: number;
  estimatedLabourMax: number;
  estimatedTotalMin: number;
  estimatedTotalMax: number;
  finalTotal?: number;
  status: BookingStatus;
  statusHistory: StatusHistoryItem[];
  invoice?: Invoice;
  quotation?: Quotation;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  warrantyRequested?: boolean;
  warrantyDays: number;
  reviewed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  technicianId: string;
  overallRating: number;
  workQuality: number;
  behavior: number;
  punctuality: number;
  priceFairness: number;
  comment: string;
  serviceName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  message: string;
  attachmentUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  role: UserRole;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  type: 'booking' | 'payment' | 'warranty' | 'system' | 'message';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface WarrantyClaim {
  id: string;
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  technicianId: string;
  serviceName: string;
  issueDescription: string;
  status: WarrantyStatus;
  requestDate: string;
  resolvedDate?: string;
  adminNote?: string;
}

export interface ReportItem {
  id: string;
  bookingId: string;
  bookingNumber: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  targetId: string;
  targetName: string;
  targetRole: UserRole;
  reason: string;
  description: string;
  status: DisputeStatus;
  adminResolution?: string;
  createdAt: string;
}

export interface MaintenanceReminder {
  id: string;
  customerId: string;
  categoryId: string;
  titleEn: string;
  titleBn: string;
  frequencyMonths: number;
  lastServiceDate: string;
  nextDueDate: string;
  active: boolean;
}
