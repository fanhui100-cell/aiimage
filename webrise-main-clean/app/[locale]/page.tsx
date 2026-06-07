import { HeroSection } from "./sections/hero-section";
import { PainPointsSection } from "./sections/pain-points-section";
import { SolutionSection } from "./sections/solution-section";
import { DemosSection } from "./sections/demos-section";
import { IndustriesSection } from "./sections/industries-section";
import { ProcessSection } from "./sections/process-section";
import { WhyUsSection } from "./sections/why-us-section";
import { PricingSection } from "./sections/pricing-section";
import { FaqSection } from "./sections/faq-section";
import { FooterCtaSection } from "./sections/footer-cta-section";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
      <DemosSection />
      <IndustriesSection />
      <ProcessSection />
      <WhyUsSection />
      <PricingSection />
      <FaqSection />
      <FooterCtaSection />
    </main>
  );
}
