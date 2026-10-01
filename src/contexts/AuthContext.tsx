import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { demoUsers } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { name: string; email: string; phone: string; role: UserRole; city: string; area: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kormigo_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kormigo_user');
    }
  }, [currentUser]);

  const login = async (email: string, _password?: string, targetRole?: UserRole) => {
    // Check against demo accounts or existing registered accounts
    const emailLower = email.toLowerCase().trim();
    let matchedUser: User | undefined;

    if (emailLower.includes('customer') || targetRole === 'CUSTOMER') {
      matchedUser = demoUsers.customer;
    } else if (emailLower.includes('technician') || targetRole === 'TECHNICIAN') {
      matchedUser = demoUsers.technician;
    } else if (emailLower.includes('admin') || targetRole === 'ADMIN') {
      matchedUser = demoUsers.admin;
    } else {
      // Create user on the fly if new email
      matchedUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: emailLower,
        phone: '01700-000000',
        role: targetRole || 'CUSTOMER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        city: 'Dhaka',
        area: 'Dhanmondi',
        createdAt: new Date().toISOString()
      };
    }

    setCurrentUser(matchedUser);
    return { success: true };
  };

  const register = async (userData: { name: string; email: string; phone: string; role: UserRole; city: string; area: string }) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      city: userData.city,
      area: userData.area,
      phoneVerified: true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const quickDemoLogin = (role: UserRole) => {
    if (role === 'CUSTOMER') {
      setCurrentUser(demoUsers.customer);
    } else if (role === 'TECHNICIAN') {
      setCurrentUser(demoUsers.technician);
    } else if (role === 'ADMIN') {
      setCurrentUser(demoUsers.admin);
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updatedData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
        quickDemoLogin,
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
