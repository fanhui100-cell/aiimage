# Plan D1: Demo Catalog + Inquiry System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/demo-catalog` — a demo product catalog + multi-product inquiry system for a Chinese LED lighting manufacturer, demonstrating what the ¥18,000 "Product Catalog + Inquiry System" package delivers.

**Architecture:** Standalone Next.js 15 App Router app inside the existing Turborepo monorepo. English-only. Key differentiator from `demo-export`: an **inquiry cart** — visitors browse products, add multiple to a list, then submit one combined inquiry. Cart state lives in a React Context backed by localStorage (no server state needed for demo). Inquiry submission uses a Next.js Server Action to insert into the existing Supabase `contact_submissions` table with `locale: "demo-catalog"`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4 (amber/warm theme), React 19 `useActionState`, React Context (client-side inquiry cart), Supabase `@supabase/ssr`, TypeScript 5, pnpm monorepo

---

## Fictional Company

**Name:** Guangzhou Brightstar LED Technology Co., Ltd.  
**Short brand:** Brightstar LED  
**Products:** LED panels, downlights, strip lights, flood lights, street lights, high bay lights, linear lights  
**Markets:** Hospitality, construction, commercial fitout, OEM distributors

---

## File Map

```
apps/demo-catalog/
├── package.json
├── next.config.ts
├── tsconfig.json
├── app/
│   ├── globals.css
│   ├── layout.tsx                  root layout — Nav + Footer + WhatsApp + InquiryCartProvider
│   ├── page.tsx                    homepage — hero, categories, why us, CTA
│   ├── products/
│   │   ├── page.tsx                catalog grid with category filter
│   │   └── [slug]/
│   │       └── page.tsx            product detail + AddToInquiryButton + specs
│   └── inquiry/
│       ├── page.tsx                inquiry cart page — selected products + form
│       └── actions.ts              server action — insert to Supabase
├── components/
│   ├── nav.tsx                     sticky nav, mobile menu, cart count badge
│   ├── footer.tsx                  3-column footer
│   ├── whatsapp-button.tsx         floating WhatsApp button (server component)
│   └── add-to-inquiry-button.tsx   "Add to Inquiry" / "Remove" toggle (client)
└── lib/
    ├── products.ts                 static product data + types
    ├── inquiry-context.tsx         cart context — add/remove/has/clear (client)
    └── supabase/
        ├── client.ts
        └── server.ts
```

---

## Task 1: App Scaffold

**Files:**
- Create: `apps/demo-catalog/package.json`
- Create: `apps/demo-catalog/next.config.ts`
- Create: `apps/demo-catalog/tsconfig.json`
- Create: `apps/demo-catalog/app/globals.css`
- Create: `apps/demo-catalog/lib/supabase/client.ts`
- Create: `apps/demo-catalog/lib/supabase/server.ts`
- Create: `apps/demo-catalog/.env.local` (not committed)

- [ ] **Step 1: Create `apps/demo-catalog/package.json`**

```json
{
  "name": "@repo/demo-catalog",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start --port 3002",
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

- [ ] **Step 2: Create `apps/demo-catalog/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: Create `apps/demo-catalog/tsconfig.json`**

```json
{
  "extends": "@repo/config/typescript/base",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ],
    "noEmit": true,
    "incremental": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

- [ ] **Step 4: Create `apps/demo-catalog/app/globals.css`**

Amber/warm theme — distinct from demo-export (blue) and main site (green):

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.52 0.16 55);
  --color-primary-dark: oklch(0.42 0.16 55);
  --color-primary-light: oklch(0.93 0.05 55);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.97 0.02 55);
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

- [ ] **Step 5: Create `apps/demo-catalog/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 6: Create `apps/demo-catalog/lib/supabase/server.ts`**

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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
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

- [ ] **Step 7: Create `apps/demo-catalog/.env.local`**

Copy contents of `apps/main/.env.local` (or `apps/demo-export/.env.local` if main's doesn't exist). Do NOT commit this file.

- [ ] **Step 8: Install dependencies**

```powershell
cd C:\Users\fanhu\Desktop\test\service-website
pnpm install
```

Expected: Resolves `@repo/demo-catalog` workspace. No errors.

- [ ] **Step 9: Commit scaffold**

```bash
git add apps/demo-catalog/package.json apps/demo-catalog/next.config.ts apps/demo-catalog/tsconfig.json apps/demo-catalog/app/globals.css apps/demo-catalog/lib/
git commit -m "feat(demo-catalog): add app scaffold with Supabase clients"
```

---

## Task 2: Product Data

**Files:**
- Create: `apps/demo-catalog/lib/products.ts`

- [ ] **Step 1: Create `apps/demo-catalog/lib/products.ts`**

```ts
export type Category = "indoor" | "outdoor" | "commercial";

export type Product = {
  slug: string;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  specs: { label: string; value: string }[];
  minOrder: string;
  leadTime: string;
  image: string;
};

export const CATEGORY_LABELS: Record<Category, string> = {
  indoor: "Indoor Lighting",
  outdoor: "Outdoor Lighting",
  commercial: "Commercial & Industrial",
};

export const PRODUCTS: Product[] = [
  {
    slug: "led-panel-light-60x60",
    name: "LED Panel Light 60×60cm",
    category: "indoor",
    tagline: "UGR<19 glare-free panel for offices, schools, and healthcare facilities",
    description:
      "High-efficiency LED panel with uniform light distribution and ultra-low glare (UGR<19). Recessed or surface-mounted installation. Suitable for offices, schools, hospitals, and retail interiors. Dimmable 0–10V version available.",
    specs: [
      { label: "Power", value: "36W / 40W / 48W" },
      { label: "Luminous Flux", value: "3,600–5,000 lm" },
      { label: "Color Temperature", value: "3000K / 4000K / 6500K" },
      { label: "CRI", value: "Ra ≥ 80 (Ra ≥ 90 option)" },
      { label: "Beam Angle", value: "120°" },
      { label: "Lifespan", value: ">50,000 hours" },
      { label: "IP Rating", value: "IP40" },
      { label: "Certification", value: "CE, RoHS, SAA" },
    ],
    minOrder: "100 pcs",
    leadTime: "10–15 business days",
    image: "https://picsum.photos/seed/panel-light/800/500",
  },
  {
    slug: "led-downlight-7w",
    name: "LED Downlight 7W",
    category: "indoor",
    tagline: "Slim recessed downlight for residential and hospitality ceilings",
    description:
      "Ultra-slim recessed LED downlight with anti-glare deep reflector. Suitable for residential, hotel room, and restaurant ceilings. Available in fixed and adjustable (30° tilt) versions. Junction box compatible.",
    specs: [
      { label: "Power", value: "7W / 10W / 12W" },
      { label: "Luminous Flux", value: "700–1,200 lm" },
      { label: "Color Temperature", value: "2700K / 3000K / 4000K / 6500K" },
      { label: "CRI", value: "Ra ≥ 80" },
      { label: "Cutout Diameter", value: "Ø75mm / Ø90mm / Ø100mm" },
      { label: "Beam Angle", value: "36° / 60°" },
      { label: "IP Rating", value: "IP44 (bathroom-safe option)" },
      { label: "Certification", value: "CE, RoHS, ETL" },
    ],
    minOrder: "500 pcs",
    leadTime: "7–12 business days",
    image: "https://picsum.photos/seed/downlight/800/500",
  },
  {
    slug: "led-strip-light-rgb",
    name: "LED Strip Light RGB+W",
    category: "indoor",
    tagline: "High-density RGBW strip for architectural and decorative lighting",
    description:
      "High-density SMD5050 RGBW LED strip light for architectural, cove, and decorative applications. 60 LEDs/m standard density, 120 LEDs/m high density. IP20 for indoor, IP65 (silicone coated) for damp locations. Compatible with most DMX and PWM controllers.",
    specs: [
      { label: "LED Type", value: "SMD5050 RGBW" },
      { label: "Power", value: "14.4W/m (60LEDs/m) / 24W/m (120LEDs/m)" },
      { label: "Voltage", value: "DC 12V / DC 24V" },
      { label: "Color", value: "RGB + Warm White (2700K)" },
      { label: "Strip Width", value: "12mm" },
      { label: "IP Rating", value: "IP20 / IP65" },
      { label: "Reel Length", value: "5m per reel" },
      { label: "Certification", value: "CE, RoHS, UL" },
    ],
    minOrder: "100 reels",
    leadTime: "10–15 business days",
    image: "https://picsum.photos/seed/strip-light/800/500",
  },
  {
    slug: "led-flood-light-100w",
    name: "LED Flood Light 100W",
    category: "outdoor",
    tagline: "IP66 weatherproof floodlight for facades, car parks, and sports fields",
    description:
      "Die-cast aluminium LED flood light with toughened glass lens. IP66 rated for all-weather outdoor installation. Adjustable mounting bracket: wall, pole, or ground spike. Surge protection 10kV. Suitable for building facades, carparks, sports courts, and industrial yards.",
    specs: [
      { label: "Power", value: "50W / 100W / 150W / 200W" },
      { label: "Luminous Flux", value: "5,000–20,000 lm" },
      { label: "Color Temperature", value: "3000K / 4000K / 6500K" },
      { label: "CRI", value: "Ra ≥ 70" },
      { label: "Beam Angle", value: "60° / 90° / 120°" },
      { label: "IP Rating", value: "IP66 / IK08" },
      { label: "Operating Temp", value: "-40°C to +50°C" },
      { label: "Certification", value: "CE, RoHS, UL, SAA" },
    ],
    minOrder: "50 pcs",
    leadTime: "12–18 business days",
    image: "https://picsum.photos/seed/flood-light/800/500",
  },
  {
    slug: "led-street-light-80w",
    name: "LED Street Light 80W",
    category: "outdoor",
    tagline: "ENEC-class road lighting with Type II asymmetric distribution",
    description:
      "Road-optimized LED street light with Type II asymmetric optic for efficient carriageway coverage. Die-cast aluminium housing with thermal fins. Slip-fitter for Ø60mm pole. Optional: 0–10V dimming, NEMA socket for smart control, PIR sensor.",
    specs: [
      { label: "Power", value: "60W / 80W / 100W / 120W" },
      { label: "Luminous Flux", value: "8,400–16,800 lm" },
      { label: "Efficacy", value: "≥140 lm/W" },
      { label: "Color Temperature", value: "3000K / 4000K / 5700K" },
      { label: "CRI", value: "Ra ≥ 70" },
      { label: "IP Rating", value: "IP66 / IK09" },
      { label: "Pole Diameter", value: "Ø42–Ø60mm" },
      { label: "Certification", value: "CE, RoHS, ENEC, LM79" },
    ],
    minOrder: "20 pcs",
    leadTime: "15–20 business days",
    image: "https://picsum.photos/seed/street-light/800/500",
  },
  {
    slug: "led-high-bay-200w",
    name: "LED High Bay Light 200W",
    category: "commercial",
    tagline: "UFO high bay for warehouses and factories with 6–12m ceiling heights",
    description:
      "Round UFO LED high bay light designed for large industrial and commercial spaces with 6–12m mounting height. DALI and 0–10V dimmable versions available. Integrated surge protection 6kV. Replaceable LED module design for extended service life.",
    specs: [
      { label: "Power", value: "100W / 150W / 200W / 240W" },
      { label: "Luminous Flux", value: "13,000–30,000 lm" },
      { label: "Efficacy", value: "≥130 lm/W" },
      { label: "Color Temperature", value: "4000K / 5700K" },
      { label: "CRI", value: "Ra ≥ 80" },
      { label: "Beam Angle", value: "60° / 90° / 120°" },
      { label: "IP Rating", value: "IP65" },
      { label: "Certification", value: "CE, RoHS, UL, DLC" },
    ],
    minOrder: "20 pcs",
    leadTime: "12–18 business days",
    image: "https://picsum.photos/seed/high-bay/800/500",
  },
  {
    slug: "led-linear-light-1200mm",
    name: "LED Linear Light 1200mm",
    category: "commercial",
    tagline: "Linkable suspended or surface-mounted batten for retail and office",
    description:
      "Slim aluminium LED linear batten for continuous row lighting in retail, offices, and car parks. End-to-end linkable with power-in at one end. Opal or prismatic diffuser. Suspended (aircraft cable), surface mount, or recessed installation.",
    specs: [
      { label: "Power", value: "30W / 36W / 40W (1200mm)" },
      { label: "Luminous Flux", value: "3,600–5,000 lm" },
      { label: "Color Temperature", value: "3000K / 4000K / 6500K" },
      { label: "CRI", value: "Ra ≥ 80" },
      { label: "Diffuser", value: "Opal PMMA / Prismatic" },
      { label: "IP Rating", value: "IP40 / IP65" },
      { label: "Linkable", value: "Yes, end-to-end up to 10 units" },
      { label: "Certification", value: "CE, RoHS, SAA" },
    ],
    minOrder: "100 pcs",
    leadTime: "10–15 business days",
    image: "https://picsum.photos/seed/linear-light/800/500",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-catalog/lib/products.ts
git commit -m "feat(demo-catalog): add static product data for 7 LED lighting products"
```

---

## Task 3: Inquiry Cart Context

**Files:**
- Create: `apps/demo-catalog/lib/inquiry-context.tsx`

This is the core differentiator of this demo: a client-side inquiry cart backed by localStorage.

- [ ] **Step 1: Create `apps/demo-catalog/lib/inquiry-context.tsx`**

```tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type InquiryItem = {
  slug: string;
  name: string;
};

type InquiryCartContextType = {
  items: InquiryItem[];
  add: (item: InquiryItem) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
};

const InquiryCartContext = createContext<InquiryCartContextType | null>(null);

export function InquiryCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InquiryItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("brightstar-inquiry-cart");
      if (saved) setItems(JSON.parse(saved) as InquiryItem[]);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("brightstar-inquiry-cart", JSON.stringify(items));
  }, [items]);

  function add(item: InquiryItem) {
    setItems((prev) =>
      prev.some((i) => i.slug === item.slug) ? prev : [...prev, item]
    );
  }

  function remove(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  function has(slug: string) {
    return items.some((i) => i.slug === slug);
  }

  function clear() {
    setItems([]);
  }

  return (
    <InquiryCartContext.Provider value={{ items, add, remove, has, clear }}>
      {children}
    </InquiryCartContext.Provider>
  );
}

export function useInquiryCart(): InquiryCartContextType {
  const ctx = useContext(InquiryCartContext);
  if (!ctx) throw new Error("useInquiryCart must be used within InquiryCartProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-catalog/lib/inquiry-context.tsx
git commit -m "feat(demo-catalog): add inquiry cart context with localStorage persistence"
```

---

## Task 4: Shared Components + Root Layout

**Files:**
- Create: `apps/demo-catalog/components/nav.tsx`
- Create: `apps/demo-catalog/components/footer.tsx`
- Create: `apps/demo-catalog/components/whatsapp-button.tsx`
- Create: `apps/demo-catalog/components/add-to-inquiry-button.tsx`
- Create: `apps/demo-catalog/app/layout.tsx`

- [ ] **Step 1: Create `apps/demo-catalog/components/nav.tsx`**

Nav is a client component — needs mobile state AND reads the inquiry cart count from context.

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useInquiryCart } from "@/lib/inquiry-context";

export function Nav() {
  const [open, setOpen] = useState(false);
  const { items } = useInquiryCart();
  const count = items.length;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-primary tracking-tight">
          Brightstar LED
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm text-gray-600 hover:text-primary transition-colors">
            Products
          </Link>
          <Link href="/inquiry" className="relative text-sm text-gray-600 hover:text-primary transition-colors">
            Inquiry List
            {count > 0 && (
              <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] text-[11px] font-bold rounded-full bg-primary text-white flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </Link>
          <Link
            href="/inquiry"
            className="text-sm font-semibold px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {count > 0 ? `Submit Inquiry (${count})` : "Get a Quote"}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          <Link href="/products" className="text-sm text-gray-700 hover:text-primary" onClick={() => setOpen(false)}>
            Products
          </Link>
          <Link href="/inquiry" className="text-sm text-gray-700 hover:text-primary" onClick={() => setOpen(false)}>
            Inquiry List {count > 0 && <span className="ml-1 font-semibold text-primary">({count})</span>}
          </Link>
          <Link
            href="/inquiry"
            className="text-sm font-semibold px-4 py-2 rounded-md bg-primary text-white text-center hover:bg-primary-dark transition-colors"
            onClick={() => setOpen(false)}
          >
            {count > 0 ? `Submit Inquiry (${count})` : "Get a Quote"}
          </Link>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create `apps/demo-catalog/components/footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="text-white font-bold text-lg mb-2">Brightstar LED</p>
          <p className="text-sm leading-relaxed">
            Guangzhou Brightstar LED Technology Co., Ltd.
          </p>
          <p className="text-sm mt-1">
            Guangming District, Guangzhou, Guangdong, China
          </p>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Products</p>
          <ul className="space-y-2 text-sm">
            <li>Indoor Lighting</li>
            <li>Outdoor Lighting</li>
            <li>Commercial &amp; Industrial</li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Contact</p>
          <ul className="space-y-2 text-sm">
            <li>sales@brightstarled.com</li>
            <li>WhatsApp: +86 139 0000 0000</li>
            <li>Tel: +86 20 0000 0000</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-sm text-center text-gray-500">
        © {new Date().getFullYear()} Guangzhou Brightstar LED Technology Co., Ltd. All rights reserved.
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create `apps/demo-catalog/components/whatsapp-button.tsx`**

```tsx
export function WhatsAppButton() {
  const phone = "8613900000000";
  const message = encodeURIComponent("Hello, I'd like to inquire about your LED lighting products.");

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe5e] transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-7 h-7"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.845L0 24l6.302-1.504A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.801 9.801 0 01-5.003-1.366l-.36-.214-3.732.891.946-3.624-.235-.374A9.779 9.779 0 012.182 12C2.182 6.565 6.565 2.182 12 2.182S21.818 6.565 21.818 12 17.435 21.818 12 21.818z" />
      </svg>
    </a>
  );
}
```

- [ ] **Step 4: Create `apps/demo-catalog/components/add-to-inquiry-button.tsx`**

```tsx
"use client";

import { useInquiryCart } from "@/lib/inquiry-context";

type Props = {
  slug: string;
  name: string;
};

export function AddToInquiryButton({ slug, name }: Props) {
  const { add, remove, has } = useInquiryCart();
  const inCart = has(slug);

  return (
    <button
      onClick={() => (inCart ? remove(slug) : add({ slug, name }))}
      className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
        inCart
          ? "bg-primary/10 text-primary border-2 border-primary hover:bg-primary/20"
          : "bg-primary text-white hover:bg-primary-dark"
      }`}
    >
      {inCart ? "✓ Added to Inquiry List" : "Add to Inquiry List"}
    </button>
  );
}
```

- [ ] **Step 5: Create `apps/demo-catalog/app/layout.tsx`**

The layout wraps everything in `InquiryCartProvider` so Nav can read cart count.

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { InquiryCartProvider } from "@/lib/inquiry-context";

export const metadata: Metadata = {
  title: {
    template: "%s | Brightstar LED",
    default: "Brightstar LED — LED Lighting Manufacturer & Exporter",
  },
  description:
    "OEM/ODM LED lighting manufacturer. Indoor, outdoor, and commercial LED solutions. CE, RoHS, UL certified. Export to 60+ countries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <InquiryCartProvider>
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
          <WhatsAppButton />
        </InquiryCartProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/demo-catalog/components/ apps/demo-catalog/app/layout.tsx
git commit -m "feat(demo-catalog): add nav with cart badge, footer, WhatsApp button, and root layout"
```

---

## Task 5: Homepage

**Files:**
- Create: `apps/demo-catalog/app/page.tsx`

- [ ] **Step 1: Create `apps/demo-catalog/app/page.tsx`**

```tsx
import Link from "next/link";
import { CATEGORY_LABELS, type Category } from "@/lib/products";

const CATEGORIES: { key: Category; icon: string; desc: string }[] = [
  {
    key: "indoor",
    icon: "💡",
    desc: "Panel lights, downlights, and strip lights for offices, hotels, and retail",
  },
  {
    key: "outdoor",
    icon: "🌧️",
    desc: "IP66-rated flood lights and street lights for roads, carparks, and facades",
  },
  {
    key: "commercial",
    icon: "🏭",
    desc: "High bay lights and linear battens for warehouses, factories, and large retail",
  },
];

const STATS = [
  { value: "15+", label: "Years Manufacturing" },
  { value: "60+", label: "Export Countries" },
  { value: "500+", label: "Product Models" },
  { value: "CE/RoHS/UL", label: "Certifications" },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">
            Guangzhou Brightstar LED Technology Co., Ltd.
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Professional LED Lighting
            <br />
            <span className="text-primary">Manufacturer & Exporter</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
            Browse our full catalog, select the products you need, and submit one inquiry.
            We reply within 24 hours with a competitive OEM quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="rounded-lg px-8 py-3 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              href="/inquiry"
              className="rounded-lg px-8 py-3 font-semibold border-2 border-gray-500 text-gray-200 hover:border-gray-300 hover:text-white transition-colors"
            >
              View Inquiry List
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-primary-light mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Product Categories</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            From office interiors to outdoor infrastructure — full-range LED solutions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={`/products?category=${cat.key}`}
                className="group bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:border-primary hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-4">{cat.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                  {CATEGORY_LABELS[cat.key]}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{cat.desc}</p>
                <p className="mt-4 text-sm font-semibold text-primary">Browse Products →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How to Place an Inquiry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { step: "01", title: "Browse Catalog", desc: 'Explore our product range and click "Add to Inquiry List" on each product you need' },
              { step: "02", title: "Review Your List", desc: "Check your selected products in the Inquiry List, adjust if needed" },
              { step: "03", title: "Submit Inquiry", desc: "Fill in your details and requirements — we reply with a quote within 24 hours" },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-4xl font-bold text-primary/20 mb-3">{item.step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              Start Browsing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-900 py-16 px-4 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Need a Custom Solution?</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          OEM/ODM available. Custom CCT, CRI, beam angle, and driver specs. Send us your requirements.
        </p>
        <Link
          href="/inquiry"
          className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          Submit an Inquiry
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-catalog/app/page.tsx
git commit -m "feat(demo-catalog): add homepage with hero, stats, categories, and how-it-works"
```

---

## Task 6: Products Catalog Page

**Files:**
- Create: `apps/demo-catalog/app/products/page.tsx`

- [ ] **Step 1: Create `apps/demo-catalog/app/products/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS, CATEGORY_LABELS, type Category } from "@/lib/products";
import { AddToInquiryButton } from "@/components/add-to-inquiry-button";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our LED lighting catalog: indoor panels, downlights, strip lights, outdoor floodlights, street lights, and commercial high bay lights.",
};

const CATEGORIES: Category[] = ["indoor", "outdoor", "commercial"];

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const activeCategory = CATEGORIES.includes(category as Category)
    ? (category as Category)
    : null;

  const products = activeCategory
    ? PRODUCTS.filter((p) => p.category === activeCategory)
    : PRODUCTS;

  return (
    <main className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">LED Lighting Catalog</h1>
            <p className="text-gray-500">{products.length} products — Click a product to view specs, then add to your inquiry list</p>
          </div>
          <Link
            href="/inquiry"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shrink-0"
          >
            View Inquiry List →
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/products"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Products
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${cat}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.slug}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <Link href={`/products/${product.slug}`} className="group">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {CATEGORY_LABELS[product.category]}
                  </span>
                  <h2 className="font-bold text-gray-800 mt-1 mb-1 text-sm leading-snug group-hover:text-primary transition-colors">
                    {product.name}
                  </h2>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.tagline}</p>
                  <p className="text-xs text-gray-400 mt-2">MOQ: {product.minOrder}</p>
                </div>
              </Link>
              <div className="px-4 pb-4 mt-auto">
                <AddToInquiryButton slug={product.slug} name={product.name} />
              </div>
            </div>
          ))}
        </div>

        {/* Inquiry CTA */}
        <div className="mt-16 text-center bg-primary/5 rounded-2xl p-10 border border-primary/10">
          <h2 className="text-xl font-bold mb-2">Ready to submit your inquiry?</h2>
          <p className="text-gray-500 mb-6">
            Add products above, then go to your inquiry list to submit all at once.
          </p>
          <Link
            href="/inquiry"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            View Inquiry List →
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-catalog/app/products/page.tsx
git commit -m "feat(demo-catalog): add products catalog page with category filter and add-to-inquiry"
```

---

## Task 7: Product Detail Page

**Files:**
- Create: `apps/demo-catalog/app/products/[slug]/page.tsx`

- [ ] **Step 1: Create `apps/demo-catalog/app/products/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PRODUCTS, CATEGORY_LABELS, getProductBySlug } from "@/lib/products";
import { AddToInquiryButton } from "@/components/add-to-inquiry-button";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.tagline,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/products" className="hover:text-primary">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{CATEGORY_LABELS[product.category]}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {CATEGORY_LABELS[product.category]}
            </span>
            <h1 className="text-3xl font-bold mt-2 mb-3">{product.name}</h1>
            <p className="text-gray-500 mb-6 leading-relaxed">{product.description}</p>

            <div className="flex gap-6 text-sm text-gray-600 mb-8">
              <div>
                <span className="font-medium text-gray-800 block">MOQ</span>
                {product.minOrder}
              </div>
              <div>
                <span className="font-medium text-gray-800 block">Lead Time</span>
                {product.leadTime}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <AddToInquiryButton slug={product.slug} name={product.name} />
              <Link
                href="/inquiry"
                className="w-full text-center rounded-lg px-6 py-3 font-semibold border-2 border-primary text-primary hover:bg-primary/5 transition-colors"
              >
                View Inquiry List →
              </Link>
              <a
                href={`https://wa.me/8613900000000?text=${encodeURIComponent(
                  `Hi, I'm interested in ${product.name}. Please send me a quote.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center rounded-lg px-6 py-3 font-semibold border-2 border-[#25D366] text-[#25D366] hover:bg-green-50 transition-colors"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        {/* Specs table */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Technical Specifications</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <tbody>
                {product.specs.map((spec, i) => (
                  <tr key={spec.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 font-medium text-gray-700 w-1/3">{spec.label}</td>
                    <td className="px-6 py-4 text-gray-600">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/products" className="text-sm font-medium text-primary hover:underline">
            ← Back to catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-catalog/app/products/
git commit -m "feat(demo-catalog): add product detail page with specs and add-to-inquiry"
```

---

## Task 8: Inquiry Cart Page + Server Action

**Files:**
- Create: `apps/demo-catalog/app/inquiry/actions.ts`
- Create: `apps/demo-catalog/app/inquiry/inquiry-form.tsx`
- Create: `apps/demo-catalog/app/inquiry/page.tsx`

- [ ] **Step 1: Create `apps/demo-catalog/app/inquiry/actions.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type InquiryFormState = {
  success?: boolean;
  error?: string;
};

export async function submitInquiry(
  _prevState: InquiryFormState,
  formData: FormData
): Promise<InquiryFormState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const company = formData.get("company")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const country = formData.get("country")?.toString().trim() ?? "";
  const products = formData.get("products")?.toString().trim() ?? "";
  const rawMessage = formData.get("message")?.toString().trim() ?? "";

  if (!name || !email || !rawMessage) {
    return { error: "Name, email, and message are required." };
  }

  const message = [
    products && `Products of Interest:\n${products}`,
    country && `Country: ${country}`,
    rawMessage,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      company: company || null,
      contact: email,
      message,
      locale: "demo-catalog",
    });

    if (error) throw error;
    return { success: true };
  } catch {
    return { error: "Submission failed. Please email us at sales@brightstarled.com." };
  }
}
```

- [ ] **Step 2: Create `apps/demo-catalog/app/inquiry/inquiry-form.tsx`**

This is a client component. It reads the cart from context, renders the selected products list, and submits the form (passing product names as a hidden field).

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useInquiryCart } from "@/lib/inquiry-context";
import { submitInquiry, type InquiryFormState } from "./actions";

const initialState: InquiryFormState = {};

export function InquiryForm() {
  const { items, remove, clear } = useInquiryCart();
  const [state, action, isPending] = useActionState(submitInquiry, initialState);

  if (state.success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-3">Inquiry Submitted!</h2>
        <p className="text-gray-500 mb-6">
          We have received your inquiry for {items.length > 0 ? items.length : "your selected"} product{items.length !== 1 ? "s" : ""}. We will reply within 24 hours.
        </p>
        <Link
          href="/products"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to catalog
        </Link>
      </div>
    );
  }

  const productList = items.map((i) => `• ${i.name}`).join("\n");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Selected products list */}
      <div>
        <h2 className="text-xl font-bold mb-6">
          Your Inquiry List{" "}
          <span className="text-primary">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">Your inquiry list is empty.</p>
            <Link
              href="/products"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Browse the catalog →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <button
                  onClick={() => remove(item.slug)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-4 shrink-0"
                  aria-label={`Remove ${item.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <button
            onClick={clear}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear all
          </button>
        )}

        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">💡 Tip</p>
          <p>
            Browse more products and add them to your list before submitting.
            You can request quotes for multiple products in one inquiry.
          </p>
        </div>
      </div>

      {/* Inquiry form */}
      <div>
        <h2 className="text-xl font-bold mb-6">Your Contact Details</h2>

        <form action={action} className="space-y-5">
          {/* Hidden field: selected product names */}
          <input type="hidden" name="products" value={productList} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Smith"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                placeholder="ABC Electrical Ltd."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                placeholder="Australia"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Requirements <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Please describe your project: quantity needed, application (office/hotel/warehouse/etc.), delivery port, target price, or any custom requirements."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || items.length === 0}
            className="w-full rounded-lg px-6 py-3 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending
              ? "Sending..."
              : items.length === 0
              ? "Add products to inquiry list first"
              : `Submit Inquiry for ${items.length} Product${items.length !== 1 ? "s" : ""}`}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Or reach us directly:{" "}
            <a href="mailto:sales@brightstarled.com" className="hover:underline">
              sales@brightstarled.com
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/demo-catalog/app/inquiry/page.tsx`**

```tsx
import type { Metadata } from "next";
import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = {
  title: "Inquiry List",
  description: "Review your selected LED lighting products and submit a combined inquiry for a quote.",
};

export default function InquiryPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">Submit Inquiry</h1>
        <p className="text-gray-500 mb-10">
          Review your selected products below and submit your requirements. We will reply with a competitive quote within 24 hours.
        </p>
        <InquiryForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/demo-catalog/app/inquiry/
git commit -m "feat(demo-catalog): add inquiry cart page with multi-product form and server action"
```

---

## Task 9: Build Verify

**Files:** None created — runs the build and fixes any errors.

- [ ] **Step 1: Run full build**

```powershell
cd C:\Users\fanhu\Desktop\test\service-website
pnpm turbo build --filter=@repo/demo-catalog...
```

Expected routes:
```
ƒ /
ƒ /products
○ /products/[slug]   (7 static pages)
ƒ /inquiry
```

No TypeScript errors. Common issues to fix:
- `searchParams`/`params` not awaited — must `await` in Next.js 15
- `useActionState` must come from `"react"` not `"react-dom"`
- `exactOptionalPropertyTypes` — if passing `string | undefined` to an optional prop, use conditional spread: `{...(value ? { propName: value } : {})}`
- Cart count in the success message — if items were cleared after success, `items.length` will be 0. Consider storing the count before submit using a local variable in the effect.

**Note on the success message in inquiry-form.tsx:** After `state.success` is true, `items` from context may still have the old count (the form doesn't clear the cart on success). Add a `clear()` call in a `useEffect` triggered by `state.success`:

```tsx
useEffect(() => {
  if (state.success) {
    clear();
  }
}, [state.success]); // eslint-disable-line react-hooks/exhaustive-deps
```

Add this effect inside `InquiryForm` before the early return for success state. The `clear` function reference is stable (defined outside `setItems`), so exhaustive-deps warning can be suppressed or `clear` added to deps.

- [ ] **Step 2: Fix build errors if any, commit**

```bash
git add -p
git commit -m "fix(demo-catalog): resolve TypeScript build errors"
```

- [ ] **Step 3: Confirm build success**

Build passes with no errors. Dev server can be started with:

```powershell
pnpm --filter @repo/demo-catalog dev
```

Visit `http://localhost:3002` to verify the demo.

---

## Self-Review

**Spec coverage:**
- ✓ New `apps/demo-catalog` standalone app in monorepo — Task 1
- ✓ 7 LED products across 3 categories — Task 2
- ✓ Inquiry cart (add/remove/has/clear + localStorage) — Task 3
- ✓ Nav with live cart count badge — Task 4
- ✓ Homepage: dark hero, stats bar, categories, how-it-works, CTA — Task 5
- ✓ Catalog page: grid + category filter + Add to Inquiry button on every card — Task 6
- ✓ Product detail: specs table + AddToInquiryButton + WhatsApp — Task 7
- ✓ Inquiry page: selected products list + form + Supabase insert — Task 8
- ✓ Build verify — Task 9
- ✓ Amber/warm theme distinct from main (green) and demo-export (blue)

**Placeholder scan:**
- `brightstarled.com` — intentional demo company
- `picsum.photos` images — intentional demo placeholders
- `+86 139 0000 0000` — intentional demo phone
- No TBD or TODO

**Type consistency:**
- `InquiryItem.slug` + `InquiryItem.name` used consistently across context, button, and form
- `products` hidden field carries newline-separated product names — server action splits by newline in display
- `submitInquiry(prevState, formData)` matches `useActionState` signature
- `Product.slug` → `generateStaticParams` → URL slug — consistent
- `Category` type used in `CATEGORY_LABELS` record, filter logic, and search params narrowing — consistent
