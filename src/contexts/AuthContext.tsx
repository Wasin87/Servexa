import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Technician, User, UserRole } from '../types';
import { demoUsers } from '../data/seedData';
import { setStoredAuthToken, syncServerSession } from '../services/financeApi';

interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  city?: string;
  area?: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  authTokenReady: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (userData: RegisterInput) => Promise<{ success: boolean; error?: string; user?: User; serverTechnicianId?: string | null }>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => void;
  switchDemoTechnician: (tech: Technician) => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REGISTERED_USERS_KEY = 'kormigo_registered_users';

function loadRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kormigo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    // Default to demo customer so the user starts with a rich logged-in experience immediately!
    return demoUsers.customer;
  });
  const [authTokenReady, setAuthTokenReady] = useState<boolean>(false);
  const sessionSeqRef = useRef<number>(0);

  const ensureServerSession = async (user: User | null): Promise<string | null> => {
    const seq = ++sessionSeqRef.current;
    if (!user) {
      setStoredAuthToken(null);
      setAuthTokenReady(false);
      return null;
    }
    setAuthTokenReady(false);
    try {
      const session = await syncServerSession(user);
      if (sessionSeqRef.current === seq) {
        setAuthTokenReady(true);
      }
      return session.technicianId ?? null;
    } catch {
      if (sessionSeqRef.current === seq) {
        setAuthTokenReady(false);
      }
      return null;
    }
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kormigo_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kormigo_user');
    }
    void ensureServerSession(currentUser);
  }, [currentUser?.id, currentUser?.role]);

  const login = async (email: string, password?: string, targetRole?: UserRole) => {
    const identifier = email.trim();
    const emailLower = identifier.toLowerCase();
    const registered = loadRegisteredUsers();

    const matchedRegistered = registered.find(
      u => u.email.toLowerCase() === emailLower || u.phone.trim() === identifier
    );

    if (matchedRegistered) {
      if (matchedRegistered.password && matchedRegistered.password !== (password || '')) {
        return {
          success: false,
          error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে রেজিস্ট্রেশনের সময় দেওয়া সঠিক পাসওয়ার্ড লিখুন।'
        };
      }
      await ensureServerSession(matchedRegistered);
      setCurrentUser(matchedRegistered);
      return { success: true, user: matchedRegistered };
    }

    let matchedDemo: User | undefined;
    if (emailLower === 'customer@servexa.demo' || targetRole === 'CUSTOMER') {
      matchedDemo = demoUsers.customer;
    } else if (emailLower === 'technician@servexa.demo' || targetRole === 'TECHNICIAN') {
      matchedDemo = demoUsers.technician;
    } else if (emailLower === 'admin@servexa.demo' || targetRole === 'ADMIN') {
      matchedDemo = demoUsers.admin;
    }

    if (matchedDemo) {
      await ensureServerSession(matchedDemo);
      setCurrentUser(matchedDemo);
      return { success: true, user: matchedDemo };
    }

    return {
      success: false,
      error: 'এই ইমেইল বা ফোন নম্বরে কোনো রেজিস্টার্ড একাউন্ট পাওয়া যায়নি। অনুগ্রহ করে আগে রেজিস্ট্রেশন করুন অথবা সঠিক ইমেইল দিন।'
    };
  };

  const register = async (userData: RegisterInput) => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPhone = userData.phone.trim();
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: userData.password,
      role: userData.role,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      division: '',
      district: '',
      city: userData.city || '',
      area: userData.area || '',
      address: '',
      phoneVerified: true,
      nidVerified: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const existing = loadRegisteredUsers().filter(
      u => u.email.toLowerCase() !== cleanEmail && u.phone.trim() !== cleanPhone
    );
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([newUser, ...existing]));

    const serverTechnicianId = await ensureServerSession(newUser);
    setCurrentUser(newUser);
    return { success: true, user: newUser, serverTechnicianId };
  };

  const logout = () => {
    sessionSeqRef.current += 1;
    setStoredAuthToken(null);
    setAuthTokenReady(false);
    setCurrentUser(null);
  };

  const quickDemoLogin = (role: UserRole) => {
    setAuthTokenReady(false);
    const next =
      role === 'CUSTOMER'
        ? demoUsers.customer
        : role === 'TECHNICIAN'
        ? demoUsers.technician
        : demoUsers.admin;
    setCurrentUser(next);
  };

  const switchDemoTechnician = (tech: Technician) => {
    setAuthTokenReady(false);
    const techUser: User = {
      id: tech.userId || demoUsers.technician.id,
      name: tech.name,
      email: tech.email || `${tech.id}@servexa.demo`,
      phone: tech.phone,
      role: 'TECHNICIAN',
      avatar: tech.avatar,
      division: tech.division || 'Dhaka',
      district: tech.district || tech.city || 'Dhaka',
      city: tech.city || 'Dhaka',
      area: tech.primaryArea || 'Mirpur',
      address: `${tech.primaryArea}, ${tech.district || tech.city}`,
      nidVerified: tech.nidVerified,
      phoneVerified: tech.phoneVerified,
      createdAt: '2025-11-10',
    };
    setCurrentUser(techUser);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (currentUser) {
      const nextUser = { ...currentUser, ...updatedData };
      setCurrentUser(nextUser);
      const registered = loadRegisteredUsers();
      if (registered.some(u => u.id === nextUser.id)) {
        const updatedList = registered.map(u => (u.id === nextUser.id ? nextUser : u));
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedList));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        authTokenReady,
        login,
        register,
        logout,
        quickDemoLogin,
        switchDemoTechnician,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
