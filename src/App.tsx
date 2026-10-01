/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';

// Layout
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';

// Pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import { ProfessionalDetailPage } from './pages/ProfessionalDetailPage';
import { SearchPage } from './pages/SearchPage';
import { BookPage } from './pages/BookPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SafetyPage } from './pages/SafetyPage';
import { BecomeProfessionalPage } from './pages/BecomeProfessionalPage';
import { HeatmapPage } from './pages/HeatmapPage';
import { MapPage } from './pages/MapPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { TechnicianDashboard } from './pages/TechnicianDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DashboardRouter } from './pages/DashboardRouter';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 selection:bg-orange-500 selection:text-white">
                <Navbar />
                <main className="flex-1 pb-16 lg:pb-0">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:id" element={<ServicesPage />} />
                    <Route path="/professionals" element={<ProfessionalsPage />} />
                    <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/book" element={<BookPage />} />
                    <Route path="/booking/:id" element={<BookingDetailPage />} />
                    <Route path="/emergency" element={<EmergencyPage />} />
                    <Route path="/heatmap" element={<HeatmapPage />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/safety" element={<SafetyPage />} />
                    <Route path="/become-professional" element={<BecomeProfessionalPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<DashboardRouter />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    <Route path="/customer/bookings" element={<CustomerDashboard />} />
                    <Route path="/customer/favorites" element={<CustomerDashboard />} />
                    <Route path="/customer/messages" element={<CustomerDashboard />} />
                    <Route path="/technician/dashboard" element={<TechnicianDashboard />} />
                    <Route path="/technician/jobs" element={<TechnicianDashboard />} />
                    <Route path="/technician/earnings" element={<TechnicianDashboard />} />
                    <Route path="/technician/messages" element={<TechnicianDashboard />} />
                    <Route path="/technician/portfolio" element={<TechnicianDashboard />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminDashboard />} />
                    <Route path="/admin/technicians" element={<AdminDashboard />} />
                    <Route path="/admin/bookings" element={<AdminDashboard />} />
                    <Route path="/admin/reports" element={<AdminDashboard />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
                <MobileNav />
              </div>
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
