# Plan C1: Demo Export Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/demo-export` — a realistic English product website for a Chinese hardware manufacturer, demonstrating what the ¥9,800 "Export English Product Website" package delivers.

**Architecture:** Standalone Next.js 15 App Router app inside the existing Turborepo monorepo (`service-website/`). English-only — no i18n. Product data is static TypeScript in `lib/products.ts`. Inquiry form uses a Next.js Server Action to insert into the existing Supabase `contact_submissions` table (using `locale: "demo-export"` as a source tag). No shared components with `apps/main`; this site has its own blue industrial design system.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4 (blue industrial theme), Supabase (`@supabase/ssr`), React 19 `useActionState`, TypeScript 5, pnpm monorepo

---

## Fictional Company

**Name:** Wenzhou Yongchang Metal Products Co., Ltd.  
**Short brand:** YC Metal  
**Products:** Structural steel brackets, industrial fasteners, cable management systems  
**Markets:** Construction, warehousing, electrical, OEM manufacturing

---

## File Map

```
apps/demo-export/
├── package.json
├── next.config.ts
├── tsconfig.json
├── app/
│   ├── globals.css
│   ├── layout.tsx               root layout — Nav + Footer + WhatsApp button
│   ├── page.tsx                 homepage — hero, categories, why us, CTA
│   ├── products/
│   │   ├── page.tsx             product listing grid
│   │   └── [slug]/
│   │       └── page.tsx         product detail page
│   └── contact/
│       ├── page.tsx             inquiry form page
│       └── actions.ts           server action — insert to Supabase
├── components/
│   ├── nav.tsx                  sticky nav, mobile hamburger
│   ├── footer.tsx               3-column footer
│   └── whatsapp-button.tsx      floating WhatsApp CTA
└── lib/
    ├── products.ts              static product data + types
    └── supabase/
        ├── client.ts            browser Supabase client
        └── server.ts            async server Supabase client
```

---

## Task 1: App Scaffold

**Files:**
- Create: `apps/demo-export/package.json`
- Create: `apps/demo-export/next.config.ts`
- Create: `apps/demo-export/tsconfig.json`
- Create: `apps/demo-export/app/globals.css`
- Create: `apps/demo-export/lib/supabase/client.ts`
- Create: `apps/demo-export/lib/supabase/server.ts`
- Create: `apps/demo-export/.env.local` (not committed)

- [ ] **Step 1: Create `apps/demo-export/package.json`**

```json
{
  "name": "@repo/demo-export",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
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

- [ ] **Step 2: Create `apps/demo-export/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: Create `apps/demo-export/tsconfig.json`**

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

- [ ] **Step 4: Create `apps/demo-export/app/globals.css`**

Blue industrial theme (distinct from the green main site):

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.42 0.18 232);
  --color-primary-dark: oklch(0.34 0.18 232);
  --color-primary-light: oklch(0.93 0.05 232);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.97 0.01 232);
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

- [ ] **Step 5: Create `apps/demo-export/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 6: Create `apps/demo-export/lib/supabase/server.ts`**

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

- [ ] **Step 7: Create `apps/demo-export/.env.local`**

Copy the contents of `apps/main/.env.local` into `apps/demo-export/.env.local`.  
Both apps share the same Supabase project. The demo distinguishes submissions via `locale: "demo-export"`.

```
NEXT_PUBLIC_SUPABASE_URL=<same as apps/main>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as apps/main>
SUPABASE_SERVICE_ROLE_KEY=<same as apps/main>
```

- [ ] **Step 8: Install dependencies**

Run from monorepo root:

```powershell
cd C:\Users\fanhu\Desktop\test\service-website
pnpm install
```

Expected: New `@repo/demo-export` workspace resolved. No errors.

- [ ] **Step 9: Commit scaffold**

```bash
git add apps/demo-export/package.json apps/demo-export/next.config.ts apps/demo-export/tsconfig.json apps/demo-export/app/globals.css apps/demo-export/lib/
git commit -m "feat(demo-export): add app scaffold with Supabase clients"
```

---

## Task 2: Product Data

**Files:**
- Create: `apps/demo-export/lib/products.ts`

- [ ] **Step 1: Create `apps/demo-export/lib/products.ts`**

```ts
export type Category = "brackets" | "fasteners" | "cable";

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
  brackets: "Structural Brackets",
  fasteners: "Fasteners & Bolts",
  cable: "Cable Management",
};

export const PRODUCTS: Product[] = [
  {
    slug: "heavy-duty-wall-bracket",
    name: "Heavy Duty Wall Bracket",
    category: "brackets",
    tagline: "Load-rated structural support for industrial shelving and pipe runs",
    description:
      "Hot-dip galvanized steel bracket engineered for high-load applications. Used in warehouses, production facilities, and commercial construction. Available in multiple load ratings from 500 kg to 3,000 kg.",
    specs: [
      { label: "Material", value: "Q235 Carbon Steel" },
      { label: "Surface", value: "Hot-Dip Galvanized" },
      { label: "Sizes", value: "100 / 150 / 200 / 250 / 300 mm" },
      { label: "Load Capacity", value: "Up to 3,000 kg (size dependent)" },
      { label: "Thickness", value: "4 mm / 6 mm / 8 mm" },
      { label: "Standard", value: "ISO 9001:2015" },
    ],
    minOrder: "500 pcs",
    leadTime: "15–20 business days",
    image: "https://picsum.photos/seed/wall-bracket/800/500",
  },
  {
    slug: "adjustable-angle-bracket",
    name: "Adjustable Angle Bracket",
    category: "brackets",
    tagline: "Versatile 90° and variable-angle brackets for modular assembly",
    description:
      "Precision-stamped steel angle brackets with slotted holes for flexible positioning. Used in furniture manufacturing, partition systems, and light structural assembly. Zinc-plated or powder-coated finish available.",
    specs: [
      { label: "Material", value: "Q235 Carbon Steel" },
      { label: "Surface", value: "Zinc Plated / Powder Coated" },
      { label: "Sizes", value: "40×40 / 50×50 / 60×60 / 80×80 mm" },
      { label: "Thickness", value: "1.5 mm / 2 mm / 2.5 mm" },
      { label: "Hole Pattern", value: "Slotted + Fixed" },
      { label: "Finish Colors", value: "Silver, White, Black, Custom" },
    ],
    minOrder: "1,000 pcs",
    leadTime: "10–15 business days",
    image: "https://picsum.photos/seed/angle-bracket/800/500",
  },
  {
    slug: "structural-hex-bolt-set",
    name: "Structural Hex Bolt Set",
    category: "fasteners",
    tagline: "Grade 8.8 high-strength hex bolts for structural steel connections",
    description:
      "ISO-standard high-strength hex bolts with matching nuts and flat washers. Grade 8.8 tensile strength, suitable for steel-to-steel structural connections, machinery assembly, and infrastructure projects. Full metric and imperial sizing available.",
    specs: [
      { label: "Grade", value: "8.8 (ISO 898-1)" },
      { label: "Material", value: "Medium Carbon Steel" },
      { label: "Surface", value: "Zinc Plated (white / yellow)" },
      { label: "Thread", value: "M6 – M36 metric / 1/4\"–1-1/2\" imperial" },
      { label: "Length Range", value: "20 mm – 300 mm" },
      { label: "Standard", value: "ISO 4014 / DIN 931" },
    ],
    minOrder: "5,000 pcs",
    leadTime: "10–15 business days",
    image: "https://picsum.photos/seed/hex-bolt/800/500",
  },
  {
    slug: "expansion-anchor-bolt",
    name: "Expansion Anchor Bolt",
    category: "fasteners",
    tagline: "Mechanical expansion anchors for concrete and masonry applications",
    description:
      "Wedge-type expansion anchor bolts for secure fastening into concrete, brick, and stone. Used in civil construction, equipment anchoring, and facade mounting. Stainless steel options available for coastal and corrosive environments.",
    specs: [
      { label: "Type", value: "Wedge Anchor / Sleeve Anchor" },
      { label: "Material", value: "Carbon Steel / 304 Stainless Steel" },
      { label: "Surface", value: "Zinc Plated / Stainless" },
      { label: "Diameter", value: "M8 / M10 / M12 / M16 / M20" },
      { label: "Embedment", value: "Per DIN standard" },
      { label: "Concrete Grade", value: "C20 and above" },
    ],
    minOrder: "2,000 pcs",
    leadTime: "12–18 business days",
    image: "https://picsum.photos/seed/anchor-bolt/800/500",
  },
  {
    slug: "perforated-cable-tray",
    name: "Perforated Cable Tray",
    category: "cable",
    tagline: "Ventilated steel trays for organized electrical and data cable runs",
    description:
      "Hot-rolled steel perforated cable trays for routing power cables, data cables, and control wiring. Perforations improve heat dissipation and reduce weight. Standard 3 m lengths; fittings (elbows, tees, crosses) available separately.",
    specs: [
      { label: "Material", value: "Q235 Carbon Steel" },
      { label: "Surface", value: "Hot-Dip Galvanized / Spray Painted" },
      { label: "Width", value: "100 / 150 / 200 / 300 / 400 / 500 mm" },
      { label: "Depth", value: "50 / 75 / 100 mm" },
      { label: "Length", value: "3,000 mm (standard)" },
      { label: "Load Rating", value: "Up to 150 kg/m" },
    ],
    minOrder: "200 pcs",
    leadTime: "15–20 business days",
    image: "https://picsum.photos/seed/cable-tray/800/500",
  },
  {
    slug: "j-hook-cable-support",
    name: "J-Hook Cable Support",
    category: "cable",
    tagline: "Steel J-hooks for data and low-voltage cable management",
    description:
      "Steel J-hook cable supports for horizontal runs of Cat5e/Cat6, fiber, and low-voltage cables. Snap-in rod attachment fits standard 3/8\" and 1/2\" threaded rod. Compliant with BICSI and NFPA 70 installation guidelines.",
    specs: [
      { label: "Material", value: "Steel (zinc plated)" },
      { label: "Capacity", value: "1\" / 2\" / 3\" / 4\" bundle diameter" },
      { label: "Rod Size", value: "3/8\" or 1/2\" threaded rod" },
      { label: "Finish", value: "Zinc Plated" },
      { label: "Compliance", value: "UL Listed options available" },
      { label: "Pack Size", value: "50 / 100 / 500 pcs" },
    ],
    minOrder: "1,000 pcs",
    leadTime: "10–12 business days",
    image: "https://picsum.photos/seed/j-hook/800/500",
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
git add apps/demo-export/lib/products.ts
git commit -m "feat(demo-export): add static product data for 6 hardware products"
```

---

## Task 3: Shared Components + Root Layout

**Files:**
- Create: `apps/demo-export/components/nav.tsx`
- Create: `apps/demo-export/components/footer.tsx`
- Create: `apps/demo-export/components/whatsapp-button.tsx`
- Create: `apps/demo-export/app/layout.tsx`

- [ ] **Step 1: Create `apps/demo-export/components/nav.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-primary tracking-tight">
          YC Metal
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: "/products", label: "Products" },
            { href: "/contact", label: "About" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="text-sm font-semibold px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Get a Quote
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
          <Link href="/contact" className="text-sm text-gray-700 hover:text-primary" onClick={() => setOpen(false)}>
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-semibold px-4 py-2 rounded-md bg-primary text-white text-center hover:bg-primary-dark transition-colors"
            onClick={() => setOpen(false)}
          >
            Get a Quote
          </Link>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create `apps/demo-export/components/footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="text-white font-bold text-lg mb-2">YC Metal</p>
          <p className="text-sm leading-relaxed">
            Wenzhou Yongchang Metal Products Co., Ltd.
          </p>
          <p className="text-sm mt-1">
            Industrial Zone, Yueqing, Wenzhou, Zhejiang, China
          </p>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Products</p>
          <ul className="space-y-2 text-sm">
            <li>Structural Brackets</li>
            <li>Fasteners &amp; Bolts</li>
            <li>Cable Management</li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold mb-3">Contact</p>
          <ul className="space-y-2 text-sm">
            <li>sales@yongchangmetal.com</li>
            <li>WhatsApp: +86 138 0000 0000</li>
            <li>Tel: +86 577 0000 0000</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-sm text-center text-gray-500">
        © {new Date().getFullYear()} Wenzhou Yongchang Metal Products Co., Ltd. All rights reserved.
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create `apps/demo-export/components/whatsapp-button.tsx`**

```tsx
export function WhatsAppButton() {
  const phone = "8613800000000";
  const message = encodeURIComponent("Hello, I'd like to inquire about your products.");

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

- [ ] **Step 4: Create `apps/demo-export/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: {
    template: "%s | YC Metal",
    default: "YC Metal — Structural Hardware Manufacturer & Exporter",
  },
  description:
    "OEM/ODM manufacturer of structural steel brackets, industrial fasteners, and cable management systems. Export to 50+ countries. ISO 9001:2015 certified.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

- [ ] **Step 5: Commit**

```bash
git add apps/demo-export/components/ apps/demo-export/app/layout.tsx
git commit -m "feat(demo-export): add nav, footer, WhatsApp button, and root layout"
```

---

## Task 4: Homepage

**Files:**
- Create: `apps/demo-export/app/page.tsx`

- [ ] **Step 1: Create `apps/demo-export/app/page.tsx`**

```tsx
import Link from "next/link";
import { CATEGORY_LABELS, type Category } from "@/lib/products";

const CATEGORIES: { key: Category; icon: string; desc: string }[] = [
  {
    key: "brackets",
    icon: "🔩",
    desc: "Wall brackets, angle brackets, and structural supports for warehousing and construction",
  },
  {
    key: "fasteners",
    icon: "⚙️",
    desc: "High-strength hex bolts, anchor bolts, and structural fasteners — metric and imperial",
  },
  {
    key: "cable",
    icon: "🔌",
    desc: "Perforated cable trays, J-hooks, and conduit systems for electrical and data installations",
  },
];

const WHY_US = [
  { icon: "🏭", title: "Factory Direct", desc: "Manufacturer since 2008. No middlemen, competitive pricing, and full control over quality." },
  { icon: "🔧", title: "Custom OEM/ODM", desc: "Custom dimensions, surface treatments, and packaging. Send us your drawings." },
  { icon: "🚢", title: "Export Ready", desc: "Experienced with FOB, CIF, and DAP terms. All major ports. LC and TT accepted." },
  { icon: "✅", title: "ISO 9001:2015", desc: "Certified quality management system. Test reports and SGS inspection available on request." },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-primary-light text-sm font-semibold uppercase tracking-widest mb-4">
            Wenzhou Yongchang Metal Products Co., Ltd.
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Your Reliable Partner for
            <br />
            Structural Hardware
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-4">
            OEM/ODM manufacturer of steel brackets, fasteners, and cable management systems.
            MOQ from 500 pcs. Export to 50+ countries.
          </p>
          <p className="text-sm text-blue-200 mb-10">
            ISO 9001:2015 Certified &nbsp;·&nbsp; Factory Since 2008 &nbsp;·&nbsp; 500+ Products
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="rounded-lg px-8 py-3 font-semibold bg-white text-primary hover:bg-blue-50 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="rounded-lg px-8 py-3 font-semibold border-2 border-white text-white hover:bg-white/10 transition-colors"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Product Categories</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Three core product lines covering structural, mechanical, and electrical installation needs
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
                <p className="mt-4 text-sm font-semibold text-primary">View Products →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Why Work With Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_US.map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-primary py-16 px-4 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Place an Order?</h2>
        <p className="text-blue-100 mb-8 max-w-lg mx-auto">
          Send us your specifications and we will reply with a competitive quote within 24 hours.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-lg px-8 py-3 font-semibold bg-white text-primary hover:bg-blue-50 transition-colors"
        >
          Get a Free Quote
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-export/app/page.tsx
git commit -m "feat(demo-export): add homepage with hero, categories, and CTA"
```

---

## Task 5: Products Listing Page

**Files:**
- Create: `apps/demo-export/app/products/page.tsx`

- [ ] **Step 1: Create `apps/demo-export/app/products/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS, CATEGORY_LABELS, type Category } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse our full range of structural brackets, fasteners, and cable management systems. OEM/ODM available, MOQ from 500 pcs.",
};

const CATEGORIES: Category[] = ["brackets", "fasteners", "cable"];

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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">Our Products</h1>
        <p className="text-gray-500 mb-8">
          {products.length} products &mdash; OEM/ODM available &mdash; MOQ from 500 pcs
        </p>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-primary transition-all"
            >
              <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {CATEGORY_LABELS[product.category]}
                </span>
                <h2 className="font-bold text-gray-800 mt-1 mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2">{product.tagline}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>MOQ: {product.minOrder}</span>
                  <span>Lead time: {product.leadTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Inquiry prompt */}
        <div className="mt-16 text-center bg-gray-50 rounded-2xl p-10">
          <h2 className="text-xl font-bold mb-2">Looking for a custom specification?</h2>
          <p className="text-gray-500 mb-6">
            We accept OEM/ODM orders. Send us your drawings or requirements and we will quote within 24 hours.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Send an Inquiry
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-export/app/products/page.tsx
git commit -m "feat(demo-export): add products listing page with category filter"
```

---

## Task 6: Product Detail Page

**Files:**
- Create: `apps/demo-export/app/products/[slug]/page.tsx`

- [ ] **Step 1: Create `apps/demo-export/app/products/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PRODUCTS, CATEGORY_LABELS, getProductBySlug } from "@/lib/products";

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
          <Link href="/products" className="hover:text-primary">
            Products
          </Link>
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
            <p className="text-gray-500 mb-6">{product.description}</p>

            <div className="flex gap-4 text-sm text-gray-600 mb-8">
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-800">MOQ:</span> {product.minOrder}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-800">Lead time:</span> {product.leadTime}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/contact?product=${encodeURIComponent(product.name)}`}
                className="flex-1 text-center rounded-lg px-6 py-3 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Request a Quote
              </Link>
              <a
                href={`https://wa.me/8613800000000?text=${encodeURIComponent(
                  `Hi, I'm interested in ${product.name}. Please send me a quote.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center rounded-lg px-6 py-3 font-semibold border-2 border-[#25D366] text-[#25D366] hover:bg-green-50 transition-colors"
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
                  <tr
                    key={spec.label}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 font-medium text-gray-700 w-1/3">
                      {spec.label}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Related products hint */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to all products
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-export/app/products/
git commit -m "feat(demo-export): add product detail page with specs table and inquiry CTA"
```

---

## Task 7: Inquiry Form

**Files:**
- Create: `apps/demo-export/app/contact/actions.ts`
- Create: `apps/demo-export/app/contact/page.tsx`

- [ ] **Step 1: Create `apps/demo-export/app/contact/actions.ts`**

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
  const product = formData.get("product")?.toString().trim() ?? "";
  const country = formData.get("country")?.toString().trim() ?? "";
  const rawMessage = formData.get("message")?.toString().trim() ?? "";

  if (!name || !email || !rawMessage) {
    return { error: "Name, email, and message are required." };
  }

  const message = [
    product && `Product of Interest: ${product}`,
    country && `Country: ${country}`,
    rawMessage,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      company: company || null,
      contact: email,
      message,
      locale: "demo-export",
    });

    if (error) throw error;
    return { success: true };
  } catch {
    return { error: "Submission failed. Please email us directly at sales@yongchangmetal.com." };
  }
}
```

- [ ] **Step 2: Create `apps/demo-export/app/contact/page.tsx`**

```tsx
import type { Metadata } from "next";
import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Send an inquiry for structural brackets, fasteners, or cable management products. We reply within 24 hours.",
};

type Props = {
  searchParams: Promise<{ product?: string }>;
};

export default async function ContactPage({ searchParams }: Props) {
  const { product } = await searchParams;

  return (
    <main className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">Request a Quote</h1>
        <p className="text-gray-500 mb-10">
          Fill in your requirements and we will reply with a competitive quote within 24 hours.
          For urgent inquiries, use the WhatsApp button on this page.
        </p>
        <InquiryForm defaultProduct={product} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create `apps/demo-export/app/contact/inquiry-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryFormState } from "./actions";
import { PRODUCTS, CATEGORY_LABELS } from "@/lib/products";

const initialState: InquiryFormState = {};

export function InquiryForm({ defaultProduct }: { defaultProduct?: string }) {
  const [state, action, isPending] = useActionState(submitInquiry, initialState);

  if (state.success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-3">Inquiry Received!</h2>
        <p className="text-gray-500">
          We will review your requirements and reply within 24 hours.
          Check your email for our response.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            Company Name
          </label>
          <input
            id="company"
            name="company"
            type="text"
            placeholder="ABC Construction Ltd."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
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
            placeholder="United States"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
          Product of Interest
        </label>
        <select
          id="product"
          name="product"
          defaultValue={defaultProduct ?? ""}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">Select a product (optional)</option>
          {PRODUCTS.map((p) => (
            <option key={p.slug} value={p.name}>
              {CATEGORY_LABELS[p.category]} — {p.name}
            </option>
          ))}
          <option value="Custom / Other">Custom specification / Other</option>
        </select>
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
          placeholder="Please describe your requirements: quantity, dimensions, surface treatment, delivery port, target price, etc."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg px-6 py-3 font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending..." : "Send Inquiry"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Or reach us directly:{" "}
        <a href="mailto:sales@yongchangmetal.com" className="hover:underline">
          sales@yongchangmetal.com
        </a>{" "}
        · WhatsApp: +86 138 0000 0000
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/demo-export/app/contact/
git commit -m "feat(demo-export): add inquiry form with Supabase server action"
```

---

## Task 8: Build Verify

**Files:** None created — this task runs the build and fixes any errors.

- [ ] **Step 1: Run full build**

```powershell
cd C:\Users\fanhu\Desktop\test\service-website
pnpm turbo build --filter=@repo/demo-export...
```

Expected output includes:
```
Route (app)                             Size
─────────────────────────────────────────
ƒ /                                    ...
ƒ /contact                             ...
ƒ /products                            ...
ƒ /products/[slug]                     ...
```

No TypeScript errors. If errors appear, fix them before continuing.

Common issues to look for:
- `params` type must be `Promise<{ slug: string }>` in Next.js 15 — the implementer should already have this right
- `searchParams` type must be `Promise<{ ... }>` in Next.js 15
- `useActionState` import must be from `"react"` not `"react-dom"`
- Any import from `@/lib/products` must match the exported names exactly

- [ ] **Step 2: Commit if any fixes were made**

Only commit if Step 1 required code fixes:

```bash
git add -p
git commit -m "fix(demo-export): resolve TypeScript build errors"
```

If Step 1 passed clean, skip this step.

- [ ] **Step 3: Note build success**

The demo site is now fully buildable. It can be started locally with:

```powershell
cd C:\Users\fanhu\Desktop\test\service-website
pnpm --filter @repo/demo-export dev
```

Visit `http://localhost:3001` to browse the demo.

---

## Self-Review

**Spec coverage:**
- ✓ New `apps/demo-export` app in the monorepo — Task 1
- ✓ English-only (no i18n) — architecture decision, no `next-intl` dependency
- ✓ Homepage: hero, product categories, why us, footer CTA — Task 4
- ✓ Products listing with category filter — Task 5
- ✓ Product detail page with specs table, quote CTA, WhatsApp CTA — Task 6
- ✓ Inquiry form with Supabase insert — Task 7
- ✓ WhatsApp floating button — Task 3
- ✓ Sticky nav with mobile menu — Task 3
- ✓ Footer with contact info — Task 3
- ✓ SEO metadata on all pages — layout.tsx default + per-page overrides
- ✓ Blue industrial theme (distinct from green main site) — Task 1 globals.css
- ✓ Build verify — Task 8

**Placeholder scan:**
- `yoursite.com` / `yongchangmetal.com` — intentional demo placeholders, the site is fictional
- `+86 138 0000 0000` — intentional demo placeholder phone number
- picsum.photos images — intentional placeholder images for demo
- No TBD, no TODO, no "implement later"

**Type consistency:**
- `Product.slug` → `getProductBySlug(slug)` → `generateStaticParams` → URL param — all use `slug: string`
- `Category` type used in `CATEGORY_LABELS` record and `PRODUCTS` array — consistent
- `InquiryFormState` defined in `actions.ts`, imported in `inquiry-form.tsx` — shared type
- `submitInquiry(prevState, formData)` signature matches `useActionState` expectation
- `searchParams: Promise<{ product?: string }>` in contact page — matches Next.js 15 async params API
- `searchParams: Promise<{ category?: string }>` in products page — consistent
