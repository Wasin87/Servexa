import React from 'react';
import { Hero } from '../components/home/Hero';
import { EmergencyBanner } from '../components/home/EmergencyBanner';
import { PopularServices } from '../components/home/PopularServices';
import { ProblemWizardSection } from '../components/home/ProblemWizardSection';
import { HomeHeatmapSection } from '../components/home/HomeHeatmapSection';
import { HowItWorks } from '../components/home/HowItWorks';
import { FeaturedTechnicians } from '../components/home/FeaturedTechnicians';
import { BeforeAfterShowcase } from '../components/home/BeforeAfterShowcase';
import { TrustSafety } from '../components/home/TrustSafety';
import { CustomerReviews } from '../components/home/CustomerReviews';
import { FAQSection } from '../components/home/FAQSection';
import { CTASection } from '../components/home/CTASection';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-4">
      <Hero />
      <EmergencyBanner />
      <PopularServices />
      <ProblemWizardSection />
      <HomeHeatmapSection />
      <HowItWorks />
      <FeaturedTechnicians />
      <BeforeAfterShowcase />
      <TrustSafety />
      <CustomerReviews />
      <FAQSection />
      <CTASection />
    </div>
  );
};
