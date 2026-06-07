# Plan A1: Monorepo Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Turborepo monorepo with the Next.js 15 main app, shared UI components, next-intl i18n skeleton (zh/en), and Supabase client — ready for local development.

**Architecture:** Turborepo monorepo with `apps/main` (Next.js 15 App Router) and `packages/ui` (shared shadcn/ui components). All apps share TypeScript and ESLint config from `packages/config`. next-intl handles `/[locale]/` routing with zh and en. Supabase client split into browser and server variants.

**Tech Stack:** Node 20+, pnpm 9+, Turborepo 2, Next.js 15, Tailwind CSS 4, shadcn/ui, next-intl 3, @supabase/ssr 0.x, TypeScript 5, Vitest 2, @testing-library/react 16

---

## File Map

```
/
├── package.json                          root workspace (pnpm + Turborepo)
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .npmrc
├── .env.example                          root env reference
│
├── packages/
│   ├── config/
│   │   ├── package.json
│   │   ├── typescript/base.json          shared tsconfig
│   │   └── eslint/index.cjs              shared eslint config
│   │
│   └── ui/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── src/
│           ├── index.ts                  barrel export
│           └── components/
│               ├── button.tsx
│               ├── card.tsx
│               ├── section.tsx
│               └── cta.tsx
│
└── apps/
    └── main/
        ├── package.json
        ├── next.config.ts
        ├── tsconfig.json
        ├── .env.example
        ├── middleware.ts                 next-intl locale routing
        ├── i18n/
        │   ├── routing.ts
        │   └── request.ts
        ├── messages/
        │   ├── en.json
        │   └── zh.json
        ├── lib/
        │   └── supabase/
        │       ├── client.ts             browser client
        │       └── server.ts             server/RSC client
        └── app/
            ├── globals.css
            ├── [locale]/
            │   ├── layout.tsx            locale-aware root layout
            │   └── page.tsx              homepage skeleton
            └── components/
                └── language-switcher.tsx
```

---

## Task 1: Initialize Workspace Root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Install pnpm (if not installed)**

```bash
npm install -g pnpm@latest
pnpm --version
```
Expected: `9.x.x`

- [ ] **Step 2: Create workspace root `package.json`**

```json
{
  "name": "yoursite-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\" --ignore-path .gitignore"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

- [ ] **Step 3: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

- [ ] **Step 5: Create `.npmrc`**

```
shamefully-hoist=true
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
.next
.turbo
dist
.env
.env.local
.env.*.local
*.log
.DS_Store
.superpowers/
```

- [ ] **Step 7: Create root `.env.example`**

```
# Copy to .env.local in apps/main and fill in values
# See apps/main/.env.example for full list
```

- [ ] **Step 8: Install root dependencies**

```bash
pnpm install
```
Expected: `packages/turbo and packages/prettier installed`

---

## Task 2: Create `packages/config`

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/typescript/base.json`
- Create: `packages/config/eslint/index.cjs`

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@repo/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./typescript/base": "./typescript/base.json",
    "./eslint": "./eslint/index.cjs"
  }
}
```

- [ ] **Step 2: Create `packages/config/typescript/base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "allowJs": false,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `packages/config/eslint/index.cjs`**

```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
```

---

## Task 3: Create `packages/ui` Foundation

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create `packages/ui/package.json`**

```json
{
  "name": "@repo/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^25.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  },
  "peerDependencies": {
    "react": ">=19.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/ui/tsconfig.json`**

```json
{
  "extends": "@repo/config/typescript/base",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/ui/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

- [ ] **Step 4: Create `packages/ui/src/test-setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Create empty barrel `packages/ui/src/index.ts`**

```ts
export { Button } from "./components/button";
export { Card, CardHeader, CardBody } from "./components/card";
export { Section } from "./components/section";
export { CTA } from "./components/cta";
```

- [ ] **Step 6: Install UI package dependencies**

```bash
pnpm install --filter @repo/ui
```

---

## Task 4: Button Component (TDD)

**Files:**
- Create: `packages/ui/src/components/button.tsx`
- Test: `packages/ui/src/components/button.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as disabled when disabled prop passed", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies variant class for secondary", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect(container.firstChild).toHaveClass("bg-secondary");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @repo/ui test
```
Expected: FAIL — `Cannot find module './button'`

- [ ] **Step 3: Install userEvent**

```bash
pnpm add --filter @repo/ui --save-dev @testing-library/user-event
```

- [ ] **Step 4: Implement `packages/ui/src/components/button.tsx`**

```tsx
import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Run tests and confirm they pass**

```bash
pnpm --filter @repo/ui test
```
Expected: PASS — 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/components/button.tsx packages/ui/src/components/button.test.tsx
git commit -m "feat(ui): add Button component with tests"
```

---

## Task 5: Card Component (TDD)

**Files:**
- Create: `packages/ui/src/components/card.tsx`
- Test: `packages/ui/src/components/card.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardBody } from "./card";

describe("Card", () => {
  it("renders children inside card", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("CardHeader renders heading text", () => {
    render(<CardHeader>My Title</CardHeader>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("CardBody renders body text", () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("Card accepts additional className", () => {
    const { container } = render(<Card className="extra-class">x</Card>);
    expect(container.firstChild).toHaveClass("extra-class");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @repo/ui test
```
Expected: FAIL — `Cannot find module './card'`

- [ ] **Step 3: Implement `packages/ui/src/components/card.tsx`**

```tsx
import * as React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: CardProps) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
pnpm --filter @repo/ui test
```
Expected: PASS — all tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/card.tsx packages/ui/src/components/card.test.tsx
git commit -m "feat(ui): add Card, CardHeader, CardBody components with tests"
```

---

## Task 6: Section Component (TDD)

**Files:**
- Create: `packages/ui/src/components/section.tsx`
- Test: `packages/ui/src/components/section.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/section.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { Section } from "./section";

describe("Section", () => {
  it("renders children", () => {
    render(<Section>Section content</Section>);
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("renders as <section> element", () => {
    const { container } = render(<Section>x</Section>);
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("accepts id prop for anchor links", () => {
    const { container } = render(<Section id="services">x</Section>);
    expect(container.querySelector("#services")).toBeInTheDocument();
  });

  it("applies narrow variant correctly", () => {
    const { container } = render(<Section variant="narrow">x</Section>);
    expect(container.querySelector("section")).toHaveClass("max-w-3xl");
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @repo/ui test
```
Expected: FAIL

- [ ] **Step 3: Implement `packages/ui/src/components/section.tsx`**

```tsx
import * as React from "react";

type SectionVariant = "default" | "narrow" | "wide";

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  variant?: SectionVariant;
}

const variantClasses: Record<SectionVariant, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export function Section({
  children,
  id,
  className = "",
  variant = "default",
}: SectionProps) {
  return (
    <section id={id} className={`py-16 px-4 ${className}`}>
      <div className={`mx-auto ${variantClasses[variant]}`}>{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
pnpm --filter @repo/ui test
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/section.tsx packages/ui/src/components/section.test.tsx
git commit -m "feat(ui): add Section component with tests"
```

---

## Task 7: CTA Component (TDD)

**Files:**
- Create: `packages/ui/src/components/cta.tsx`
- Test: `packages/ui/src/components/cta.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/cta.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { CTA } from "./cta";

describe("CTA", () => {
  it("renders heading and description", () => {
    render(
      <CTA heading="Get Started" description="Contact us today" />
    );
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("Contact us today")).toBeInTheDocument();
  });

  it("renders primary action button with correct text", () => {
    render(
      <CTA
        heading="H"
        description="D"
        primaryAction={{ label: "Free Consult", href: "/contact" }}
      />
    );
    expect(screen.getByRole("link", { name: "Free Consult" })).toHaveAttribute(
      "href",
      "/contact"
    );
  });

  it("renders secondary action when provided", () => {
    render(
      <CTA
        heading="H"
        description="D"
        secondaryAction={{ label: "View Demos", href: "/demos" }}
      />
    );
    expect(screen.getByRole("link", { name: "View Demos" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @repo/ui test
```
Expected: FAIL

- [ ] **Step 3: Implement `packages/ui/src/components/cta.tsx`**

```tsx
import * as React from "react";

interface CTAAction {
  label: string;
  href: string;
}

interface CTAProps {
  heading: string;
  description: string;
  primaryAction?: CTAAction;
  secondaryAction?: CTAAction;
  className?: string;
}

export function CTA({
  heading,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: CTAProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <h2 className="text-3xl font-bold tracking-tight mb-4">{heading}</h2>
      <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
        {description}
      </p>
      {(primaryAction ?? secondaryAction) && (
        <div className="flex flex-wrap gap-4 justify-center">
          {primaryAction && (
            <a
              href={primaryAction.href}
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {primaryAction.label}
            </a>
          )}
          {secondaryAction && (
            <a
              href={secondaryAction.href}
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-input bg-transparent hover:bg-accent transition-colors"
            >
              {secondaryAction.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run all UI tests**

```bash
pnpm --filter @repo/ui test
```
Expected: PASS — all component tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/cta.tsx packages/ui/src/components/cta.test.tsx
git commit -m "feat(ui): add CTA component with tests"
```

---

## Task 8: Create `apps/main` Next.js App

**Files:**
- Create: `apps/main/package.json`
- Create: `apps/main/next.config.ts`
- Create: `apps/main/tsconfig.json`
- Create: `apps/main/app/globals.css`

- [ ] **Step 1: Create `apps/main/package.json`**

```json
{
  "name": "@repo/main",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "next": "^15.0.0",
    "next-intl": "^3.26.0",
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
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `apps/main/next.config.ts`**

```ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Create `apps/main/tsconfig.json`**

```json
{
  "extends": "@repo/config/typescript/base",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `apps/main/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.45 0.18 150);
  --color-primary-foreground: oklch(0.99 0 0);
  --color-secondary: oklch(0.97 0.01 150);
  --color-secondary-foreground: oklch(0.3 0.1 150);
  --color-muted: oklch(0.97 0 0);
  --color-muted-foreground: oklch(0.5 0 0);
  --color-accent: oklch(0.95 0.02 150);
  --color-accent-foreground: oklch(0.3 0.1 150);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.15 0 0);
  --color-border: oklch(0.9 0 0);
  --color-input: oklch(0.9 0 0);
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
  --radius: 0.5rem;
}

body {
  @apply bg-background text-foreground;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```
Expected: All workspace dependencies installed

---

## Task 9: Configure next-intl i18n

**Files:**
- Create: `apps/main/middleware.ts`
- Create: `apps/main/i18n/routing.ts`
- Create: `apps/main/i18n/request.ts`
- Create: `apps/main/messages/en.json`
- Create: `apps/main/messages/zh.json`

- [ ] **Step 1: Create `apps/main/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "zh",
  localePrefix: "as-needed",
});
```

- [ ] **Step 2: Create `apps/main/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "zh")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create `apps/main/middleware.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
```

- [ ] **Step 4: Create `apps/main/messages/zh.json`**

```json
{
  "nav": {
    "services": "服务",
    "demos": "案例演示",
    "pricing": "价格套餐",
    "blog": "知识库",
    "contact": "联系我们"
  },
  "hero": {
    "heading": "帮外贸工厂和贸易公司做英文产品网站",
    "subheading": "让海外客户通过 Google 找到你并提交询盘",
    "description": "提供外贸网站建设、产品文案整理、Google 基础 SEO、询盘表单、WhatsApp 联系、产品目录系统和阿里云部署服务。",
    "cta_primary": "免费咨询",
    "cta_secondary": "查看演示案例",
    "cta_quote": "立即获取报价",
    "trust_server": "✓ 阿里云香港服务器",
    "trust_bilingual": "✓ 中英双语",
    "trust_seo": "✓ 支持 Google + 百度 SEO",
    "trust_deploy": "✓ 包含全程部署"
  },
  "footer": {
    "rights": "保留所有权利"
  }
}
```

- [ ] **Step 5: Create `apps/main/messages/en.json`**

```json
{
  "nav": {
    "services": "Services",
    "demos": "Live Demos",
    "pricing": "Pricing",
    "blog": "Knowledge Base",
    "contact": "Contact"
  },
  "hero": {
    "heading": "English Product Websites for Factories & Trading Companies",
    "subheading": "Help overseas customers find you on Google and send inquiries",
    "description": "We build export websites, organize product content, set up Google SEO basics, inquiry forms, WhatsApp contact, product catalog systems, and deploy on Alibaba Cloud.",
    "cta_primary": "Free Consultation",
    "cta_secondary": "View Live Demos",
    "cta_quote": "Get a Quote",
    "trust_server": "✓ Alibaba Cloud HK Server",
    "trust_bilingual": "✓ Chinese & English",
    "trust_seo": "✓ Google + Baidu SEO Ready",
    "trust_deploy": "✓ Full Deployment Included"
  },
  "footer": {
    "rights": "All rights reserved"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/main/middleware.ts apps/main/i18n/ apps/main/messages/
git commit -m "feat(main): add next-intl i18n routing (zh/en)"
```

---

## Task 10: Configure Supabase Client

**Files:**
- Create: `apps/main/lib/supabase/client.ts`
- Create: `apps/main/lib/supabase/server.ts`
- Create: `apps/main/.env.example`

- [ ] **Step 1: Create `apps/main/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create `apps/main/lib/supabase/server.ts`**

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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore: called from Server Component, cookies are read-only
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create `apps/main/.env.example`**

```bash
# Supabase — create project at supabase.com, copy from Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL — used for Open Graph and canonical links
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# Resend — email for form submissions (sign up at resend.com)
RESEND_API_KEY=re_your_key
RESEND_FROM=YourSite <noreply@yoursite.com>

# WhatsApp floating button (country code + number, no spaces)
# Example: 85212345678
NEXT_PUBLIC_WHATSAPP_PHONE=
```

- [ ] **Step 4: Create `.env.local` for local development (not committed)**

```bash
cp apps/main/.env.example apps/main/.env.local
# Then fill in real values from your Supabase dashboard
```

- [ ] **Step 5: Commit**

```bash
git add apps/main/lib/ apps/main/.env.example
git commit -m "feat(main): add Supabase client (browser + server)"
```

---

## Task 11: Build Homepage Skeleton + Layout

**Files:**
- Create: `apps/main/app/[locale]/layout.tsx`
- Create: `apps/main/app/[locale]/page.tsx`
- Create: `apps/main/app/components/language-switcher.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | YourSite",
    default: "外贸网站建设 + 产品内容整理 + Google SEO | YourSite",
  },
  description:
    "专为工厂、贸易公司、设备供应商搭建英文产品网站，提供产品文案整理、询盘系统、阿里云部署。",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `apps/main/app/components/language-switcher.tsx`**

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next = locale === "zh" ? "en" : "zh";
    // Replace current locale prefix in path
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.push(newPath === pathname ? `/${next}` : newPath);
  };

  return (
    <button
      onClick={toggle}
      className="text-sm font-medium px-3 py-1.5 rounded-md border border-input hover:bg-accent transition-colors"
      aria-label="Switch language"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
```

- [ ] **Step 3: Create `apps/main/app/[locale]/page.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/app/components/language-switcher";

export default function HomePage() {
  const t = useTranslations("hero");
  return (
    <main>
      {/* Temporary nav for language switch during development */}
      <nav className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-white to-green-50">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 max-w-3xl">
          {t("heading")}
        </h1>
        <p className="text-xl text-muted-foreground mb-2">{t("subheading")}</p>
        <p className="text-base text-muted-foreground mb-8 max-w-2xl">
          {t("description")}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("cta_primary")}
          </a>
          <a
            href="/demos"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-input bg-transparent hover:bg-accent transition-colors"
          >
            {t("cta_secondary")}
          </a>
        </div>
        <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
          <span>{t("trust_server")}</span>
          <span>{t("trust_bilingual")}</span>
          <span>{t("trust_seo")}</span>
          <span>{t("trust_deploy")}</span>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/main/app/
git commit -m "feat(main): add homepage skeleton with i18n hero section"
```

---

## Task 12: Verify Local Dev Server

- [ ] **Step 1: Start the dev server**

```bash
pnpm --filter @repo/main dev
```
Expected output: `▲ Next.js 15.x.x — ready on http://localhost:3000`

- [ ] **Step 2: Open browser and verify zh homepage**

Open `http://localhost:3000`  
Expected: Chinese hero text "帮外贸工厂和贸易公司做英文产品网站" visible, green gradient background, language switcher button "EN" in top right.

- [ ] **Step 3: Test language switch**

Click "EN" button  
Expected: URL changes to `http://localhost:3000/en`, English text "English Product Websites for Factories & Trading Companies" appears.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```
Expected: All packages/ui tests pass (Button: 4, Card: 4, Section: 4, CTA: 3 = 15 tests total)

- [ ] **Step 5: Run build to confirm no type errors**

```bash
pnpm build
```
Expected: Build completes with no TypeScript errors.

---

## Task 13: Git Init + README + First Commit

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# YourSite Monorepo

Service website for web development and software customization targeting export companies and SMBs.

## Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS 4 + shadcn/ui (shared via `packages/ui`)
- **i18n:** next-intl (zh/en, default: zh)
- **Database:** Supabase (PostgreSQL)
- **Monorepo:** Turborepo + pnpm workspaces
- **Deployment:** Alibaba Cloud ECS + Nginx + PM2

## Apps

| App | URL | Description |
|-----|-----|-------------|
| `apps/main` | yoursite.com | Main service website |
| `apps/demo-export` | export.demo.yoursite.com | Foreign trade demo |
| `apps/demo-catalog` | catalog.demo.yoursite.com | Product catalog + inquiry demo |
| *(more planned)* | | |

## Local Development

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Setup

```bash
# Install dependencies
pnpm install

# Copy env file
cp apps/main/.env.example apps/main/.env.local
# Edit apps/main/.env.local with your Supabase credentials

# Start main site
pnpm --filter @repo/main dev
# Opens http://localhost:3000
```

### Run All Tests

```bash
pnpm test
```

### Build All

```bash
pnpm build
```

## Plans

See `docs/superpowers/plans/` for implementation plans.  
See `docs/superpowers/specs/` for design specifications.
```

- [ ] **Step 2: Initialize git and make first commit**

```bash
git init
git add .
git commit -m "chore: initialize Turborepo monorepo with Next.js 15, next-intl, Supabase, shared UI"
```
Expected: Initial commit with all files.

---

## Self-Review

**Spec coverage check:**
- ✓ Turborepo monorepo structure
- ✓ Next.js 15 App Router
- ✓ Tailwind CSS 4
- ✓ shadcn/ui components (Button, Card, Section, CTA)
- ✓ TypeScript + ESLint/Prettier config in packages/config
- ✓ next-intl zh/en skeleton
- ✓ Supabase client (browser + server)
- ✓ .env.example
- ✓ Local run instructions in README
- ✓ GitHub init

**Not in this plan (by design):**
- Nginx / ECS deployment → Plan A2
- Actual page content beyond hero → Plan B1
- Demo apps → Plan C1, D1

**Placeholder scan:** No TBD or TODO in implementation steps. All code blocks are complete.

**Type consistency:** `createClient()` used consistently in both `lib/supabase/client.ts` and `lib/supabase/server.ts`. `routing.locales` typed as `"en" | "zh"` consistently across middleware, layout, and routing config.
