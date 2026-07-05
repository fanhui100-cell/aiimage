# Demo: Vertex Precision Engineering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/demo-engineering` — a premium CNC precision machined parts manufacturer website demonstrating the "Engineering Company Website" product for the service-website monorepo.

**Architecture:** Standalone Next.js 15 App Router app (port 3003) following the exact same pattern as `apps/demo-export`. No i18n, no inquiry cart — direct RFQ contact form. Steel blue-gray brand color.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4 (OKLCH theme), Supabase SSR, TypeScript 5 with `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`

---

## File Structure

```
apps/demo-engineering/
├── package.json                          # @repo/demo-engineering, port 3003
├── tsconfig.json                         # extends @repo/config/typescript/base
├── next.config.ts                        # empty default
├── .env.example                          # NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
├── app/
│   ├── globals.css                       # Tailwind 4 + steel blue OKLCH theme
│   ├── layout.tsx                        # Nav + Footer + WhatsApp, metadata
│   ├── page.tsx                          # Homepage (hero, stats, capabilities cards, materials, certs, CTA)
│   ├── capabilities/
│   │   └── page.tsx                      # CNC milling/turning/grinding/EDM + tolerance table
│   ├── materials/
│   │   └── page.tsx                      # Material options with properties table
│   ├── quality/
│   │   └── page.tsx                      # ISO certifications, inspection equipment, QC process
│   └── contact/
│       ├── page.tsx                      # RFQ page wrapper
│       ├── rfq-form.tsx                  # Client component: RFQ form with useActionState
│       └── actions.ts                    # Server action: validate + insert to Supabase
├── lib/
│   ├── data.ts                           # Mock capabilities, materials, certifications data
│   ├── supabase/
│   │   ├── client.ts                     # createBrowserClient
│   │   └── server.ts                     # createServerClient with cookies
└── components/
    ├── nav.tsx                           # Sticky nav: Vertex Precision logo + 4 nav links + RFQ button
    ├── footer.tsx                        # Dark footer with company info
    └── whatsapp-button.tsx               # Fixed floating WhatsApp CTA
```

---

### Task 1: App Scaffold

**Files:**
- Create: `apps/demo-engineering/package.json`
- Create: `apps/demo-engineering/tsconfig.json`
- Create: `apps/demo-engineering/next.config.ts`
- Create: `apps/demo-engineering/.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@repo/demo-engineering",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3003",
    "build": "next build",
    "start": "next start --port 3003",
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

- [ ] **Step 2: Create tsconfig.json**

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

- [ ] **Step 3: Create next.config.ts**

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create .env.example**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 5: Install dependencies**

Run from monorepo root: `pnpm install`

- [ ] **Step 6: Commit**

```bash
git add apps/demo-engineering/package.json apps/demo-engineering/tsconfig.json apps/demo-engineering/next.config.ts apps/demo-engineering/.env.example
git commit -m "feat(demo-engineering): scaffold Next.js app"
```

---

### Task 2: Theme, Layout, and Supabase Clients

**Files:**
- Create: `apps/demo-engineering/app/globals.css`
- Create: `apps/demo-engineering/app/layout.tsx`
- Create: `apps/demo-engineering/lib/supabase/client.ts`
- Create: `apps/demo-engineering/lib/supabase/server.ts`

- [ ] **Step 1: Create globals.css** (steel blue-gray theme)

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.38 0.10 222);
  --color-primary-dark: oklch(0.28 0.10 222);
  --color-primary-light: oklch(0.92 0.04 222);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.96 0.02 222);
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

- [ ] **Step 2: Create app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: {
    template: "%s | Vertex Precision",
    default: "Vertex Precision — CNC Machined Parts Manufacturer & Exporter",
  },
  description:
    "OEM/ODM manufacturer of precision CNC machined components. Tolerances to ±0.005mm. ISO 9001:2015 & IATF 16949 certified. Export to 60+ countries.",
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

- [ ] **Step 3: Create lib/supabase/client.ts**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Create lib/supabase/server.ts**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/demo-engineering/app/globals.css apps/demo-engineering/app/layout.tsx apps/demo-engineering/lib/
git commit -m "feat(demo-engineering): theme, layout, supabase clients"
```

---

### Task 3: Nav, Footer, and WhatsApp Components

**Files:**
- Create: `apps/demo-engineering/components/nav.tsx`
- Create: `apps/demo-engineering/components/footer.tsx`
- Create: `apps/demo-engineering/components/whatsapp-button.tsx`

- [ ] **Step 1: Create components/nav.tsx**

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/materials", label: "Materials" },
  { href: "/quality", label: "Quality" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm">VP</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Vertex Precision</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.slice(0, 3).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-2 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Request a Quote
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
            <Link key={l.href} href={l.href} className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create components/footer.tsx**

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">VP</span>
            <span className="font-bold text-white">Vertex Precision</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            Precision CNC machined components for global OEMs. ISO 9001:2015 & IATF 16949 certified.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Services</h4>
          <ul className="space-y-2 text-sm">
            {["CNC Milling", "CNC Turning", "Grinding", "EDM & Wire-Cut", "Surface Treatment"].map((s) => (
              <li key={s} className="text-gray-400">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Shenzhen, Guangdong, China</li>
            <li>📧 rfq@vertexprecision.com</li>
            <li>📞 +86 755 0000 0000</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-6 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
        <span>© 2025 Vertex Precision Engineering Co., Ltd.</span>
        <span>ISO 9001:2015 · IATF 16949 · Export License No. 44XXXXXXX</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create components/whatsapp-button.tsx**

```tsx
export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/8613800000000?text=Hello%2C%20I%27d%20like%20to%20request%20a%20quote%20for%20CNC%20machined%20parts."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      aria-label="WhatsApp"
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </a>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/demo-engineering/components/
git commit -m "feat(demo-engineering): nav, footer, whatsapp components"
```

---

### Task 4: Mock Data

**Files:**
- Create: `apps/demo-engineering/lib/data.ts`

- [ ] **Step 1: Create lib/data.ts**

```ts
export type Capability = {
  id: string;
  name: string;
  description: string;
  tolerances: string;
  maxSize: string;
  materials: string[];
  icon: string;
};

export type Material = {
  id: string;
  name: string;
  grade: string;
  density: string;
  tensileStrength: string;
  hardness: string;
  applications: string[];
  finishes: string[];
};

export type Certification = {
  name: string;
  body: string;
  scope: string;
  validUntil: string;
};

export const CAPABILITIES: Capability[] = [
  {
    id: "milling",
    name: "CNC Milling",
    description: "3-axis, 4-axis, and 5-axis simultaneous milling for complex geometries and tight tolerances.",
    tolerances: "±0.005mm",
    maxSize: "800 × 500 × 400 mm",
    materials: ["Aluminum", "Steel", "Titanium", "Brass", "PEEK"],
    icon: "⚙️",
  },
  {
    id: "turning",
    name: "CNC Turning",
    description: "High-speed CNC turning with live tooling for shafts, bushings, and rotational parts.",
    tolerances: "±0.003mm",
    maxSize: "Ø 400mm × 1000mm",
    materials: ["Aluminum", "Stainless Steel", "Copper", "Titanium", "Nylon"],
    icon: "🔩",
  },
  {
    id: "grinding",
    name: "Surface & Cylindrical Grinding",
    description: "Precision grinding for mirror finishes and ultra-tight dimensional accuracy.",
    tolerances: "±0.001mm",
    maxSize: "600 × 300mm",
    materials: ["Hardened Steel", "Tool Steel", "Carbide"],
    icon: "✨",
  },
  {
    id: "edm",
    name: "EDM & Wire-Cut",
    description: "Electrical discharge machining for hardened materials, intricate features, and molds.",
    tolerances: "±0.002mm",
    maxSize: "500 × 400 × 300mm",
    materials: ["Hardened Steel", "Tungsten Carbide", "Titanium"],
    icon: "⚡",
  },
];

export const MATERIALS: Material[] = [
  {
    id: "aluminum",
    name: "Aluminum Alloys",
    grade: "6061-T6 / 7075-T6 / 2024-T3",
    density: "2.7 g/cm³",
    tensileStrength: "276–572 MPa",
    hardness: "60–87 HRB",
    applications: ["Aerospace frames", "Automotive parts", "Electronics housings", "Optical mounts"],
    finishes: ["Anodize Type II/III", "Chromate", "Powder coat", "Bead blast"],
  },
  {
    id: "stainless",
    name: "Stainless Steel",
    grade: "303 / 304 / 316L / 17-4 PH",
    density: "7.93 g/cm³",
    tensileStrength: "480–1310 MPa",
    hardness: "70–38 HRC",
    applications: ["Medical devices", "Food equipment", "Marine components", "Chemical fittings"],
    finishes: ["Passivation", "Electropolish", "PVD coating", "Brushed"],
  },
  {
    id: "titanium",
    name: "Titanium",
    grade: "Grade 2 / Grade 5 (Ti-6Al-4V)",
    density: "4.5 g/cm³",
    tensileStrength: "340–1170 MPa",
    hardness: "70–36 HRC",
    applications: ["Aerospace", "Medical implants", "Sports equipment", "Defense"],
    finishes: ["Anodize", "PVD", "Passivation", "As-machined"],
  },
  {
    id: "brass",
    name: "Brass & Copper",
    grade: "C360 / C101 / C110",
    density: "8.5 g/cm³",
    tensileStrength: "340–540 MPa",
    hardness: "55–80 HRB",
    applications: ["Electrical connectors", "Plumbing fittings", "RF components", "Decorative parts"],
    finishes: ["Electroplate", "Tin plate", "Silver plate", "Passivation"],
  },
  {
    id: "steel",
    name: "Carbon & Tool Steel",
    grade: "1018 / 1045 / 4140 / H13 / D2",
    density: "7.85 g/cm³",
    tensileStrength: "400–2100 MPa",
    hardness: "20–62 HRC",
    applications: ["Machine components", "Gears", "Molds & dies", "Shafts"],
    finishes: ["Black oxide", "Zinc plate", "Nitriding", "QPQ"],
  },
  {
    id: "peek",
    name: "Engineering Plastics",
    grade: "PEEK / Delrin / PTFE / Nylon PA66",
    density: "1.3–1.4 g/cm³",
    tensileStrength: "50–100 MPa",
    hardness: "Shore D 75–90",
    applications: ["Bushings", "Insulators", "Semiconductor parts", "Chemical resistance"],
    finishes: ["As-machined", "Polished"],
  },
];

export const CERTIFICATIONS: Certification[] = [
  { name: "ISO 9001:2015", body: "Bureau Veritas", scope: "Design, manufacture and supply of precision CNC machined components", validUntil: "2026-11" },
  { name: "IATF 16949:2016", body: "TÜV SÜD", scope: "Automotive supply chain quality management", validUntil: "2026-08" },
  { name: "AS9100D", body: "DNV GL", scope: "Aerospace quality management system", validUntil: "2025-12" },
  { name: "ISO 14001:2015", body: "Bureau Veritas", scope: "Environmental management system", validUntil: "2026-11" },
];

export const STATS = [
  { value: "15+", label: "Years Experience" },
  { value: "±0.003mm", label: "Standard Tolerance" },
  { value: "5,000+", label: "Active SKUs" },
  { value: "60+", label: "Countries Served" },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-engineering/lib/data.ts
git commit -m "feat(demo-engineering): mock capabilities, materials, certifications data"
```

---

### Task 5: Homepage

**Files:**
- Create: `apps/demo-engineering/app/page.tsx`

- [ ] **Step 1: Create app/page.tsx**

Build a stunning industrial homepage with these sections:

1. **Hero** — Full-width dark banner (bg-gray-900 with subtle grid pattern), white headline "Precision CNC Machined Components", subheadline mentioning ISO/IATF certs and 60+ countries, two CTAs: "Request a Quote" (primary button) + "View Capabilities" (outline)

2. **Stats Bar** — 4-column light gray bar showing STATS data (years, tolerance, SKUs, countries)

3. **Capabilities Overview** — Clean 2×2 grid of capability cards (from CAPABILITIES data): icon + name + description + key tolerance badge. Section title "Manufacturing Capabilities".

4. **Materials** — Horizontal scroll or 3-column grid showing 6 material categories with a colored icon/badge. Link to `/materials` page.

5. **Quality & Certifications** — Show 4 certification badges (ISO 9001, IATF 16949, AS9100D, ISO 14001) in a horizontal row with body/validity info. "Quality is non-negotiable" section with 3 trust points.

6. **Process** — 4-step timeline: Upload Drawing → DFM Review → Machining → Inspection & Ship. Horizontal steps with numbered circles.

7. **Footer CTA** — Dark section: "Ready to Source Precision Parts?" headline with "Request a Quote" button and WhatsApp contact.

Design notes:
- Use `var(--color-primary)` for accents, badges, buttons
- Heavy use of `bg-gray-50`, `border border-gray-100`, `rounded-xl shadow-sm` for cards
- Font: system-ui, tight tracking for technical look
- Mobile responsive — all grids go to 1 column on mobile

Full code example for the hero section:
```tsx
<section className="relative bg-gray-900 py-24 px-4 overflow-hidden">
  {/* Subtle grid overlay */}
  <div className="absolute inset-0 opacity-10" style={{backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px"}} />
  <div className="relative max-w-5xl mx-auto text-center">
    <span className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/20 text-primary-light text-xs font-semibold uppercase tracking-widest border border-primary/30">
      ISO 9001:2015 · IATF 16949 Certified
    </span>
    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
      Precision CNC Machined<br />Components
    </h1>
    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
      OEM/ODM manufacturer specializing in tight-tolerance parts for aerospace, automotive, medical, and industrial applications. Tolerances to ±0.003mm. Export to 60+ countries.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg">
        Request a Quote →
      </a>
      <a href="/capabilities" className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-colors">
        View Capabilities
      </a>
    </div>
  </div>
</section>
```

Complete the remaining sections following the same pattern. Import `CAPABILITIES`, `MATERIALS`, `CERTIFICATIONS`, `STATS` from `@/lib/data`.

- [ ] **Step 2: Commit**

```bash
git add apps/demo-engineering/app/page.tsx
git commit -m "feat(demo-engineering): homepage with hero, stats, capabilities, certs"
```

---

### Task 6: Capabilities, Materials, Quality Pages

**Files:**
- Create: `apps/demo-engineering/app/capabilities/page.tsx`
- Create: `apps/demo-engineering/app/materials/page.tsx`
- Create: `apps/demo-engineering/app/quality/page.tsx`

- [ ] **Step 1: Create app/capabilities/page.tsx**

```tsx
import type { Metadata } from "next";
import { CAPABILITIES } from "@/lib/data";

export const metadata: Metadata = { title: "Capabilities" };

export default function CapabilitiesPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Manufacturing Capabilities
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What We Can Make</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From prototype to high-volume production, our facility handles CNC milling, turning, grinding, and EDM with in-house inspection and finishing.
          </p>
        </div>

        {/* Capability cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {CAPABILITIES.map((cap) => (
            <div key={cap.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="text-3xl mb-4">{cap.icon}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{cap.name}</h2>
              <p className="text-gray-500 text-sm mb-6">{cap.description}</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tolerance</span>
                  <span className="text-sm font-bold text-primary">{cap.tolerances}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Max Size</span>
                  <span className="text-sm font-medium text-gray-700">{cap.maxSize}</span>
                </div>
                <div className="pt-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Materials</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cap.materials.map((m) => (
                      <span key={m} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tolerance comparison table */}
        <div className="bg-gray-900 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-6">Standard Tolerance Guide</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-6">Process</th>
                  <th className="text-left py-2 pr-6">Standard</th>
                  <th className="text-left py-2 pr-6">Precision</th>
                  <th className="text-left py-2">Ultra-Precision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  ["CNC Milling", "±0.05mm", "±0.01mm", "±0.005mm"],
                  ["CNC Turning", "±0.05mm", "±0.008mm", "±0.003mm"],
                  ["Grinding", "±0.01mm", "±0.003mm", "±0.001mm"],
                  ["EDM / Wire-Cut", "±0.02mm", "±0.005mm", "±0.002mm"],
                ].map(([proc, std, prec, ultra]) => (
                  <tr key={proc} className="text-gray-300">
                    <td className="py-3 pr-6 font-medium text-white">{proc}</td>
                    <td className="py-3 pr-6">{std}</td>
                    <td className="py-3 pr-6 text-blue-300">{prec}</td>
                    <td className="py-3 text-primary">{ultra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create app/materials/page.tsx**

Show each material as a detailed card with: name, grade badges, a 3-column spec grid (density, tensile strength, hardness), applications list, and available finishes. Use `MATERIALS` from data. Header section with subtitle about material selection guidance.

```tsx
import type { Metadata } from "next";
import { MATERIALS } from "@/lib/data";

export const metadata: Metadata = { title: "Materials" };

export default function MaterialsPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Material Options
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">30+ Materials In Stock</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            We stock common grades and source specialty alloys within 5 business days. All materials come with mill certificates upon request.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MATERIALS.map((mat) => (
            <div key={mat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">{mat.name}</h2>
              </div>
              <p className="text-xs font-mono text-primary bg-primary-light px-2 py-1 rounded mb-5 inline-block">{mat.grade}</p>
              <div className="grid grid-cols-3 gap-4 mb-5 bg-gray-50 rounded-xl p-4">
                {[
                  { label: "Density", value: mat.density },
                  { label: "Tensile Str.", value: mat.tensileStrength },
                  { label: "Hardness", value: mat.hardness },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Applications</div>
                <div className="flex flex-wrap gap-1.5">
                  {mat.applications.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Available Finishes</div>
                <div className="flex flex-wrap gap-1.5">
                  {mat.finishes.map((f) => (
                    <span key={f} className="px-2 py-0.5 rounded-full bg-primary-light text-primary text-xs font-medium">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create app/quality/page.tsx**

Show ISO certifications as prominent cards (logo placeholder + cert name + certifying body + scope + validity badge). Then show a "QC Process" timeline (5 steps: Incoming Material Inspection → First Article Inspection → In-Process CMM → Final Inspection → Documentation & Shipping). Then show inspection equipment list in a grid (CMM, surface roughness tester, hardness tester, optical comparator, etc.).

```tsx
import type { Metadata } from "next";
import { CERTIFICATIONS } from "@/lib/data";

export const metadata: Metadata = { title: "Quality Assurance" };

export default function QualityPage() {
  const qcSteps = [
    { step: "01", title: "Incoming Inspection", desc: "All raw materials verified against mill certs and chemical composition reports." },
    { step: "02", title: "First Article Inspection", desc: "First produced part measured on CMM before production run proceeds." },
    { step: "03", title: "In-Process Monitoring", desc: "Statistical process control checkpoints at critical feature stages." },
    { step: "04", title: "Final CMM Inspection", desc: "100% key dimension check or AQL sampling on all finished parts." },
    { step: "05", title: "Documentation & Delivery", desc: "Full inspection reports, material certs, and CoC shipped with every order." },
  ];

  const equipment = [
    { name: "ZEISS Contura CMM", spec: "Accuracy: ±0.0015mm" },
    { name: "Mitutoyo Surface Tester", spec: "Ra resolution: 0.001μm" },
    { name: "Vickers Hardness Tester", spec: "Range: 10–3000 HV" },
    { name: "Optical Comparator", spec: "Magnification: 10–100×" },
    { name: "Vision Measuring System", spec: "Accuracy: ±0.003mm" },
    { name: "Roundness Tester", spec: "Accuracy: ±0.0003mm" },
  ];

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Quality Assurance
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Certified. Inspected. Guaranteed.</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Our quality management system covers every stage from incoming material to final delivery, backed by internationally recognized certifications.
          </p>
        </div>

        {/* Certifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          {CERTIFICATIONS.map((cert) => (
            <div key={cert.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 flex gap-5">
              <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-xs text-center leading-tight">{cert.name.split(":")[0]}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{cert.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Valid to {cert.validUntil}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">Certified by: {cert.body}</p>
                <p className="text-sm text-gray-600">{cert.scope}</p>
              </div>
            </div>
          ))}
        </div>

        {/* QC Process */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Our QC Process</h2>
        <div className="space-y-4 mb-16">
          {qcSteps.map((s) => (
            <div key={s.step} className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{s.step}</div>
              <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Equipment */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Inspection Equipment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((eq) => (
            <div key={eq.name} className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
              <div className="font-semibold text-gray-800 text-sm mb-1">{eq.name}</div>
              <div className="text-xs text-primary font-mono">{eq.spec}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/demo-engineering/app/capabilities/ apps/demo-engineering/app/materials/ apps/demo-engineering/app/quality/
git commit -m "feat(demo-engineering): capabilities, materials, quality pages"
```

---

### Task 7: RFQ Contact Form

**Files:**
- Create: `apps/demo-engineering/app/contact/actions.ts`
- Create: `apps/demo-engineering/app/contact/rfq-form.tsx`
- Create: `apps/demo-engineering/app/contact/page.tsx`

- [ ] **Step 1: Create app/contact/actions.ts**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";

export type RFQFormState = { success?: boolean; error?: string };

export async function submitRFQ(
  _prevState: RFQFormState,
  formData: FormData
): Promise<RFQFormState> {
  const name = formData.get("name");
  const company = formData.get("company");
  const email = formData.get("email");
  const country = formData.get("country");
  const partDesc = formData.get("partDesc");
  const material = formData.get("material");
  const quantity = formData.get("quantity");
  const tolerance = formData.get("tolerance");
  const message = formData.get("message");

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { error: "Please enter your full name." };
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (!partDesc || typeof partDesc !== "string" || partDesc.trim().length < 5) {
    return { error: "Please describe the part you need." };
  }

  const formattedMessage = [
    `Part Description: ${partDesc}`,
    material ? `Material: ${material}` : null,
    quantity ? `Quantity: ${quantity}` : null,
    tolerance ? `Required Tolerance: ${tolerance}` : null,
    message ? `\nAdditional Notes:\n${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name: String(name).trim(),
    company: company ? String(company).trim() : null,
    contact: String(email).trim(),
    message: formattedMessage,
    locale: "demo-engineering",
  });

  if (error) {
    return { error: "Submission failed. Please try again or email us directly." };
  }
  return { success: true };
}
```

- [ ] **Step 2: Create app/contact/rfq-form.tsx**

```tsx
"use client";
import { useActionState } from "react";
import { submitRFQ, type RFQFormState } from "./actions";

const initialState: RFQFormState = {};

const MATERIALS = ["Aluminum 6061", "Aluminum 7075", "Stainless Steel 304", "Stainless Steel 316L", "Titanium Grade 5", "Brass C360", "Carbon Steel 1045", "PEEK", "Other"];
const TOLERANCES = ["Standard (±0.05mm)", "Precision (±0.01mm)", "High Precision (±0.005mm)", "Ultra Precision (±0.002mm)"];

export function RFQForm() {
  const [state, action, isPending] = useActionState(submitRFQ, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">RFQ Received!</h2>
        <p className="text-gray-500 max-w-md mb-2">
          Thank you. Our engineering team will review your requirements and respond with a detailed quote within 24 hours.
        </p>
        <p className="text-sm text-gray-400">A confirmation has been sent to your email.</p>
      </div>
    );
  }

  const fieldClass = "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
          <input name="name" type="text" required placeholder="John Smith" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input name="company" type="text" placeholder="Acme Aerospace" className={fieldClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email <span className="text-red-400">*</span></label>
          <input name="email" type="email" required placeholder="john@example.com" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input name="country" type="text" placeholder="United States" className={fieldClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Part Description <span className="text-red-400">*</span></label>
        <textarea name="partDesc" required rows={3} placeholder="Describe the part: geometry, features, application, drawing reference..." className={`${fieldClass} resize-none`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Material</label>
          <select name="material" className={fieldClass}>
            <option value="">Select material</option>
            {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Quantity</label>
          <input name="quantity" type="text" placeholder="e.g. 500 pcs" className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Tolerance</label>
          <select name="tolerance" className={fieldClass}>
            <option value="">Select tolerance</option>
            {TOLERANCES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Additional Notes</label>
        <textarea name="message" rows={3} placeholder="Surface finish, special requirements, deadline, etc." className={`${fieldClass} resize-none`} />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl px-6 py-3.5 font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Submitting…" : "Submit RFQ →"}
        </button>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Quote within 24 hours
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            NDA available
          </span>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create app/contact/page.tsx**

```tsx
import type { Metadata } from "next";
import { RFQForm } from "./rfq-form";

export const metadata: Metadata = { title: "Request a Quote" };

export default function ContactPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Get a Quote
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Request for Quotation</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Fill in your part requirements and we'll respond with a competitive OEM quote within 24 hours. NDA available on request.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: contact info */}
          <aside className="lg:col-span-2">
            <div className="bg-gray-900 rounded-2xl p-7 text-white h-fit">
              <h2 className="font-bold text-lg mb-5">Contact Our Engineering Team</h2>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="text-primary text-lg">📧</span>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-gray-300">rfq@vertexprecision.com</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">📱</span>
                  <div>
                    <div className="font-semibold">WhatsApp</div>
                    <div className="text-gray-300">+86 755 0000 0000</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <div className="font-semibold">Location</div>
                    <div className="text-gray-300">Shenzhen, Guangdong, China</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-xs text-gray-400 space-y-1">
                  <div>✓ ISO 9001:2015 & IATF 16949 Certified</div>
                  <div>✓ Free DFM Analysis with Every RFQ</div>
                  <div>✓ NDA Available</div>
                  <div>✓ Prototypes from 5 Business Days</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="border-l-4 border-primary pl-4 text-lg font-bold text-gray-900 mb-6">
                Part Requirements
              </h2>
              <RFQForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter @repo/demo-engineering build`
Expected: Exits 0, no TypeScript errors, routes `/`, `/capabilities`, `/materials`, `/quality`, `/contact` all present.

- [ ] **Step 5: Commit**

```bash
git add apps/demo-engineering/app/contact/
git commit -m "feat(demo-engineering): RFQ contact form with Supabase submission"
```
