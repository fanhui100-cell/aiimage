# Demo: Nexlink Electronics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `apps/demo-ai-support` — a premium industrial electronics company website with a searchable knowledge base / FAQ support center, demonstrating the "AI Customer Service Knowledge Base" product.

**Architecture:** Standalone Next.js 15 App Router (port 3005). The star feature is a client-side searchable FAQ knowledge base with category filters — all search is done via `Array.prototype.filter` on static data, no external search library needed. Deep violet brand color.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4 (OKLCH), Supabase SSR, TypeScript 5 with `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`

---

## File Structure

```
apps/demo-ai-support/
├── package.json                    # @repo/demo-ai-support, port 3005
├── tsconfig.json
├── next.config.ts
├── .env.example
├── app/
│   ├── globals.css                 # Deep violet OKLCH theme
│   ├── layout.tsx
│   ├── page.tsx                    # Home: hero, product families, industries, stats, CTA
│   ├── products/
│   │   └── page.tsx                # Product category grid with filter tabs
│   ├── support/
│   │   ├── page.tsx                # Support page wrapper
│   │   └── knowledge-base.tsx      # "use client" searchable FAQ with category filter
│   ├── documentation/
│   │   └── page.tsx                # Tabbed documentation (datasheets by product line)
│   └── contact/
│       ├── page.tsx
│       ├── contact-form.tsx
│       └── actions.ts
├── lib/
│   ├── data.ts                     # Products, FAQ entries, documentation entries
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

- [ ] **Step 1: package.json** — `@repo/demo-ai-support`, port 3005, same deps as demo-export

```json
{
  "name": "@repo/demo-ai-support",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3005",
    "build": "next build",
    "start": "next start --port 3005",
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

- [ ] **Step 2: tsconfig.json** — identical to demo-export pattern

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

- [ ] **Step 5: app/globals.css** — deep violet theme

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.40 0.18 280);
  --color-primary-dark: oklch(0.30 0.18 280);
  --color-primary-light: oklch(0.94 0.05 280);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.96 0.03 280);
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
    template: "%s | Nexlink Electronics",
    default: "Nexlink Electronics — Industrial Connectors & Cable Assemblies",
  },
  description:
    "Manufacturer of M12 sensors, industrial circular connectors, cable assemblies, and Ethernet solutions for automation, robotics, and harsh environments. IP67/IP68 rated.",
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
  { href: "/products", label: "Products" },
  { href: "/support", label: "Support" },
  { href: "/documentation", label: "Documentation" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-sm">NX</span>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Nexlink</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.slice(0, 3).map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">{l.label}</Link>
          ))}
          <Link href="/contact" className="ml-2 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors">
            Contact Sales
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

- [ ] **Step 9: components/footer.tsx** — dark footer, Nexlink Electronics branding, Shenzhen address

```tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">NX</span>
            <span className="font-bold text-white">Nexlink Electronics</span>
          </div>
          <p className="text-sm text-gray-400">Industrial connectivity solutions for automation, robotics, and harsh environments. IP67/IP68 rated. CE/UL certified.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Products</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {["M12 Sensors", "Circular Connectors", "Cable Assemblies", "Industrial Ethernet", "Power Connectors", "Field-wireable"].map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Shenzhen, Guangdong, China</li>
            <li>📧 sales@nexlinkelectronics.com</li>
            <li>📞 +86 755 0000 1111</li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-6 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
        <span>© 2025 Nexlink Electronics Co., Ltd.</span>
        <span>CE · UL · IP67/IP68 · RoHS Compliant</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 10: components/whatsapp-button.tsx** — identical pattern, phone 8613800000002

- [ ] **Step 11: Install and commit**

```bash
pnpm install
git add apps/demo-ai-support/
git commit -m "feat(demo-ai-support): scaffold, theme, layout, nav, footer"
```

---

### Task 2: Data + Homepage + Products Page

- [ ] **Step 1: lib/data.ts**

```ts
export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  certifications: string[];
};

export type FAQEntry = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type DocSection = {
  id: string;
  productLine: string;
  title: string;
  fileType: string;
  fileSize: string;
  revision: string;
};

export const PRODUCT_CATEGORIES = ["All", "M12 Sensors", "Circular Connectors", "Cable Assemblies", "Industrial Ethernet", "Power Connectors"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCTS: Product[] = [
  {
    id: "m12-prox",
    name: "M12 Inductive Proximity Sensor",
    category: "M12 Sensors",
    description: "Standard M12 inductive sensor for metal detection in harsh industrial environments. PNP/NPN output, IO-Link compatible.",
    specs: { "Sensing Range": "2–8mm", "Supply Voltage": "10–30V DC", "Output": "PNP/NPN NO+NC", "Protection": "IP67/IP68", "Connector": "M12 4-pin A-coded", "Temperature": "-25°C to +70°C" },
    certifications: ["CE", "UL", "RoHS"],
  },
  {
    id: "m12-photo",
    name: "M12 Photoelectric Sensor",
    category: "M12 Sensors",
    description: "Compact M12 photoelectric sensor for non-contact detection of any object. Diffuse, retro-reflective, and through-beam modes.",
    specs: { "Sensing Range": "100mm–8m (mode dependent)", "Supply Voltage": "10–30V DC", "Output": "PNP/NPN", "Protection": "IP67", "Connector": "M12 4-pin", "Response Time": "<1ms" },
    certifications: ["CE", "RoHS"],
  },
  {
    id: "circ-7-8",
    name: "7/8″ Circular Power Connector",
    category: "Circular Connectors",
    description: "Heavy-duty 7/8\" field-wireable connector for fieldbus power distribution. Accepts 18–12 AWG. Snap-lock or screw locking.",
    specs: { "Contacts": "5-pin", "Rated Voltage": "630V AC/DC", "Rated Current": "16A per pin", "Protection": "IP67", "Mating Cycles": "500+", "Cable Entry": "Pg11 / M20" },
    certifications: ["CE", "UL", "IP67"],
  },
  {
    id: "cable-assy-m12",
    name: "M12 Pre-Wired Cable Assembly",
    category: "Cable Assemblies",
    description: "Factory-assembled M12 cable with PUR jacket for drag-chain applications. Available in A, B, D, X coding. Custom lengths 0.3m–30m.",
    specs: { "Connector": "M12 4/5/8-pin", "Cable Type": "PUR drag-chain", "Length": "0.3m – 30m custom", "Temperature": "-40°C to +85°C", "Bend Radius": "7.5× cable diameter", "Shielding": "Optional" },
    certifications: ["CE", "RoHS", "UL"],
  },
  {
    id: "ethernet-m12",
    name: "M12 Industrial Ethernet Cable",
    category: "Industrial Ethernet",
    description: "Cat5e/Cat6a M12 D-coded Ethernet cable for PROFINET, EtherNet/IP, and EtherCAT. Shielded, 100Mbps–1Gbps rated.",
    specs: { "Coding": "D-coded (Ethernet)", "Standard": "Cat5e / Cat6a", "Speed": "100Mbps / 1Gbps", "Protection": "IP67", "Jacket": "PUR (drag-chain rated)", "EMI Shielding": "360° foil + braid" },
    certifications: ["CE", "UL", "PROFINET certified"],
  },
  {
    id: "power-connector",
    name: "Han® Compatible Industrial Power Connector",
    category: "Power Connectors",
    description: "Heavy rectangular industrial connector for high-voltage machine connections. Compatible with Han® B series housings. Up to 650V / 16A per contact.",
    specs: { "Contacts": "3+PE / 6+PE", "Rated Voltage": "650V", "Rated Current": "16A", "Protection": "IP65", "Coupling": "Screw / Snap-in", "Material": "PA66 GF30" },
    certifications: ["CE", "UL", "VDE"],
  },
];

export const FAQ_CATEGORIES = ["All", "Ordering", "Technical", "Certifications", "Shipping", "Returns", "Custom Orders"] as const;

export const FAQ_ENTRIES: FAQEntry[] = [
  { id: "f1", category: "Ordering", question: "What is the minimum order quantity (MOQ)?", answer: "For standard catalog items, MOQ is typically 50–100 pieces. Custom cable assemblies start at 50 pcs. M12 sensors and connectors: 10 pcs for sampling. Contact us for OEM pricing on larger volumes." },
  { id: "f2", category: "Ordering", question: "Do you accept credit card payments for samples?", answer: "Yes. For sample orders under USD $500, we accept Visa, Mastercard, and PayPal. For production orders, we accept T/T (bank wire), L/C at sight, and Western Union." },
  { id: "f3", category: "Technical", question: "What is the difference between A-coded and D-coded M12 connectors?", answer: "A-coded M12 connectors are used for sensors and actuators (up to 5-pin, 4A). D-coded M12 connectors are the standard for Ethernet (4-pin, 100Mbps/1Gbps). They are physically keyed differently and NOT interchangeable." },
  { id: "f4", category: "Technical", question: "Can I use a PVC-jacket cable in a drag chain application?", answer: "No. PVC cables are not rated for continuous flexing in drag chains. Always use PUR (polyurethane) jacket cables for drag-chain applications — they resist abrasion, oils, and repeated flex cycles. We stock both PVC and PUR options." },
  { id: "f5", category: "Technical", question: "What does IO-Link mean for M12 sensors?", answer: "IO-Link is a short-range digital communication standard (IEC 61131-9) that allows sensors to transmit process data, parameters, and diagnostics over a standard M12 cable. IO-Link sensors can be remotely configured and monitored via a master device." },
  { id: "f6", category: "Certifications", question: "Are your products CE and RoHS compliant?", answer: "Yes. All products in our standard catalog carry CE marking and are RoHS 2015/863/EU compliant. CE declarations of conformity are available for download. Product-specific certifications (UL, CSA, ATEX) are noted on each product datasheet." },
  { id: "f7", category: "Certifications", question: "Do you have UL listed products?", answer: "Selected products are UL listed, including our 7/8\" power connectors and M12 cable assemblies for the North American market. UL file numbers are available on request. Please specify UL listing when requesting a quote." },
  { id: "f8", category: "Shipping", question: "What are your standard lead times?", answer: "In-stock items: 3–5 business days worldwide. Custom cable assemblies: 7–15 business days. OEM/custom connector products: 20–35 business days depending on volume. Express DHL/FedEx available for urgent orders." },
  { id: "f9", category: "Shipping", question: "Do you ship to the United States and Europe?", answer: "Yes. We ship globally via DHL Express, FedEx International, and UPS. For larger orders, we offer sea freight consolidation from Shenzhen port. All shipments include commercial invoice, packing list, and certificate of origin." },
  { id: "f10", category: "Returns", question: "What is your return policy for catalog products?", answer: "We accept returns within 30 days for unused, undamaged products in original packaging. Custom cable assemblies are non-returnable unless there is a manufacturing defect. Please contact our sales team with photos before initiating a return." },
  { id: "f11", category: "Custom Orders", question: "Can you make custom cable assemblies with our logo or labels?", answer: "Yes. We offer full custom cable assemblies including: custom lengths, custom jacket colors, private-label connectors with your logo, custom labeling (heat shrink, print), and custom packaging. MOQ is 50 pcs for custom items." },
  { id: "f12", category: "Custom Orders", question: "Can you supply OEM-branded connectors?", answer: "Yes. For OEM orders of 500+ pieces per SKU, we can supply connectors and sensors with your brand molded into the housing, with custom part numbers and packaging. Lead time for tooling is 30–45 days for first production." },
];

export const DOC_SECTIONS: DocSection[] = [
  { id: "d1", productLine: "M12 Sensors", title: "M12 Proximity Sensor Series — Datasheet", fileType: "PDF", fileSize: "2.4 MB", revision: "Rev. 3.2" },
  { id: "d2", productLine: "M12 Sensors", title: "IO-Link Parameter Server — Configuration Guide", fileType: "PDF", fileSize: "1.1 MB", revision: "Rev. 2.0" },
  { id: "d3", productLine: "Circular Connectors", title: "7/8\" Power Connector Installation Manual", fileType: "PDF", fileSize: "3.8 MB", revision: "Rev. 1.5" },
  { id: "d4", productLine: "Circular Connectors", title: "M12 Connector Coding Guide (A/B/D/X/L/S)", fileType: "PDF", fileSize: "0.9 MB", revision: "Rev. 4.0" },
  { id: "d5", productLine: "Cable Assemblies", title: "PUR Cable Assembly Specification Sheet", fileType: "PDF", fileSize: "1.6 MB", revision: "Rev. 2.1" },
  { id: "d6", productLine: "Cable Assemblies", title: "Drag Chain Application Guide", fileType: "PDF", fileSize: "2.2 MB", revision: "Rev. 1.0" },
  { id: "d7", productLine: "Industrial Ethernet", title: "M12 D-Coded Ethernet Cable — PROFINET Conformance", fileType: "PDF", fileSize: "1.8 MB", revision: "Rev. 1.3" },
  { id: "d8", productLine: "Industrial Ethernet", title: "EtherCAT Wiring Best Practices", fileType: "PDF", fileSize: "0.7 MB", revision: "Rev. 1.0" },
  { id: "d9", productLine: "Power Connectors", title: "Han-Compatible Housing Selection Guide", fileType: "PDF", fileSize: "4.1 MB", revision: "Rev. 2.8" },
];

export const INDUSTRIES = [
  { name: "Factory Automation", desc: "Sensors and connectors for PLCs, conveyors, and assembly lines." },
  { name: "Robotics", desc: "Flexible PUR cables and IP67 connectors for robot arms and end effectors." },
  { name: "Food & Beverage", desc: "IP68 stainless sensors and FDA-compliant cables for washdown environments." },
  { name: "Renewable Energy", desc: "UV-resistant cables and high-current connectors for solar and wind." },
  { name: "Transportation", desc: "Vibration-rated connectors for rail, automotive testing, and EV charging." },
  { name: "Medical Equipment", desc: "Cleanroom-rated assemblies with biocompatible materials." },
];

export const STATS = [
  { value: "500+", label: "Product SKUs" },
  { value: "IP67/IP68", label: "Standard Protection" },
  { value: "40+", label: "Countries Served" },
  { value: "CE / UL", label: "Certified" },
];
```

- [ ] **Step 2: app/page.tsx** — Homepage

Sections:
1. **Hero** — Dark purple/gray (`bg-gray-900`) with subtle diagonal gradient, headline "Industrial Connectivity. Built for the Harshest Environments.", subheadline, CTAs: "Browse Products" + "Download Catalog (PDF)"
2. **Stats Bar** — 4 stats from STATS
3. **Product Families** — 5 product category cards (icon + name + short desc + "Shop Now" link to /products)
4. **Industries** — 6 industry cards in 2×3 grid from INDUSTRIES
5. **Support Highlight** — "24/7 Knowledge Base" call-out section linking to /support with search-box preview graphic
6. **Footer CTA** — "Need a Custom Solution?" with Contact Sales button

- [ ] **Step 3: app/products/page.tsx** — Category filter tabs + product grid

Include client-side category filter tabs at top. Use `"use client"` with `useState` for active category. Show all products, filter by category when tab clicked. Each product card: name, category badge, key specs table, certifications, "Request Quote" CTA.

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { PRODUCTS, PRODUCT_CATEGORIES } from "@/lib/data";

export default function ProductsPage() {
  const [active, setActive] = useState<string>("All");
  const filtered = active === "All" ? PRODUCTS : PRODUCTS.filter(p => p.category === active);

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Products</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Industrial Connectivity Products</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">From M12 sensors to heavy-duty power connectors — everything for your industrial application.</p>
        </div>
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${active === cat ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-2">{product.category}</span>
                  <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-5">{product.description}</p>
              <div className="space-y-2 mb-5">
                {Object.entries(product.specs).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-gray-50 pb-1.5">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {product.certifications.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-mono">{c}</span>
                  ))}
                </div>
                <Link href="/contact" className="rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors">
                  Request Quote →
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

Note: since this uses `useState`, add `"use client"` at the top and export without `metadata`. Create a separate `app/products/layout.tsx` for metadata if needed, or simply omit metadata for this page.

- [ ] **Step 4: Commit**

```bash
git add apps/demo-ai-support/lib/data.ts apps/demo-ai-support/app/page.tsx apps/demo-ai-support/app/products/
git commit -m "feat(demo-ai-support): data, homepage, products with category filter"
```

---

### Task 3: Support Knowledge Base (Star Feature)

**Files:** app/support/knowledge-base.tsx, app/support/page.tsx

- [ ] **Step 1: Create app/support/knowledge-base.tsx**

```tsx
"use client";
import { useState, useMemo } from "react";
import { FAQ_ENTRIES, FAQ_CATEGORIES } from "@/lib/data";

export function KnowledgeBase() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return FAQ_ENTRIES.filter((entry) => {
      const matchesCat = activeCategory === "All" || entry.category === activeCategory;
      const matchesQuery =
        q.length === 0 ||
        entry.question.toLowerCase().includes(q) ||
        entry.answer.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search the knowledge base… (e.g. 'IP67', 'MOQ', 'IO-Link')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 py-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {FAQ_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 text-center mb-6">
        {filtered.length === 0
          ? "No results found. Try a different search term."
          : `${filtered.length} article${filtered.length !== 1 ? "s" : ""} found`}
      </p>

      {/* FAQ accordion */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary-light text-primary text-xs font-semibold mr-2">{entry.category}</span>
                <span className="text-sm font-semibold text-gray-900">{entry.question}</span>
              </div>
              <svg
                className={`flex-shrink-0 w-5 h-5 text-gray-400 transition-transform mt-0.5 ${expandedId === entry.id ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedId === entry.id && (
              <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                {entry.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Can't find answer CTA */}
      <div className="max-w-3xl mx-auto mt-10 bg-primary-light rounded-2xl p-7 text-center">
        <h3 className="font-bold text-gray-900 mb-2">Can't find your answer?</h3>
        <p className="text-sm text-gray-500 mb-4">Our technical team responds within 4 business hours.</p>
        <a href="/contact" className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors">
          Contact Technical Support →
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/support/page.tsx**

```tsx
import type { Metadata } from "next";
import { KnowledgeBase } from "./knowledge-base";

export const metadata: Metadata = { title: "Support & Knowledge Base" };

export default function SupportPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">
            Support Center
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Knowledge Base</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Find answers to technical questions, ordering policies, certifications, and shipping information.
          </p>
        </div>
        <KnowledgeBase />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/demo-ai-support/app/support/
git commit -m "feat(demo-ai-support): searchable knowledge base with category filter"
```

---

### Task 4: Documentation + Contact + Build

**Files:** app/documentation/page.tsx, app/contact/actions.ts, app/contact/contact-form.tsx, app/contact/page.tsx

- [ ] **Step 1: Create app/documentation/page.tsx**

Tabbed documentation page. Use `"use client"` + `useState` for active tab. Tabs = unique product lines from DOC_SECTIONS. Show filtered documents as download-card rows (icon + title + revision + file size + "Download" button that's `href="#"` for demo).

```tsx
"use client";
import { useState } from "react";
import { DOC_SECTIONS } from "@/lib/data";

const PRODUCT_LINES = ["All", ...Array.from(new Set(DOC_SECTIONS.map(d => d.productLine)))];

export default function DocumentationPage() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? DOC_SECTIONS : DOC_SECTIONS.filter(d => d.productLine === active);

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-semibold uppercase tracking-widest">Documentation</span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Datasheets & Manuals</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Download technical datasheets, installation guides, and conformance certificates for all product lines.</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {PRODUCT_LINES.map(line => (
            <button key={line} onClick={() => setActive(line)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${active === line ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{line}</button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="text-red-500 text-xs font-bold">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{doc.title}</div>
                <div className="text-xs text-gray-400">{doc.productLine} · {doc.revision} · {doc.fileSize}</div>
              </div>
              <a href="#" className="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors">
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create contact form** (actions.ts + contact-form.tsx + page.tsx)

Standard contact form with fields: name*, company, email*, country, product interest (dropdown from PRODUCT_CATEGORIES), message*. locale: "demo-ai-support".

actions.ts:
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
  const product = formData.get("product");
  const message = formData.get("message");

  if (!name || typeof name !== "string" || name.trim().length < 2) return { error: "Please enter your name." };
  if (!email || typeof email !== "string" || !email.includes("@")) return { error: "Please enter a valid email." };
  if (!message || typeof message !== "string" || message.trim().length < 10) return { error: "Please describe your requirements." };

  const fullMessage = [product ? `Product Interest: ${product}` : null, `\n${message}`].filter(Boolean).join("\n");

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name: String(name).trim(),
    company: company ? String(company).trim() : null,
    contact: String(email).trim(),
    message: fullMessage,
    locale: "demo-ai-support",
  });

  if (error) return { error: "Submission failed. Please try again." };
  return { success: true };
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @repo/demo-ai-support build`
Expected: Exit 0, routes `/`, `/products`, `/support`, `/documentation`, `/contact` all present.

- [ ] **Step 4: Commit**

```bash
git add apps/demo-ai-support/app/documentation/ apps/demo-ai-support/app/contact/
git commit -m "feat(demo-ai-support): documentation, contact — demo complete"
```
