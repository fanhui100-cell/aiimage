# Demo: TradeAxis Partners — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `apps/demo-consulting` — a premium B2B trade consulting firm website with service packages and case studies, demonstrating the "Professional Services Website" product.

**Architecture:** Standalone Next.js 15 App Router (port 3006). No i18n, no cart. Star features: service packages with pricing, and a case studies grid. Warm gold brand color — authoritative consulting aesthetic.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4 (OKLCH), Supabase SSR, TypeScript 5 with `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`

---

## File Structure

```
apps/demo-consulting/
├── package.json                    # @repo/demo-consulting, port 3006
├── tsconfig.json
├── next.config.ts
├── .env.example
├── app/
│   ├── globals.css                 # Warm gold OKLCH theme
│   ├── layout.tsx
│   ├── page.tsx                    # Home: hero, stats, services overview, case study teaser, team teaser, CTA
│   ├── services/
│   │   └── page.tsx                # 4 service packages with pricing + features list
│   ├── cases/
│   │   └── page.tsx                # Case studies grid (6 cards with outcomes)
│   ├── about/
│   │   └── page.tsx                # Company story + 3 team member profiles
│   └── contact/
│       ├── page.tsx
│       ├── contact-form.tsx
│       └── actions.ts
├── lib/
│   ├── data.ts                     # Services, case studies, team members, stats
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── components/
    ├── nav.tsx
    ├── footer.tsx
    └── whatsapp-button.tsx
```

---

### Task 1: Scaffold + Theme + Layout + Components

- [ ] **Step 1: package.json** — `@repo/demo-consulting`, port 3006

```json
{
  "name": "@repo/demo-consulting",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3006",
    "build": "next build",
    "start": "next start --port 3006",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json**

```json
{
  "extends": "@repo/config/typescript/base",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: next.config.ts**

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 5: app/globals.css** — warm gold theme

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.50 0.12 75);
  --color-primary-dark: oklch(0.40 0.12 75);
  --color-primary-light: oklch(0.95 0.05 75);
  --color-primary-foreground: oklch(0.15 0 0);
  --color-secondary: oklch(0.97 0.03 75);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.5 0 0);
  --color-border: oklch(0.9 0 0);
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Note: `--color-primary-foreground` is dark (not white) because the gold color is light enough that dark text reads better on it.

- [ ] **Step 6: app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: {
    template: "%s | TradeAxis Partners",
    default: "TradeAxis Partners — Export Strategy & Global Trade Consulting",
  },
  description:
    "End-to-end export consulting: market entry, compliance, digital presence, and buyer sourcing. We help Chinese manufacturers break into North American, European, and Southeast Asian markets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: lib/supabase/client.ts and server.ts** — identical pattern to demo-export

- [ ] **Step 8: components/nav.tsx**

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/cases", label: "Case Studies" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground">TA</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">TradeAxis</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.slice(0, 3).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">{l.label}</Link>
          ))}
          <Link href="/contact" className="ml-2 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-dark transition-colors">
            Book a Call
          </Link>
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 9: components/footer.tsx** — dark footer, TradeAxis Partners branding, Shanghai address

```tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">TA</span>
            <span className="font-bold text-white">TradeAxis Partners</span>
          </div>
          <p className="text-sm text-gray-400">Export strategy and trade consulting for Chinese manufacturers entering global markets.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Services</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {["Market Entry Assessment", "Compliance & Certification", "Export Website Build", "Buyer Sourcing & Outreach", "Trade Show Support", "Ongoing Trade Advisor"].map(s => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Shanghai, China</li>
            <li>📧 hello@tradeaxispartners.com</li>
            <li>📞 +86 21 0000 0000</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-6 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
        <span>© 2025 TradeAxis Partners Consulting Ltd.</span>
        <span>Offices in Shanghai · Guangzhou · Frankfurt</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: components/whatsapp-button.tsx** — identical pattern, phone 8613800000003

- [ ] **Step 11: Install and commit**

```bash
pnpm install
git add apps/demo-consulting/
git commit -m "feat(demo-consulting): scaffold, theme, layout, nav, footer"
```

---

### Task 2: Data + Homepage

- [ ] **Step 1: lib/data.ts**

```ts
export type Service = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  duration: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

export type CaseStudy = {
  id: string;
  client: string;
  industry: string;
  market: string;
  challenge: string;
  solution: string;
  outcomes: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
};

export const SERVICES: Service[] = [
  {
    id: "assessment",
    name: "Market Entry Assessment",
    tagline: "Is your product ready for export?",
    price: "¥8,800",
    priceNote: "one-time",
    duration: "2 weeks",
    description: "A deep-dive analysis of your product's export potential: target market sizing, competitive landscape, buyer personas, pricing benchmarks, and a go-to-market roadmap.",
    features: [
      "3 target market analysis (USA / EU / SEA)",
      "Competitive product benchmarking",
      "Buyer persona profiles",
      "Pricing & margin analysis",
      "Go-to-market roadmap (12-month)",
      "30-min strategy call with senior advisor",
    ],
  },
  {
    id: "compliance",
    name: "Compliance & Certification",
    tagline: "Get the certs that open doors",
    price: "¥15,000",
    priceNote: "from",
    duration: "4–12 weeks",
    description: "We identify which certifications (CE, FCC, UL, FDA, REACH, RoHS) your product needs and manage the entire application process with accredited labs.",
    features: [
      "Certification gap analysis",
      "Lab selection & coordination",
      "Document preparation & submission",
      "CE / FCC / UL / FDA managed",
      "Test report interpretation",
      "Re-certification support for product updates",
    ],
  },
  {
    id: "website",
    name: "Export Website Build",
    tagline: "Your 24/7 English salesperson",
    price: "¥28,000",
    priceNote: "from",
    duration: "3–4 weeks",
    highlight: true,
    description: "A professional English-language product website optimized for Google search, with an inquiry form, product catalog, and WhatsApp integration — built to generate leads while you sleep.",
    features: [
      "Custom design (not a template)",
      "Full English copywriting",
      "Product catalog with photos",
      "Google-optimized (SEO)",
      "Inquiry form + WhatsApp CTA",
      "Mobile-first responsive design",
      "3 months post-launch support",
    ],
  },
  {
    id: "buyer-sourcing",
    name: "Buyer Sourcing & Outreach",
    tagline: "Find real buyers, not just traffic",
    price: "¥6,800",
    priceNote: "per month",
    duration: "3-month min.",
    description: "We identify, qualify, and reach out to potential distributors, importers, and direct buyers in your target market using LinkedIn, trade directories, and industry databases.",
    features: [
      "50 qualified buyer contacts per month",
      "LinkedIn & email outreach",
      "Personalized pitch deck",
      "Weekly progress reports",
      "Intro call preparation",
      "CRM tracking spreadsheet",
    ],
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "c1",
    client: "Shenzhen Metal Parts Manufacturer",
    industry: "Precision CNC Machining",
    market: "Germany & Poland",
    challenge: "No English website, zero online presence. Relied entirely on Alibaba. Margins shrinking due to platform fees.",
    solution: "Built a professional German/English product website with technical specs, CE documentation, and direct inquiry form. Ran targeted LinkedIn outreach to Tier-2 automotive suppliers.",
    outcomes: ["First direct European buyer within 6 weeks", "3 long-term OEM contracts signed in Year 1", "Alibaba dependency reduced by 60%", "Average order value 2.4× higher than before"],
  },
  {
    id: "c2",
    client: "Dongguan Packaging Factory",
    industry: "Custom Packaging",
    market: "USA & Canada",
    challenge: "Strong production capacity but unknown to North American brands. Had FCC/CE but no FDA food-contact certification.",
    solution: "Managed FDA food-contact certification process. Redesigned English product catalog. Sourced 12 qualified US e-commerce brand contacts per month.",
    outcomes: ["FDA certification obtained in 10 weeks", "2 US retail brand partnerships", "Monthly inquiry volume up 8×", "Revenue from US market: ¥2.3M in first year"],
  },
  {
    id: "c3",
    client: "Guangdong LED Lighting OEM",
    industry: "LED Lighting",
    market: "Australia & New Zealand",
    challenge: "Products met Australian standards but lacked SAA certification documentation. No local distributor relationships.",
    solution: "Coordinated SAA certification with accredited lab. Built English product catalog website. Represented client at Sydney trade show.",
    outcomes: ["SAA certification in 8 weeks", "Distributor agreement with Sydney-based importer", "Trade show ROI: 6 leads → 2 contracts", "AUD 180,000 first order"],
  },
  {
    id: "c4",
    client: "Zhejiang Hardware Manufacturer",
    industry: "Construction Hardware",
    market: "UK & Ireland",
    challenge: "Post-Brexit compliance confusion. Product failed UK UKCA assessment. No understanding of B2B buying process in UK.",
    solution: "Completed UKCA marking process. Briefed client on UK procurement cycles. Connected with 3 UK builders' merchant chains.",
    outcomes: ["UKCA marking achieved", "Listed in 2 national hardware chains", "First B2B order: £65,000", "Ongoing account management established"],
  },
  {
    id: "c5",
    client: "Fujian Tea Exporter",
    industry: "Agricultural Products",
    market: "UAE & Saudi Arabia",
    challenge: "Premium oolong tea with no halal certification and no foothold in GCC market. Language and culture barrier.",
    solution: "Obtained halal certification. Designed bilingual Arabic/English brand packaging. Identified specialty tea importers in Dubai.",
    outcomes: ["Halal certification in 6 weeks", "Exclusive GCC distributor signed", "Listed in 3 Dubai specialty retailers", "Export volume tripled in 18 months"],
  },
  {
    id: "c6",
    client: "Jiangsu Electronic Components",
    industry: "Electronic Components",
    market: "Southeast Asia (Vietnam, Thailand)",
    challenge: "Wanted to reduce US/EU dependence. No contacts or market knowledge in SEA manufacturing sector.",
    solution: "Market assessment of Vietnam and Thailand electronics manufacturing clusters. Facilitated B2B introductions at Vietnam Manufacturing Expo.",
    outcomes: ["Market assessment delivered in 2 weeks", "8 qualified factory introductions", "2 distribution agreements signed", "SEA now 25% of revenue"],
  },
];

export const TEAM: TeamMember[] = [
  {
    id: "t1",
    name: "Michael Chen",
    title: "Founding Partner & CEO",
    bio: "15 years in cross-border trade. Former Head of Export at a Fortune 500 manufacturing group. MBA from CEIBS. Fluent in Mandarin, English, and German.",
    expertise: ["Export Strategy", "EU Market Entry", "M&A Advisory", "B2B Sales"],
  },
  {
    id: "t2",
    name: "Sarah Williams",
    title: "Head of Compliance & Certification",
    bio: "Former regulatory affairs manager at Bureau Veritas. Specialist in CE, FCC, UL, FDA, and UKCA. Has managed 200+ product certifications across 30 product categories.",
    expertise: ["CE / FCC / UL / FDA", "REACH & RoHS", "Product Testing", "Documentation"],
  },
  {
    id: "t3",
    name: "James Liu",
    title: "Digital Strategy Director",
    bio: "10 years building export-focused digital marketing for Chinese manufacturers. Led SEO and lead generation campaigns generating $50M+ in traceable export revenue.",
    expertise: ["Export SEO", "Google Ads", "LinkedIn Outreach", "Web Analytics"],
  },
];

export const STATS = [
  { value: "200+", label: "Clients Served" },
  { value: "35+", label: "Markets Entered" },
  { value: "¥500M+", label: "Export Revenue Generated" },
  { value: "12", label: "Years in Business" },
];

export const INDUSTRIES_SERVED = [
  "Manufacturing & Hardware", "Electronics & Components", "Packaging & Print",
  "Agricultural Products", "Medical Devices", "Consumer Goods",
];
```

- [ ] **Step 2: app/page.tsx** — Homepage

Sections:
1. **Hero** — Dark navy-gray (`bg-gray-900`) with a diagonal gold accent line, headline "Your Export Growth Partner", subheadline about helping Chinese manufacturers break into Western markets, CTAs: "Book a Free Call" (→/contact) + "View Case Studies" (→/cases)
2. **Stats Bar** — 4 stats from STATS (light bg)
3. **Services Overview** — 4 service teaser cards (name + tagline + price + "Learn More" → /services). Minimal, clean, with gold accent on hover.
4. **Case Study Teaser** — Show 3 case study cards from CASE_STUDIES with client, market flag emoji, one key outcome. "View All Case Studies →" link.
5. **Industries Served** — Horizontal chip list of INDUSTRIES_SERVED
6. **Trust Section** — "Why work with us" with 3 points: Bilingual team, End-to-end service, No success = no fee guarantee
7. **Footer CTA** — Dark section: "Ready to Break Into New Markets?" with Book a Call button

```tsx
import Link from "next/link";
import { STATS, SERVICES, CASE_STUDIES, INDUSTRIES_SERVED } from "@/lib/data";

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gray-900 py-28 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10"
          style={{ background: "linear-gradient(135deg, transparent 50%, oklch(0.50 0.12 75) 50%)" }} />
        <div className="relative max-w-5xl mx-auto">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-widest border border-primary/30">
            Export Strategy · Compliance · Digital Presence
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight max-w-3xl">
            Your Export<br />Growth Partner
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mb-10">
            We help Chinese manufacturers enter North American, European, and Southeast Asian markets — with strategy, certifications, digital presence, and direct buyer introductions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 font-semibold bg-primary text-primary-foreground hover:bg-primary-dark transition-colors shadow-lg">
              Book a Free Consultation →
            </Link>
            <Link href="/cases" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-colors">
              View Case Studies
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary-light border-y border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Our Services</span>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">End-to-End Export Support</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From initial market assessment to ongoing buyer relationships — we handle every stage of your export journey.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SERVICES.map((svc) => (
              <div key={svc.id} className={`rounded-2xl border-2 p-7 transition-all hover:shadow-md ${svc.highlight ? "border-primary bg-primary-light" : "border-gray-100 bg-white"}`}>
                {svc.highlight && <span className="inline-block px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-3">Most Popular</span>}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{svc.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{svc.tagline}</p>
                <p className="text-sm text-gray-500 mb-4">{svc.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-gray-900">{svc.price}</span>
                    <span className="text-xs text-gray-400 ml-1">{svc.priceNote}</span>
                  </div>
                  <Link href="/services" className="rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-dark transition-colors">
                    Learn More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case study teaser */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Results</span>
              <h2 className="text-3xl font-bold text-gray-900">Real Clients. Real Outcomes.</h2>
            </div>
            <Link href="/cases" className="hidden sm:inline-flex text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CASE_STUDIES.slice(0, 3).map((cs) => (
              <div key={cs.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cs.industry} · {cs.market}</div>
                <h3 className="font-bold text-gray-900 mb-3">{cs.client}</h3>
                <div className="space-y-1.5">
                  {cs.outcomes.slice(0, 2).map((o) => (
                    <div key={o} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link href="/cases" className="text-sm font-semibold text-primary">View All Case Studies →</Link>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-14 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">Industries We Serve</p>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES_SERVED.map((ind) => (
              <span key={ind} className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-gray-50">{ind}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Break Into New Markets?</h2>
          <p className="text-gray-300 mb-8">Book a free 30-minute consultation. We'll assess your export readiness and outline a concrete first step — at no charge.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg px-8 py-4 font-semibold bg-primary text-primary-foreground hover:bg-primary-dark transition-colors shadow-lg">
            Book a Free Consultation →
          </Link>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/demo-consulting/lib/data.ts apps/demo-consulting/app/page.tsx
git commit -m "feat(demo-consulting): data, homepage"
```

---

### Task 3: Services + Case Studies + About Pages

- [ ] **Step 1: app/services/page.tsx** — Full service packages with feature lists

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SERVICES } from "@/lib/data";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Services & Pricing</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What We Do</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Choose the service that matches your current export stage, or combine multiple for a full-stack approach.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map((svc) => (
            <div key={svc.id} className={`rounded-2xl border-2 p-8 flex flex-col ${svc.highlight ? "border-primary" : "border-gray-100"} bg-white shadow-sm`}>
              {svc.highlight && (
                <span className="inline-block self-start px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-4">Most Popular</span>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{svc.name}</h2>
              <p className="text-primary font-medium text-sm mb-3">{svc.tagline}</p>
              <p className="text-sm text-gray-500 mb-5 flex-1">{svc.description}</p>
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">What's Included</div>
                <ul className="space-y-2">
                  {svc.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-primary mt-0.5 flex-shrink-0 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{svc.price}</div>
                  <div className="text-xs text-gray-400">{svc.priceNote} · {svc.duration}</div>
                </div>
                <Link href="/contact" className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-dark transition-colors">
                  Get Started →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Not sure which package is right for you?</h3>
          <p className="text-gray-500 mb-5">Book a free 30-minute consultation and we'll recommend the right starting point based on your current export stage.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold bg-primary text-primary-foreground hover:bg-primary-dark transition-colors">
            Book a Free Call →
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: app/cases/page.tsx** — Case studies grid

All 6 case studies as cards. Each shows: client + industry + market, challenge (1–2 sentences), solution (1–2 sentences), outcomes as checkmark list.

```tsx
import type { Metadata } from "next";
import { CASE_STUDIES } from "@/lib/data";

export const metadata: Metadata = { title: "Case Studies" };

export default function CasesPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Case Studies</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Real Results for Real Manufacturers</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From first export to multi-million RMB revenue — here's how we've helped manufacturers like you break into global markets.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CASE_STUDIES.map((cs) => (
            <div key={cs.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold">{cs.industry}</span>
                <span className="text-sm text-gray-400">{cs.market}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{cs.client}</h2>
              <div className="space-y-3 mb-5">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Challenge</div>
                  <p className="text-sm text-gray-600">{cs.challenge}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Solution</div>
                  <p className="text-sm text-gray-600">{cs.solution}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Outcomes</div>
                <ul className="space-y-1.5">
                  {cs.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-primary font-bold flex-shrink-0 mt-0.5">✓</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: app/about/page.tsx** — Company story + team

```tsx
import type { Metadata } from "next";
import { TEAM, STATS } from "@/lib/data";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Company story */}
        <div className="max-w-3xl mb-16">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Our Story</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Built by Exporters, for Exporters</h1>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>TradeAxis Partners was founded in 2013 by a team of trade professionals who had spent years helping Chinese manufacturers navigate the complexity of selling overseas — and grew frustrated by how fragmented and opaque the process was.</p>
            <p>We believe that a well-made product from a Chinese factory deserves the same global market access as its Western counterpart. The barrier is rarely the product. It's the language, the certifications, the digital presence, and the buyer relationships.</p>
            <p>Today, our bilingual team of 18 specialists operates from Shanghai, Guangzhou, and Frankfurt — combining deep China manufacturing knowledge with direct buyer networks in 35+ markets.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-16">
          {STATS.map((s) => (
            <div key={s.label} className="bg-primary-light rounded-2xl p-5 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-xl">
                    {member.name.split(" ").map(n => n[0]!).join("")}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-0.5">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{member.title}</p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{member.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.expertise.map((e) => (
                    <span key={e} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/demo-consulting/app/services/ apps/demo-consulting/app/cases/ apps/demo-consulting/app/about/
git commit -m "feat(demo-consulting): services, case studies, about pages"
```

---

### Task 4: Contact Form + Build Verification

- [ ] **Step 1: app/contact/actions.ts**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";

export type ContactState = { success?: boolean; error?: string };

export async function submitContact(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const company = formData.get("company");
  const country = formData.get("country");
  const service = formData.get("service");
  const message = formData.get("message");

  if (!name || typeof name !== "string" || name.trim().length < 2) return { error: "Please enter your name." };
  if (!email || typeof email !== "string" || !email.includes("@")) return { error: "Please enter a valid email." };
  if (!message || typeof message !== "string" || message.trim().length < 10) return { error: "Please describe your situation." };

  const fullMessage = [service ? `Service Interest: ${service}` : null, `\n${message}`].filter(Boolean).join("\n");

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name: String(name).trim(),
    company: company ? String(company).trim() : null,
    contact: String(email).trim(),
    message: fullMessage,
    locale: "demo-consulting",
  });

  if (error) return { error: "Submission failed. Please try again." };
  return { success: true };
}
```

- [ ] **Step 2: app/contact/contact-form.tsx**

Standard contact form with: name*, company, email*, country, service interest dropdown (from SERVICES names), current export status (dropdown: "Not yet exporting / Occasional orders / Regular exports / Looking to expand"), message* (placeholder: "Tell us about your product, target market, and main challenge"). Success state with checkmark circle.

```tsx
"use client";
import { useActionState } from "react";
import { submitContact, type ContactState } from "./actions";

const initialState: ContactState = {};

const SERVICES_LIST = ["Market Entry Assessment", "Compliance & Certification", "Export Website Build", "Buyer Sourcing & Outreach", "Multiple Services", "Not Sure Yet"];
const EXPORT_STATUS = ["Not yet exporting", "Occasional export orders", "Regular export operations", "Looking to expand existing export business"];

export function ContactForm() {
  const [state, action, isPending] = useActionState(submitContact, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-10 h-10 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Consultation Booked!</h2>
        <p className="text-gray-500 max-w-md">Our team will reach out within 4 business hours to schedule your free 30-minute call.</p>
      </div>
    );
  }

  const fieldClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <form action={action} className="space-y-5">
      {state.error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{state.error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelClass}>Name <span className="text-red-400">*</span></label><input name="name" type="text" required placeholder="Li Wei" className={fieldClass} /></div>
        <div><label className={labelClass}>Company</label><input name="company" type="text" placeholder="Shenzhen XYZ Manufacturing" className={fieldClass} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={labelClass}>Email <span className="text-red-400">*</span></label><input name="email" type="email" required placeholder="liwei@factory.com" className={fieldClass} /></div>
        <div><label className={labelClass}>Country</label><input name="country" type="text" placeholder="China" className={fieldClass} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Service Interest</label>
          <select name="service" className={fieldClass}>
            <option value="">Select a service</option>
            {SERVICES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Current Export Status</label>
          <select name="exportStatus" className={fieldClass}>
            <option value="">Select status</option>
            {EXPORT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Your Situation <span className="text-red-400">*</span></label>
        <textarea name="message" required rows={4} placeholder="Tell us about your product, the markets you want to enter, and your main challenge right now..." className={`${fieldClass} resize-none`} />
      </div>
      <div className="pt-2">
        <button type="submit" disabled={isPending} className="w-full rounded-xl px-6 py-3.5 font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary-dark transition-colors disabled:opacity-40">
          {isPending ? "Submitting…" : "Book My Free Consultation →"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">We respond within 4 business hours · No spam, ever</p>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: app/contact/page.tsx**

```tsx
import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Book a Consultation" };

export default function ContactPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Free Consultation</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Book a Free 30-Minute Call</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Tell us about your product and export goals. We'll assess your readiness and recommend a concrete first step — at no charge.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <aside className="lg:col-span-2">
            <div className="bg-gray-900 rounded-2xl p-7 text-white h-fit">
              <h2 className="font-bold text-lg mb-5">What to Expect</h2>
              <div className="space-y-4 text-sm">
                {[
                  { step: "01", title: "Submit this form", desc: "Tell us about your product and goals." },
                  { step: "02", title: "We reach out", desc: "Within 4 business hours to schedule your call." },
                  { step: "03", title: "30-min call", desc: "With a senior advisor — in English or Mandarin." },
                  { step: "04", title: "Receive your plan", desc: "A concrete first-step recommendation at no charge." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="text-primary font-bold text-sm flex-shrink-0 mt-0.5">{item.step}</span>
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-gray-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 space-y-1 text-xs text-gray-400">
                <div>✓ No obligation · Free of charge</div>
                <div>✓ English & Mandarin consultants</div>
                <div>✓ Offices in Shanghai, Guangzhou, Frankfurt</div>
              </div>
            </div>
          </aside>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="border-l-4 border-primary pl-4 text-lg font-bold text-gray-900 mb-6">Your Information</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter @repo/demo-consulting build`
Expected: Exit 0, routes `/`, `/services`, `/cases`, `/about`, `/contact` all present.

- [ ] **Step 5: Final commit**

```bash
git add apps/demo-consulting/app/contact/
git commit -m "feat(demo-consulting): contact form — demo complete"
```
