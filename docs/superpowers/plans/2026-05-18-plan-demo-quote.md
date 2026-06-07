# Demo: FlexPack Solutions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `apps/demo-quote` — a premium custom packaging company website with an interactive online quote calculator, demonstrating the "Online Quoting System" product.

**Architecture:** Standalone Next.js 15 App Router (port 3004). The star feature is a client-side 3-step quote calculator that computes an estimated price range from user inputs (type, dimensions, quantity, print options). No cart, no i18n. Forest-green brand.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4 (OKLCH), Supabase SSR, TypeScript 5 with `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`

---

## File Structure

```
apps/demo-quote/
├── package.json                    # @repo/demo-quote, port 3004
├── tsconfig.json
├── next.config.ts
├── .env.example
├── app/
│   ├── globals.css                 # Forest-green OKLCH theme
│   ├── layout.tsx
│   ├── page.tsx                    # Home: hero, product types, process, CTA
│   ├── products/
│   │   └── page.tsx                # 6 packaging categories with specs
│   ├── quote/
│   │   ├── page.tsx                # Quote page wrapper
│   │   └── quote-calculator.tsx    # "use client" 3-step calculator
│   ├── gallery/
│   │   └── page.tsx                # Project showcase grid (mock)
│   └── contact/
│       ├── page.tsx
│       ├── contact-form.tsx
│       └── actions.ts
├── lib/
│   ├── data.ts                     # Products, pricing matrix, gallery items
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── components/
    ├── nav.tsx
    ├── footer.tsx
    └── whatsapp-button.tsx
```

---

### Task 1: Scaffold + Theme + Supabase Clients + Components

**Files:** package.json, tsconfig.json, next.config.ts, .env.example, globals.css, layout.tsx, lib/supabase/*.ts, components/*.tsx

- [ ] **Step 1: package.json**

```json
{
  "name": "@repo/demo-quote",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3004",
    "build": "next build",
    "start": "next start --port 3004",
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

- [ ] **Step 2: tsconfig.json** (identical pattern to demo-export)

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

- [ ] **Step 5: app/globals.css** — forest green theme

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.40 0.14 148);
  --color-primary-dark: oklch(0.30 0.14 148);
  --color-primary-light: oklch(0.93 0.05 148);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.96 0.03 148);
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

- [ ] **Step 6: app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: {
    template: "%s | FlexPack Solutions",
    default: "FlexPack Solutions — Custom Packaging Manufacturer & Exporter",
  },
  description:
    "Custom corrugated boxes, folding cartons, rigid boxes, and mailers. Full-color printing, eco-friendly materials. MOQ 500 pcs. Get an instant quote online.",
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

- [ ] **Step 7: lib/supabase/client.ts and server.ts** — identical to demo-engineering (createBrowserClient / createServerClient with cookie handling)

- [ ] **Step 8: components/nav.tsx**

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/products", label: "Products" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm">FP</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">FlexPack</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            href="/quote"
            className="ml-2 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Get a Quote
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
          {[...LINKS, { href: "/quote", label: "Get a Quote" }].map((l) => (
            <Link key={l.href} href={l.href} className="block text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 9: components/footer.tsx**

Dark footer with FlexPack branding. Columns: About (logo + tagline), Products (6 types), Contact (Dongguan address, email, phone). Copyright + "FSC Certified · ISO 9001".

```tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">FP</span>
            <span className="font-bold text-white">FlexPack Solutions</span>
          </div>
          <p className="text-sm text-gray-400">Custom packaging for global brands. FSC-certified materials, full-color printing, worldwide export.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Products</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {["Corrugated Boxes", "Folding Cartons", "Rigid Boxes", "Mailers & Sleeves", "Flexible Pouches", "Custom Labels"].map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Dongguan, Guangdong, China</li>
            <li>📧 sales@flexpacksolutions.com</li>
            <li>📞 +86 769 0000 0000</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-6 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
        <span>© 2025 FlexPack Solutions Co., Ltd.</span>
        <span>FSC Certified · ISO 9001:2015 · Eco-Friendly Materials</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: components/whatsapp-button.tsx** — identical pattern, phone 8613800000001

- [ ] **Step 11: Install and commit**

```bash
pnpm install
git add apps/demo-quote/
git commit -m "feat(demo-quote): scaffold, theme, layout, nav, footer"
```

---

### Task 2: Data + Homepage + Products Page

**Files:** lib/data.ts, app/page.tsx, app/products/page.tsx

- [ ] **Step 1: lib/data.ts**

```ts
export type PackagingProduct = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  moq: string;
  leadTime: string;
  materials: string[];
  printOptions: string[];
  useCases: string[];
  basePrice: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  category: string;
  client: string;
  description: string;
};

export const PRODUCTS: PackagingProduct[] = [
  {
    id: "corrugated",
    name: "Corrugated Boxes",
    tagline: "Durable shipping protection",
    description: "Single-wall, double-wall, and triple-wall corrugated boxes for every shipping need. Custom sizes, die-cuts, and full-color litho-laminate printing available.",
    moq: "500 pcs",
    leadTime: "10–15 business days",
    materials: ["B-flute", "C-flute", "E-flute", "BC-flute", "Recycled Kraft"],
    printOptions: ["Flexo (1–4 colors)", "Digital full-color", "Litho-laminate"],
    useCases: ["E-commerce shipping", "Electronics", "Food & beverage", "Industrial parts"],
    basePrice: "From $0.45/pc",
  },
  {
    id: "folding-cartons",
    name: "Folding Cartons",
    tagline: "Retail-ready presentation boxes",
    description: "Tuck-end, sleeve, gable-top, and auto-bottom cartons for retail display. High-definition CMYK printing with premium coating options.",
    moq: "1,000 pcs",
    leadTime: "12–18 business days",
    materials: ["SBS Paperboard", "CCNB", "Kraft Board", "White Back"],
    printOptions: ["CMYK offset", "Spot UV", "Foil stamping", "Embossing"],
    useCases: ["Cosmetics", "Food products", "Pharmaceuticals", "Consumer goods"],
    basePrice: "From $0.25/pc",
  },
  {
    id: "rigid-boxes",
    name: "Rigid Boxes",
    tagline: "Premium unboxing experience",
    description: "Luxury rigid set-up boxes with magnetic closures, ribbon pulls, and custom foam inserts. Perfect for premium brands demanding exceptional unboxing.",
    moq: "200 pcs",
    leadTime: "15–20 business days",
    materials: ["Greyboard 1200g+", "Art Paper Wrap", "Velvet Lining", "EVA Foam"],
    printOptions: ["Offset + laminate", "Foil stamping", "Spot UV", "Screen print"],
    useCases: ["Jewelry", "Electronics accessories", "Gift sets", "Luxury apparel"],
    basePrice: "From $2.80/pc",
  },
  {
    id: "mailers",
    name: "Poly Mailers & Sleeves",
    tagline: "Lightweight, eco-friendly shipping",
    description: "Recyclable poly mailers, paper mailers, and sleeve packaging for apparel and soft goods. Tamper-evident seals, custom printing, biodegradable options.",
    moq: "1,000 pcs",
    leadTime: "7–12 business days",
    materials: ["LDPE (recyclable)", "Kraft paper", "Bubble-lined", "Compostable PLA"],
    printOptions: ["Flexo (2 colors)", "Digital (full-color)", "Pantone match"],
    useCases: ["Apparel", "Accessories", "Books", "Flat items"],
    basePrice: "From $0.12/pc",
  },
  {
    id: "pouches",
    name: "Flexible Pouches",
    tagline: "Stand-up packaging with shelf appeal",
    description: "Stand-up pouches, flat pouches, and spout pouches with barrier protection for food, supplements, and chemicals. Resealable zippers available.",
    moq: "3,000 pcs",
    leadTime: "15–20 business days",
    materials: ["PET/PE laminate", "Kraft/PE", "Metalized PET", "Compostable"],
    printOptions: ["Rotogravure (full-color)", "Digital", "Matte/Gloss finish"],
    useCases: ["Food & snacks", "Coffee", "Supplements", "Pet food"],
    basePrice: "From $0.18/pc",
  },
  {
    id: "labels",
    name: "Custom Labels & Stickers",
    tagline: "Brand every surface",
    description: "Die-cut labels in any shape — round, oval, rectangular, or fully custom. Waterproof, UV-resistant, and food-safe options available in rolls or sheets.",
    moq: "1,000 pcs",
    leadTime: "5–8 business days",
    materials: ["BOPP", "Paper", "Clear PET", "Kraft", "Metallic"],
    printOptions: ["Digital CMYK", "Foil", "Spot UV", "Textured finishes"],
    useCases: ["Product labels", "Shipping labels", "Brand stickers", "Promotional"],
    basePrice: "From $0.05/pc",
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: "g1", title: "Luxury Skincare Gift Set", category: "Rigid Boxes", client: "Beauty Brand — EU", description: "Magnetic closure rigid box with gold foil stamping and velvet interior for premium skincare launch." },
  { id: "g2", title: "Organic Coffee Pouches", category: "Flexible Pouches", client: "Coffee Roaster — USA", description: "Kraft stand-up pouches with one-way valve, resealable zipper, and matte laminate." },
  { id: "g3", title: "Electronics Shipping Kit", category: "Corrugated Boxes", client: "Tech Brand — Germany", description: "Double-wall corrugated with custom foam insert and full-color litho-laminate exterior." },
  { id: "g4", title: "Apparel E-Commerce Mailers", category: "Poly Mailers", client: "Fashion Brand — UK", description: "Biodegradable poly mailers with fun full-color print and tamper-evident seal." },
  { id: "g5", title: "Supplement Carton Range", category: "Folding Cartons", client: "Health Brand — Australia", description: "12-SKU supplement line in SBS folding cartons with embossed logo and spot UV." },
  { id: "g6", title: "Gourmet Snack Labels", category: "Labels", client: "Food Producer — Canada", description: "BOPP waterproof labels with metallic gold finish for premium snack products." },
];

export const PROCESS_STEPS = [
  { step: "01", title: "Get Instant Estimate", desc: "Use our online calculator to get a price range in 60 seconds." },
  { step: "02", title: "Submit Your RFQ", desc: "Share artwork, dimensions, and quantities for a formal quote." },
  { step: "03", title: "Approve Sample", desc: "We produce a physical sample before full production." },
  { step: "04", title: "Production & QC", desc: "Strict quality control at every production stage." },
  { step: "05", title: "Global Delivery", desc: "Door-to-door shipping via sea, air, or express courier." },
];
```

- [ ] **Step 2: app/page.tsx** — Homepage

Sections:
1. **Hero** — Dark green bg (`bg-gray-900`), white headline "Custom Packaging That Sells Your Brand", subheadline, two CTAs: "Get an Instant Quote" (→ /quote) + "View Products"
2. **Stats bar** — 4 stats: "500+ clients", "50M+ pcs/year", "10–20 day lead time", "60+ countries"
3. **Product Types** — 6 cards in a 2×3 grid (from PRODUCTS): name + tagline + moq + basePrice + "Learn More" link to /products
4. **Process** — 5-step horizontal/vertical timeline using PROCESS_STEPS
5. **Footer CTA** — "Ready to Start Your Packaging Project?" with Get Quote button

All cards: `rounded-2xl border border-gray-100 shadow-sm`. Primary CTA buttons: `bg-primary text-white`. Hero uses dark green overlay.

- [ ] **Step 3: app/products/page.tsx** — Products page

Header: "Our Packaging Solutions". Full-width cards (stacked vertically) for each product showing: name, description, MOQ, lead time, materials chips, print options chips, use cases, base price, and "Get a Quote →" CTA linking to /quote.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS } from "@/lib/data";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Our Products
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Packaging Solutions</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            From corrugated shipping boxes to luxury rigid packaging — we manufacture custom solutions for every industry and budget.
          </p>
        </div>
        <div className="space-y-6">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{p.name}</h2>
                  <p className="text-primary text-sm font-medium">{p.tagline}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-gray-900">{p.basePrice}</div>
                  <div className="text-xs text-gray-400">MOQ: {p.moq}</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-5">{p.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { label: "Materials", items: p.materials },
                  { label: "Print Options", items: p.printOptions },
                  { label: "Use Cases", items: p.useCases },
                ].map(({ label, items }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span key={item} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-sm text-gray-400">Lead time: {p.leadTime}</span>
                <Link href="/quote" className="rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors">
                  Get a Quote →
                </Link>
              </div>
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
git add apps/demo-quote/lib/data.ts apps/demo-quote/app/page.tsx apps/demo-quote/app/products/
git commit -m "feat(demo-quote): data, homepage, products page"
```

---

### Task 3: Quote Calculator (Star Feature)

**Files:** app/quote/page.tsx, app/quote/quote-calculator.tsx

This is the unique interactive feature. A 3-step client-side calculator that shows a price estimate, then offers a form to submit a formal RFQ.

- [ ] **Step 1: Create app/quote/quote-calculator.tsx**

```tsx
"use client";
import { useState } from "react";
import { useActionState } from "react";
import { submitQuoteRFQ, type QuoteRFQState } from "./actions";

// --- Pricing logic (pure, no server needed) ---
const BASE_PRICES: Record<string, number> = {
  corrugated: 0.45, "folding-cartons": 0.25, "rigid-boxes": 2.80,
  mailers: 0.12, pouches: 0.18, labels: 0.05,
};
const QTY_DISCOUNTS: [number, number][] = [
  [500, 1.0], [1000, 0.92], [5000, 0.82], [10000, 0.75], [50000, 0.68],
];
const PRINT_MULTIPLIERS: Record<string, number> = {
  none: 1.0, "1-color": 1.15, "cmyk": 1.35, "foil-spot": 1.65, "full-premium": 2.0,
};
const SIZE_MULTIPLIERS: Record<string, number> = { small: 1.0, medium: 1.4, large: 2.0, "extra-large": 2.8 };

function calcPrice(type: string, qty: number, print: string, size: string): { low: number; high: number } {
  const base = BASE_PRICES[type] ?? 0.5;
  const qtyFactor = QTY_DISCOUNTS.findLast(([min]) => qty >= min)?.[1] ?? 1.0;
  const printFactor = PRINT_MULTIPLIERS[print] ?? 1.0;
  const sizeFactor = SIZE_MULTIPLIERS[size] ?? 1.0;
  const unit = base * qtyFactor * printFactor * sizeFactor;
  return { low: Math.round(unit * 0.9 * 100) / 100, high: Math.round(unit * 1.1 * 100) / 100 };
}

type Step1Data = { type: string };
type Step2Data = { size: string; qty: number };
type Step3Data = { print: string; finish: string };

const PRODUCT_TYPES = [
  { id: "corrugated", label: "Corrugated Boxes", desc: "Shipping & storage" },
  { id: "folding-cartons", label: "Folding Cartons", desc: "Retail display" },
  { id: "rigid-boxes", label: "Rigid Boxes", desc: "Premium unboxing" },
  { id: "mailers", label: "Poly Mailers", desc: "Lightweight shipping" },
  { id: "pouches", label: "Flexible Pouches", desc: "Food & supplement" },
  { id: "labels", label: "Custom Labels", desc: "Any surface" },
];
const SIZES = [
  { id: "small", label: "Small", desc: "< 20×15×10 cm" },
  { id: "medium", label: "Medium", desc: "20–40×20–30 cm" },
  { id: "large", label: "Large", desc: "40–60×30–50 cm" },
  { id: "extra-large", label: "Extra Large", desc: "> 60cm any side" },
];
const PRINT_OPTIONS = [
  { id: "none", label: "Plain / Unprinted" },
  { id: "1-color", label: "1–2 Color Flexo" },
  { id: "cmyk", label: "Full-Color CMYK" },
  { id: "foil-spot", label: "CMYK + Foil / Spot UV" },
  { id: "full-premium", label: "Premium (Foil + Emboss + Spot UV)" },
];
const FINISHES = ["Matte Laminate", "Gloss Laminate", "Soft-Touch", "No Coating"];

const initialRFQState: QuoteRFQState = {};

export function QuoteCalculator() {
  const [step, setStep] = useState(1);
  const [s1, setS1] = useState<Step1Data>({ type: "" });
  const [s2, setS2] = useState<Step2Data>({ size: "medium", qty: 1000 });
  const [s3, setS3] = useState<Step3Data>({ print: "cmyk", finish: "Matte Laminate" });
  const [showForm, setShowForm] = useState(false);
  const [rfqState, rfqAction, rfqPending] = useActionState(submitQuoteRFQ, initialRFQState);

  const estimate = s1.type ? calcPrice(s1.type, s2.qty, s3.print, s2.size) : null;

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-10">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= n ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>{n}</div>
          {n < 3 && <div className={`w-16 h-0.5 transition-colors ${step > n ? "bg-primary" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );

  if (rfqState.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-5 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">RFQ Submitted!</h2>
        <p className="text-gray-500 max-w-md">Our packaging specialists will send you a detailed quote with samples within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator />

      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">What type of packaging do you need?</h2>
          <p className="text-sm text-gray-400 text-center mb-6">Select the packaging type that best matches your project.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRODUCT_TYPES.map((pt) => (
              <button
                key={pt.id}
                type="button"
                onClick={() => { setS1({ type: pt.id }); setStep(2); }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary hover:shadow-sm ${s1.type === pt.id ? "border-primary bg-primary-light" : "border-gray-200 bg-white"}`}
              >
                <div className="font-semibold text-gray-900 text-sm mb-0.5">{pt.label}</div>
                <div className="text-xs text-gray-400">{pt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Size & Quantity</h2>
          <p className="text-sm text-gray-400 text-center mb-6">Choose the approximate box/product size and your order quantity.</p>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Approximate Size</label>
              <div className="grid grid-cols-2 gap-3">
                {SIZES.map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setS2((p) => ({ ...p, size: sz.id }))}
                    className={`rounded-xl border-2 p-3 text-left transition-all hover:border-primary ${s2.size === sz.id ? "border-primary bg-primary-light" : "border-gray-200 bg-white"}`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{sz.label}</div>
                    <div className="text-xs text-gray-400">{sz.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Order Quantity: <span className="text-primary">{s2.qty.toLocaleString()} pcs</span>
              </label>
              <input
                type="range"
                min={500} max={100000} step={500}
                value={s2.qty}
                onChange={(e) => setS2((p) => ({ ...p, qty: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>500</span><span>100,000</span></div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors">← Back</button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Print & Finish</h2>
          <p className="text-sm text-gray-400 text-center mb-6">Choose your print level and surface finish.</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Print Options</label>
              <div className="space-y-2">
                {PRINT_OPTIONS.map((po) => (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() => setS3((p) => ({ ...p, print: po.id }))}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all hover:border-primary ${s3.print === po.id ? "border-primary bg-primary-light text-primary" : "border-gray-200 bg-white text-gray-700"}`}
                  >
                    {po.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Surface Finish</label>
              <div className="grid grid-cols-2 gap-2">
                {FINISHES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setS3((p) => ({ ...p, finish: f }))}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all hover:border-primary ${s3.finish === f ? "border-primary bg-primary-light text-primary" : "border-gray-200 bg-white text-gray-700"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price estimate result */}
          {estimate && (
            <div className="mt-6 rounded-2xl bg-primary text-white p-6 text-center">
              <div className="text-sm font-medium text-primary-foreground/80 mb-1">Estimated Unit Price</div>
              <div className="text-4xl font-bold mb-1">${estimate.low} – ${estimate.high}</div>
              <div className="text-sm text-primary-foreground/80">per piece · {s2.qty.toLocaleString()} pcs · prices are estimates only</div>
              <div className="text-sm text-primary-foreground/80 mt-1">
                Total estimate: <span className="font-semibold">${(estimate.low * s2.qty).toLocaleString()} – ${(estimate.high * s2.qty).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors">← Back</button>
            <button type="button" onClick={() => setShowForm(true)} className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">Request Formal Quote →</button>
          </div>
        </div>
      )}

      {/* RFQ form shown after step 3 */}
      {showForm && step === 3 && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h3 className="font-bold text-gray-900 mb-5">Complete Your RFQ</h3>
          {rfqState.error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{rfqState.error}</div>
          )}
          <form action={rfqAction} className="space-y-4">
            <input type="hidden" name="productType" value={s1.type} />
            <input type="hidden" name="size" value={s2.size} />
            <input type="hidden" name="quantity" value={s2.qty} />
            <input type="hidden" name="printOption" value={s3.print} />
            <input type="hidden" name="finish" value={s3.finish} />
            {estimate && <input type="hidden" name="estimate" value={`$${estimate.low}–$${estimate.high}/pc`} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name <span className="text-red-400">*</span></label>
                <input name="name" type="text" required placeholder="Jane Smith" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email <span className="text-red-400">*</span></label>
                <input name="email" type="email" required placeholder="jane@brand.com" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company</label>
                <input name="company" type="text" placeholder="Your Brand Ltd." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Country</label>
                <input name="country" type="text" placeholder="United States" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Additional Details</label>
              <textarea name="notes" rows={3} placeholder="Artwork ready? Special dimensions? Rush order? Other requirements..." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none" />
            </div>
            <button type="submit" disabled={rfqPending} className="w-full rounded-xl px-6 py-3.5 font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-40">
              {rfqPending ? "Submitting…" : "Submit RFQ →"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create app/quote/actions.ts**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";

export type QuoteRFQState = { success?: boolean; error?: string };

export async function submitQuoteRFQ(
  _prevState: QuoteRFQState,
  formData: FormData
): Promise<QuoteRFQState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const company = formData.get("company");
  const country = formData.get("country");
  const notes = formData.get("notes");
  const productType = formData.get("productType");
  const size = formData.get("size");
  const quantity = formData.get("quantity");
  const printOption = formData.get("printOption");
  const finish = formData.get("finish");
  const estimate = formData.get("estimate");

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { error: "Please enter your name." };
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const message = [
    `Product Type: ${productType}`,
    `Size: ${size}`,
    `Quantity: ${quantity} pcs`,
    `Print Option: ${printOption}`,
    `Finish: ${finish}`,
    `Price Estimate: ${estimate}`,
    notes ? `\nAdditional Notes:\n${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name: String(name).trim(),
    company: company ? String(company).trim() : null,
    contact: String(email).trim(),
    message,
    locale: "demo-quote",
  });

  if (error) return { error: "Submission failed. Please try again." };
  return { success: true };
}
```

- [ ] **Step 3: Create app/quote/page.tsx**

```tsx
import type { Metadata } from "next";
import { QuoteCalculator } from "./quote-calculator";

export const metadata: Metadata = { title: "Get a Quote" };

export default function QuotePage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Instant Estimate
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get a Packaging Quote</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Answer 3 simple questions and get an instant price estimate. Then submit your RFQ for a formal quote within 24 hours.
          </p>
        </div>
        <QuoteCalculator />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/demo-quote/app/quote/
git commit -m "feat(demo-quote): interactive quote calculator with price estimate"
```

---

### Task 4: Gallery + Contact + Build Verification

**Files:** app/gallery/page.tsx, app/contact/page.tsx, app/contact/contact-form.tsx, app/contact/actions.ts

- [ ] **Step 1: Create app/gallery/page.tsx**

Masonry-style grid of GALLERY_ITEMS from data.ts. Each card: title, category badge, client info, description. Header: "Our Work" with subtitle.

```tsx
import type { Metadata } from "next";
import { GALLERY_ITEMS } from "@/lib/data";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Portfolio</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Work</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">A selection of custom packaging projects we've produced for brands around the world.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="bg-gradient-to-br from-primary-light to-secondary h-40 flex items-center justify-center">
                <div className="text-5xl opacity-60">📦</div>
              </div>
              <div className="p-5">
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-2">{item.category}</span>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400 mb-2">Client: {item.client}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create contact form** (app/contact/actions.ts + contact-form.tsx + page.tsx)

Standard contact form: name*, email*, company, country, message*. Same pattern as demo-engineering but with locale "demo-quote".

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @repo/demo-quote build`
Expected: Exit 0, no TypeScript errors, routes `/`, `/products`, `/quote`, `/gallery`, `/contact` all present.

- [ ] **Step 4: Commit**

```bash
git add apps/demo-quote/app/gallery/ apps/demo-quote/app/contact/
git commit -m "feat(demo-quote): gallery, contact form — demo complete"
```
