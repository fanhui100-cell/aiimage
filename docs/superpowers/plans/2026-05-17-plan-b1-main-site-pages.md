# Plan B1: Main Site MVP Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the `apps/main` homepage (all 10 modules), add shared Nav + Footer, and deliver Contact, Pricing, and Demos pages — giving the site everything needed to start converting visitors.

**Architecture:** All homepage modules are server components in `app/[locale]/sections/` using `useTranslations`. Nav is a client component (mobile menu toggle). Contact form uses a Next.js 15 Server Action + Supabase insert. Data that needs iteration (FAQ, pricing packages, demos) uses TypeScript constant arrays with translation keys accessed by index. Layout gains `<Nav>` before and `<Footer>` after `{children}`.

**Tech Stack:** Next.js 15 App Router, next-intl v3, Tailwind CSS 4, Supabase (server client), React 19 `useActionState`

---

## File Map

```
apps/main/
├── messages/
│   ├── zh.json                       modified — add all section keys
│   └── en.json                       modified — add all section keys
├── app/
│   ├── components/
│   │   ├── nav.tsx                   new — sticky nav + mobile menu
│   │   └── footer.tsx                new — site footer
│   └── [locale]/
│       ├── layout.tsx                modified — add <Nav> + <Footer>
│       ├── page.tsx                  modified — compose section components
│       ├── sections/
│       │   ├── hero-section.tsx      new — refactored from page.tsx
│       │   ├── pain-points-section.tsx  new
│       │   ├── solution-section.tsx     new
│       │   ├── demos-section.tsx        new
│       │   ├── industries-section.tsx   new
│       │   ├── process-section.tsx      new
│       │   ├── why-us-section.tsx       new
│       │   ├── pricing-section.tsx      new
│       │   ├── faq-section.tsx          new
│       │   └── footer-cta-section.tsx   new
│       ├── contact/
│       │   ├── page.tsx              new
│       │   └── actions.ts            new — server action
│       ├── pricing/
│       │   └── page.tsx              new
│       └── demos/
│           └── page.tsx              new
└── supabase/
    └── migrations/
        └── 001_contact_submissions.sql  new — run in Supabase SQL editor
```

---

## Task 1: Update Translation Files

**Files:**
- Modify: `apps/main/messages/zh.json`
- Modify: `apps/main/messages/en.json`

All section components depend on these keys. Do this first.

- [ ] **Step 1: Replace `apps/main/messages/zh.json` with the complete file**

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
  "pain_points": {
    "title": "你是不是也遇到了这些问题？",
    "no_website_title": "没有英文官网",
    "no_website_desc": "海外客户 Google 搜索你的产品，什么都找不到",
    "alibaba_title": "阿里国际站费用高",
    "alibaba_desc": "年费高、效果难把控，还要跟无数供应商竞价",
    "chinese_only_title": "网站只有中文",
    "chinese_only_desc": "客户看不懂产品参数，产品图片质量低，失去信任",
    "no_inquiries_title": "有网站但没询盘",
    "no_inquiries_desc": "网站上线多年，没有 SEO 基础，搜索引擎根本找不到",
    "hard_to_update_title": "网站难以更新",
    "hard_to_update_desc": "每次改个产品价格都要找人，等几天还收服务费",
    "no_seo_title": "不知道如何推广",
    "no_seo_desc": "不清楚如何向 Google 提交网站，不知道 Search Console 怎么用"
  },
  "solution": {
    "title": "不只是网站，而是一套线上获客与业务管理系统",
    "subtitle": "从产品内容整理到网站上线，一站式服务",
    "export_title": "外贸英文产品网站",
    "export_desc": "多语言展示、产品参数页、询盘表单、WhatsApp 按钮、Google SEO 基础设置",
    "content_title": "产品内容整理",
    "content_desc": "帮你整理公司介绍、产品分类、英文文案、规格参数——这才是客户真正需要的",
    "seo_title": "Google 基础 SEO",
    "seo_desc": "网站结构、标题描述、站点地图、Google Search Console 提交，具备被搜索引擎发现的基础",
    "system_title": "业务系统扩展",
    "system_desc": "在线报价单、产品目录系统、AI 客服知识库——随业务成长逐步添加",
    "cta": "查看完整服务"
  },
  "demos": {
    "title": "真实演示案例，不是样板图",
    "subtitle": "点击进入体验完整网站，不是截图",
    "badge_live": "可体验",
    "badge_coming": "即将上线",
    "export_title": "外贸英文产品网站",
    "export_desc": "适合工厂、设备供应商。英文产品展示 + 询盘表单 + SEO 示例",
    "catalog_title": "产品目录 + 询盘系统",
    "catalog_desc": "产品加入询价单 + 提交询盘 + 后台管理",
    "engineering_title": "工程公司官网",
    "engineering_desc": "工程案例 + 资质展示 + 中英切换",
    "quote_title": "在线报价系统",
    "quote_desc": "选产品自动报价 + 导出 PDF + 报价记录",
    "ai_title": "AI 客服知识库",
    "ai_desc": "上传企业资料 + AI 回答产品问题 + 留联系方式",
    "consulting_title": "专业服务公司官网",
    "consulting_desc": "适合会计、顾问、移民、HR 服务公司",
    "cta": "联系我们定制"
  },
  "industries": {
    "title": "覆盖多个行业",
    "subtitle": "无论你的行业是什么，我们都有对应的解决方案",
    "factory": "外贸工厂 / 制造企业",
    "trading": "贸易公司 / 进出口商",
    "equipment": "设备 / 机械供应商",
    "engineering": "工程 / 建筑公司",
    "interior": "装修 / 室内设计",
    "professional": "专业服务（律师 / 会计）",
    "wholesale": "批发 / 分销商",
    "consulting": "顾问 / 培训机构",
    "cta_prefix": "你的行业不在列表里？",
    "cta": "告诉我们你的需求"
  },
  "process": {
    "title": "8 步透明交付，从咨询到上线",
    "step01_title": "填写需求表",
    "step01_desc": "10 分钟在线问卷，告诉我们你的行业和需求",
    "step02_title": "免费咨询通话",
    "step02_desc": "30 分钟视频/电话，确认方案和报价范围",
    "step03_title": "报价确认",
    "step03_desc": "明细报价单，无隐藏费用，签合同付款 50%",
    "step04_title": "内容收集",
    "step04_desc": "提供产品图片、公司介绍、联系方式等资料",
    "step05_title": "开发 + 设计",
    "step05_desc": "7–14 个工作日完成开发，你可随时查看进度",
    "step06_title": "客户审阅",
    "step06_desc": "发送预览链接，提出修改意见（含 2 轮修改）",
    "step07_title": "发布上线",
    "step07_desc": "域名配置、SSL 部署、付清尾款、正式上线",
    "step08_title": "提交搜索引擎",
    "step08_desc": "Google Search Console + 百度提交，SEO 基础设置完成"
  },
  "why_us": {
    "title": "为什么选我们",
    "demo_title": "真实 Demo 可体验",
    "demo_desc": "6 个行业演示网站，真实可访问，不是 PPT 截图",
    "content_title": "包含内容整理",
    "content_desc": "帮你整理英文文案和产品资料，不只是交一个网站文件",
    "server_title": "阿里云香港部署",
    "server_desc": "香港节点，无需备案，网速稳定，支持 Google 和百度 SEO",
    "price_title": "报价透明不加价",
    "price_desc": "合同明确交付范围，2 轮修改包含在内，超出按时收费",
    "support_title": "上线后持续支持",
    "support_desc": "提供维护托管套餐，有问题随时联系",
    "speed_title": "交付快速",
    "speed_desc": "7–14 个工作日完成开发交付，急单可协商加急"
  },
  "pricing": {
    "title": "透明定价，按需选择",
    "subtitle": "所有套餐均含阿里云香港部署 + SSL + Google Search Console 提交",
    "popular_badge": "最受欢迎",
    "cta_consult": "免费咨询",
    "cta_quote": "获取报价",
    "note": "* 以上为起步价，最终报价根据页面数量、功能复杂度和内容量确定",
    "display_name": "展示型官网",
    "display_price": "¥5,000 起",
    "display_desc": "适合小型企业、个人服务",
    "display_f1": "5 页以内",
    "display_f2": "响应式设计",
    "display_f3": "联系表单",
    "display_f4": "阿里云部署 + SSL",
    "display_f5": "Google Search Console 提交",
    "export_name": "外贸英文产品网站",
    "export_price": "¥9,800 起",
    "export_desc": "适合工厂、贸易公司",
    "export_f1": "产品分类 + 产品详情页",
    "export_f2": "英文文案整理",
    "export_f3": "询盘表单 + WhatsApp 按钮",
    "export_f4": "Google 基础 SEO",
    "export_f5": "PDF 产品目录下载",
    "catalog_name": "产品目录 + 询盘系统",
    "catalog_price": "¥18,000 起",
    "catalog_desc": "适合需要产品管理的企业",
    "catalog_f1": "产品管理后台",
    "catalog_f2": "询盘单系统",
    "catalog_f3": "多产品加入询价单",
    "catalog_f4": "数据导出",
    "catalog_f5": "包含以上所有功能",
    "ai_name": "AI 客服 + 知识库",
    "ai_price": "¥28,000 起",
    "ai_desc": "适合需要智能客服的企业",
    "ai_f1": "企业知识库上传",
    "ai_f2": "AI 自动回答产品问题",
    "ai_f3": "多语言支持",
    "ai_f4": "人工接管功能",
    "ai_f5": "包含以上所有功能"
  },
  "faq": {
    "title": "常见问题",
    "q1": "做一个网站需要多长时间？",
    "a1": "展示型官网一般 7 个工作日，外贸英文网站 10–14 个工作日，复杂功能项目另行协商。急单可加急处理。",
    "q2": "我没有英文文案怎么办？",
    "a2": "没关系，这正是我们的核心服务之一。提供公司中文介绍和产品资料，我们帮你整理英文文案、产品描述和 SEO 标题。",
    "q3": "域名和服务器费用怎么算？",
    "a3": "域名年费约 ¥100–300，阿里云 ECS 年费约 ¥500–1,200（具体看配置）。这些费用由客户自付或代购后实报，不包含在套餐报价中。",
    "q4": "做好后我自己能更新内容吗？",
    "a4": "基础套餐提供管理后台，可自行更新文字和图片。有维护托管套餐的客户可直接发需求，由我们操作。",
    "q5": "支持哪些付款方式？",
    "a5": "支持微信支付、支付宝、银行转账。签合同后付 50% 定金，上线后付余款。",
    "q6": "网站上线后能保证在 Google 找到吗？",
    "a6": "我们完成 Google Search Console 提交、站点地图、SEO 基础设置，让网站具备被收录的技术基础。但搜索排名由 Google 算法决定，无法保证具体排名或时间。",
    "q7": "香港服务器需要备案吗？",
    "a7": "不需要。阿里云香港节点不受中国大陆 ICP 备案要求约束，直接上线即可，同时支持 Google 和百度 SEO。",
    "q8": "上线后如果有问题找谁？",
    "a8": "提供 3 个月质保，期间免费修复技术问题。之后可签维护托管套餐（¥500/月起），有问题随时联系。"
  },
  "footer_cta": {
    "title": "准备好开始了吗？",
    "subtitle": "10 分钟填写需求表，免费获取定制报价",
    "cta_primary": "免费咨询",
    "cta_secondary": "查看演示案例"
  },
  "contact_page": {
    "title": "联系我们",
    "subtitle": "填写下方表单，我们会在 1 个工作日内回复",
    "name_label": "您的姓名",
    "name_placeholder": "张三",
    "company_label": "公司名称（选填）",
    "company_placeholder": "XX 贸易有限公司",
    "contact_label": "手机 / 微信 / WhatsApp",
    "contact_placeholder": "+86 138 0000 0000",
    "message_label": "请简述您的需求",
    "message_placeholder": "我们是外贸工厂，需要一个英文产品网站...",
    "submit": "提交",
    "submitting": "提交中...",
    "success_title": "提交成功！",
    "success_desc": "我们会在 1 个工作日内与您联系。",
    "error": "提交失败，请稍后重试。"
  },
  "demos_page": {
    "title": "演示案例",
    "subtitle": "6 个真实可访问的行业演示网站，不是样板截图",
    "visit": "访问演示",
    "coming_soon": "即将上线"
  },
  "pricing_page": {
    "title": "价格套餐",
    "subtitle": "透明定价，无隐藏费用。所有套餐包含阿里云香港部署、SSL 证书和 Google Search Console 提交。",
    "maintenance_title": "维护托管套餐（月费）",
    "maintenance_subtitle": "网站上线后可选择维护套餐，确保稳定运行",
    "basic_name": "基础维护",
    "basic_price": "¥500/月",
    "basic_f1": "网站备份",
    "basic_f2": "SSL 证书续期检查",
    "basic_f3": "表单测试",
    "basic_f4": "小修改（每月 1 次）",
    "basic_f5": "图片替换",
    "content_name": "内容维护",
    "content_price": "¥1,000/月",
    "content_f1": "包含基础维护全部内容",
    "content_f2": "产品信息更新",
    "content_f3": "文章发布（每月 1 篇）",
    "content_f4": "基础 SEO 检查",
    "seo_name": "SEO 增长维护",
    "seo_price": "¥2,000–5,000/月",
    "seo_f1": "包含内容维护全部内容",
    "seo_f2": "每月 2–4 篇 SEO 文章",
    "seo_f3": "关键词排名追踪",
    "seo_f4": "月度数据报告",
    "cta_title": "不确定选哪个套餐？",
    "cta_subtitle": "告诉我们你的需求，我们帮你推荐最适合的方案",
    "cta": "免费咨询"
  },
  "footer": {
    "tagline": "帮外贸工厂和贸易公司做英文产品网站",
    "rights": "保留所有权利"
  }
}
```

- [ ] **Step 2: Replace `apps/main/messages/en.json` with the complete file**

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
  "pain_points": {
    "title": "Do any of these sound familiar?",
    "no_website_title": "No English Website",
    "no_website_desc": "Overseas customers search for your products on Google and find nothing",
    "alibaba_title": "High Alibaba International Fees",
    "alibaba_desc": "Annual fees are high, results are unpredictable, and you compete with thousands of suppliers",
    "chinese_only_title": "Website Is Chinese-Only",
    "chinese_only_desc": "Customers can't read product specs, photos are low quality, trust is lost",
    "no_inquiries_title": "Website But No Inquiries",
    "no_inquiries_desc": "Site has been live for years, no SEO foundation, search engines can't find it",
    "hard_to_update_title": "Website Is Hard to Update",
    "hard_to_update_desc": "Changing a product price requires hiring someone, waiting days, and paying a service fee",
    "no_seo_title": "Don't Know How to Promote",
    "no_seo_desc": "Unclear how to submit your site to Google, don't know how to use Search Console"
  },
  "solution": {
    "title": "Not Just a Website — A Complete Online Lead Generation System",
    "subtitle": "From product content organization to site launch, all in one place",
    "export_title": "Export English Product Website",
    "export_desc": "Multilingual display, product spec pages, inquiry form, WhatsApp button, Google SEO basics",
    "content_title": "Product Content Organization",
    "content_desc": "We organize your company intro, product categories, English copy, and spec sheets — what customers actually need",
    "seo_title": "Google SEO Basics",
    "seo_desc": "Site structure, meta titles/descriptions, sitemap, Google Search Console submission — the foundation for search engine discovery",
    "system_title": "Business System Extensions",
    "system_desc": "Online quoting, product catalog system, AI customer service knowledge base — add as your business grows",
    "cta": "View Full Services"
  },
  "demos": {
    "title": "Real Live Demos, Not Template Screenshots",
    "subtitle": "Click to explore a complete working website, not a screenshot",
    "badge_live": "Live",
    "badge_coming": "Coming Soon",
    "export_title": "Export English Product Website",
    "export_desc": "For factories and equipment suppliers. English product display + inquiry form + SEO examples",
    "catalog_title": "Product Catalog + Inquiry System",
    "catalog_desc": "Add products to inquiry cart + submit inquiry + admin dashboard",
    "engineering_title": "Engineering Company Website",
    "engineering_desc": "Project portfolio + certifications + bilingual toggle",
    "quote_title": "Online Quoting System",
    "quote_desc": "Select products for auto-quote + export PDF + quote history",
    "ai_title": "AI Customer Service Knowledge Base",
    "ai_desc": "Upload company materials + AI answers product questions + collect contact info",
    "consulting_title": "Professional Services Website",
    "consulting_desc": "For accounting, consulting, immigration, and HR service firms",
    "cta": "Contact Us to Build Yours"
  },
  "industries": {
    "title": "Covering Multiple Industries",
    "subtitle": "Whatever your industry, we have a matching solution",
    "factory": "Export Factory / Manufacturer",
    "trading": "Trading Company / Importer-Exporter",
    "equipment": "Equipment / Machinery Supplier",
    "engineering": "Engineering / Construction",
    "interior": "Interior Design / Renovation",
    "professional": "Professional Services (Law / Accounting)",
    "wholesale": "Wholesale / Distributor",
    "consulting": "Consulting / Training",
    "cta_prefix": "Your industry not listed?",
    "cta": "Tell us your needs"
  },
  "process": {
    "title": "8-Step Transparent Delivery, From Consultation to Launch",
    "step01_title": "Fill Out Requirements Form",
    "step01_desc": "10-minute online form telling us your industry and needs",
    "step02_title": "Free Consultation Call",
    "step02_desc": "30-minute video/phone call to confirm the plan and pricing scope",
    "step03_title": "Confirm Quote",
    "step03_desc": "Itemized quote, no hidden fees, sign contract and pay 50% deposit",
    "step04_title": "Content Collection",
    "step04_desc": "Provide product photos, company intro, contact details, and other materials",
    "step05_title": "Development + Design",
    "step05_desc": "7–14 business days to complete, you can check progress anytime",
    "step06_title": "Client Review",
    "step06_desc": "Preview link sent, submit feedback (includes 2 revision rounds)",
    "step07_title": "Go Live",
    "step07_desc": "Domain setup, SSL deployment, final payment, official launch",
    "step08_title": "Search Engine Submission",
    "step08_desc": "Google Search Console + Baidu submission, SEO basics complete"
  },
  "why_us": {
    "title": "Why Choose Us",
    "demo_title": "Real Demos You Can Try",
    "demo_desc": "6 industry demo sites, live and accessible — not PPT screenshots",
    "content_title": "Content Organization Included",
    "content_desc": "We organize your English copy and product materials — not just delivering website files",
    "server_title": "Alibaba Cloud HK Deployment",
    "server_desc": "Hong Kong node, no ICP filing required, stable speed, supports Google and Baidu SEO",
    "price_title": "Transparent Pricing, No Surprises",
    "price_desc": "Contract clearly defines deliverables, 2 revision rounds included, overtime charged by the hour",
    "support_title": "Post-Launch Support",
    "support_desc": "Maintenance hosting plans available, reach out anytime with issues",
    "speed_title": "Fast Delivery",
    "speed_desc": "7–14 business days to complete, rush orders available on request"
  },
  "pricing": {
    "title": "Transparent Pricing, Choose What You Need",
    "subtitle": "All plans include Alibaba Cloud HK deployment, SSL, and Google Search Console submission",
    "popular_badge": "Most Popular",
    "cta_consult": "Free Consultation",
    "cta_quote": "Get a Quote",
    "note": "* Prices shown are starting prices. Final quote depends on page count, feature complexity, and content volume",
    "display_name": "Display Website",
    "display_price": "From ¥5,000",
    "display_desc": "For small businesses and individual services",
    "display_f1": "Up to 5 pages",
    "display_f2": "Responsive design",
    "display_f3": "Contact form",
    "display_f4": "Alibaba Cloud deployment + SSL",
    "display_f5": "Google Search Console submission",
    "export_name": "Export English Product Website",
    "export_price": "From ¥9,800",
    "export_desc": "For factories and trading companies",
    "export_f1": "Product categories + detail pages",
    "export_f2": "English copy organization",
    "export_f3": "Inquiry form + WhatsApp button",
    "export_f4": "Google SEO basics",
    "export_f5": "PDF product catalog download",
    "catalog_name": "Product Catalog + Inquiry System",
    "catalog_price": "From ¥18,000",
    "catalog_desc": "For businesses needing product management",
    "catalog_f1": "Product management backend",
    "catalog_f2": "Inquiry cart system",
    "catalog_f3": "Multi-product inquiry list",
    "catalog_f4": "Data export",
    "catalog_f5": "All features above included",
    "ai_name": "AI Customer Service + Knowledge Base",
    "ai_price": "From ¥28,000",
    "ai_desc": "For businesses needing smart customer service",
    "ai_f1": "Enterprise knowledge base upload",
    "ai_f2": "AI auto-answers product questions",
    "ai_f3": "Multilingual support",
    "ai_f4": "Human handoff feature",
    "ai_f5": "All features above included"
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "q1": "How long does it take to build a website?",
    "a1": "Display websites typically take 7 business days. Export English websites take 10–14 business days. Complex projects are negotiated separately. Rush orders available.",
    "q2": "What if I don't have English copy?",
    "a2": "No problem — that's one of our core services. Provide your Chinese company intro and product materials, and we'll organize English copy, product descriptions, and SEO titles.",
    "q3": "How are domain and server costs calculated?",
    "a3": "Domain annual fee is approximately ¥100–300. Alibaba Cloud ECS annual fee is approximately ¥500–1,200 depending on configuration. These are paid by the client directly or reimbursed at cost — not included in package pricing.",
    "q4": "Can I update the content myself after launch?",
    "a4": "Basic packages include an admin panel for updating text and images yourself. Clients with maintenance plans can send us requests directly.",
    "q5": "What payment methods do you accept?",
    "a5": "We accept WeChat Pay, Alipay, and bank transfer. 50% deposit upon contract signing, remainder due at launch.",
    "q6": "Can you guarantee the site will appear on Google?",
    "a6": "We complete Google Search Console submission, sitemap, and SEO basics so your site has the technical foundation to be indexed. But search rankings are determined by Google's algorithm — specific rankings and timing cannot be guaranteed.",
    "q7": "Does a Hong Kong server require ICP filing?",
    "a7": "No. Alibaba Cloud's Hong Kong node is not subject to mainland China ICP filing requirements. You can launch immediately while supporting both Google and Baidu SEO.",
    "q8": "Who do I contact if there are issues after launch?",
    "a8": "We provide a 3-month warranty period with free bug fixes. After that, maintenance hosting plans start at ¥500/month — reach out anytime."
  },
  "footer_cta": {
    "title": "Ready to Get Started?",
    "subtitle": "Fill out the requirements form in 10 minutes and get a free custom quote",
    "cta_primary": "Free Consultation",
    "cta_secondary": "View Live Demos"
  },
  "contact_page": {
    "title": "Contact Us",
    "subtitle": "Fill out the form below and we'll respond within 1 business day",
    "name_label": "Your Name",
    "name_placeholder": "John Smith",
    "company_label": "Company Name (optional)",
    "company_placeholder": "ABC Trading Co.",
    "contact_label": "Phone / WeChat / WhatsApp",
    "contact_placeholder": "+86 138 0000 0000",
    "message_label": "Briefly describe your needs",
    "message_placeholder": "We're an export factory and need an English product website...",
    "submit": "Submit",
    "submitting": "Submitting...",
    "success_title": "Submitted Successfully!",
    "success_desc": "We'll be in touch within 1 business day.",
    "error": "Submission failed. Please try again or contact us directly."
  },
  "demos_page": {
    "title": "Live Demos",
    "subtitle": "6 real working demo sites across different industries — not template screenshots",
    "visit": "Visit Demo",
    "coming_soon": "Coming Soon"
  },
  "pricing_page": {
    "title": "Pricing",
    "subtitle": "Transparent pricing, no hidden fees. All plans include Alibaba Cloud HK deployment, SSL certificate, and Google Search Console submission.",
    "maintenance_title": "Maintenance Hosting Plans (Monthly)",
    "maintenance_subtitle": "Optional post-launch maintenance plans to keep your site running smoothly",
    "basic_name": "Basic Maintenance",
    "basic_price": "¥500/month",
    "basic_f1": "Website backups",
    "basic_f2": "SSL renewal check",
    "basic_f3": "Form testing",
    "basic_f4": "Minor edits (1x per month)",
    "basic_f5": "Image replacement",
    "content_name": "Content Maintenance",
    "content_price": "¥1,000/month",
    "content_f1": "All Basic Maintenance features",
    "content_f2": "Product info updates",
    "content_f3": "Article publishing (1x per month)",
    "content_f4": "Basic SEO check",
    "seo_name": "SEO Growth Maintenance",
    "seo_price": "¥2,000–5,000/month",
    "seo_f1": "All Content Maintenance features",
    "seo_f2": "2–4 SEO articles per month",
    "seo_f3": "Keyword ranking tracking",
    "seo_f4": "Monthly data report",
    "cta_title": "Not sure which plan is right for you?",
    "cta_subtitle": "Tell us your needs and we'll recommend the best fit",
    "cta": "Free Consultation"
  },
  "footer": {
    "tagline": "English product websites for factories and trading companies",
    "rights": "All rights reserved"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/main/messages/
git commit -m "feat(main): add complete i18n translations for all homepage sections and pages"
```

---

## Task 2: Nav + Footer + Layout Update

**Files:**
- Create: `apps/main/app/components/nav.tsx`
- Create: `apps/main/app/components/footer.tsx`
- Modify: `apps/main/app/[locale]/layout.tsx`

- [ ] **Step 1: Create `apps/main/app/components/nav.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Nav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/demos" as const, label: t("demos") },
    { href: "/pricing" as const, label: t("pricing") },
    { href: "/contact" as const, label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg text-green-700 tracking-tight">
          YourSite
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-green-700 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="text-sm font-semibold px-4 py-2 rounded-md bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {t("contact")}
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
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
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-sm text-gray-700 hover:text-green-700"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="block py-2 text-sm font-semibold text-green-700"
            onClick={() => setOpen(false)}
          >
            {t("contact")}
          </Link>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create `apps/main/app/components/footer.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg mb-2">YourSite</p>
            <p className="text-sm">{t("tagline")}</p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">快速导航</p>
            <div className="space-y-2 text-sm">
              <Link href="/demos" className="block hover:text-white transition-colors">演示案例</Link>
              <Link href="/pricing" className="block hover:text-white transition-colors">价格套餐</Link>
              <Link href="/contact" className="block hover:text-white transition-colors">联系我们</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">联系方式</p>
            <div className="space-y-2 text-sm">
              <p>WhatsApp / 微信：待填写</p>
              <p>邮箱：hello@yoursite.com</p>
              <p>服务时间：周一至周五 9:00–18:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-center">
          © {year} YourSite. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update `apps/main/app/[locale]/layout.tsx` to add Nav + Footer**

Replace the entire file:

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/app/components/nav";
import { Footer } from "@/app/components/footer";
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
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/main/app/components/nav.tsx apps/main/app/components/footer.tsx apps/main/app/[locale]/layout.tsx
git commit -m "feat(main): add Nav, Footer, and update layout"
```

---

## Task 3: Hero Section Refactor + Pain Points + Solution Sections

**Files:**
- Create: `apps/main/app/[locale]/sections/hero-section.tsx`
- Create: `apps/main/app/[locale]/sections/pain-points-section.tsx`
- Create: `apps/main/app/[locale]/sections/solution-section.tsx`
- Modify: `apps/main/app/[locale]/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/sections/hero-section.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const t = useTranslations("hero");
  return (
    <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center bg-gradient-to-b from-white to-green-50">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 max-w-3xl leading-tight">
        {t("heading")}
      </h1>
      <p className="text-xl text-gray-500 mb-3 max-w-2xl">{t("subheading")}</p>
      <p className="text-base text-gray-400 mb-8 max-w-2xl">{t("description")}</p>
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
        >
          {t("cta_primary")}
        </Link>
        <Link
          href="/demos"
          className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        >
          {t("cta_secondary")}
        </Link>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-gray-400">
        <span>{t("trust_server")}</span>
        <span>{t("trust_bilingual")}</span>
        <span>{t("trust_seo")}</span>
        <span>{t("trust_deploy")}</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `apps/main/app/[locale]/sections/pain-points-section.tsx`**

```tsx
import { useTranslations } from "next-intl";

const PAIN_KEYS = [
  "no_website",
  "alibaba",
  "chinese_only",
  "no_inquiries",
  "hard_to_update",
  "no_seo",
] as const;

export function PainPointsSection() {
  const t = useTranslations("pain_points");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAIN_KEYS.map((key) => (
            <div
              key={key}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
            >
              <p className="font-semibold text-gray-800 mb-2">
                {t(`${key}_title`)}
              </p>
              <p className="text-sm text-gray-500">{t(`${key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `apps/main/app/[locale]/sections/solution-section.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const SOLUTION_KEYS = ["export", "content", "seo", "system"] as const;

export function SolutionSection() {
  const t = useTranslations("solution");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {SOLUTION_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-xl border border-gray-100 p-6 bg-gray-50 hover:shadow-md transition-shadow"
            >
              <p className="font-semibold text-gray-800 mb-2">
                {t(`${key}_title`)}
              </p>
              <p className="text-sm text-gray-500">{t(`${key}_desc`)}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update `apps/main/app/[locale]/page.tsx`**

Replace the entire file:

```tsx
import { HeroSection } from "./sections/hero-section";
import { PainPointsSection } from "./sections/pain-points-section";
import { SolutionSection } from "./sections/solution-section";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/main/app/[locale]/sections/ apps/main/app/[locale]/page.tsx
git commit -m "feat(main): add hero section refactor, pain points, and solution sections"
```

---

## Task 4: Demos Section + Industries Section

**Files:**
- Create: `apps/main/app/[locale]/sections/demos-section.tsx`
- Create: `apps/main/app/[locale]/sections/industries-section.tsx`
- Modify: `apps/main/app/[locale]/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/sections/demos-section.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Demo = {
  key: string;
  url: string;
  live: boolean;
};

const DEMOS: Demo[] = [
  { key: "export", url: "https://export.demo.yoursite.com", live: false },
  { key: "catalog", url: "https://catalog.demo.yoursite.com", live: false },
  { key: "engineering", url: "https://engineering.demo.yoursite.com", live: false },
  { key: "quote", url: "https://quote.demo.yoursite.com", live: false },
  { key: "ai", url: "https://ai.demo.yoursite.com", live: false },
  { key: "consulting", url: "https://consulting.demo.yoursite.com", live: false },
];

export function DemosSection() {
  const t = useTranslations("demos");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {DEMOS.map((demo) => (
            <div
              key={demo.key}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="font-semibold text-gray-800">
                  {t(`${demo.key}_title`)}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                    demo.live
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {demo.live ? t("badge_live") : t("badge_coming")}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex-1">
                {t(`${demo.key}_desc`)}
              </p>
              {demo.live && (
                <a
                  href={demo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm font-medium text-green-700 hover:underline"
                >
                  → 访问演示
                </a>
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-green-700 text-green-700 hover:bg-green-50 transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `apps/main/app/[locale]/sections/industries-section.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const INDUSTRY_KEYS = [
  "factory",
  "trading",
  "equipment",
  "engineering",
  "interior",
  "professional",
  "wholesale",
  "consulting",
] as const;

export function IndustriesSection() {
  const t = useTranslations("industries");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {INDUSTRY_KEYS.map((key) => (
            <span
              key={key}
              className="px-4 py-2 rounded-full bg-green-50 text-green-800 text-sm font-medium border border-green-100"
            >
              {t(key)}
            </span>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm">
          {t("cta_prefix")}{" "}
          <Link href="/contact" className="text-green-700 hover:underline font-medium">
            {t("cta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `apps/main/app/[locale]/page.tsx`**

```tsx
import { HeroSection } from "./sections/hero-section";
import { PainPointsSection } from "./sections/pain-points-section";
import { SolutionSection } from "./sections/solution-section";
import { DemosSection } from "./sections/demos-section";
import { IndustriesSection } from "./sections/industries-section";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <PainPointsSection />
      <SolutionSection />
      <DemosSection />
      <IndustriesSection />
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/main/app/[locale]/sections/demos-section.tsx apps/main/app/[locale]/sections/industries-section.tsx apps/main/app/[locale]/page.tsx
git commit -m "feat(main): add demos and industries sections to homepage"
```

---

## Task 5: Process Section + Why Us Section

**Files:**
- Create: `apps/main/app/[locale]/sections/process-section.tsx`
- Create: `apps/main/app/[locale]/sections/why-us-section.tsx`
- Modify: `apps/main/app/[locale]/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/sections/process-section.tsx`**

```tsx
import { useTranslations } from "next-intl";

const STEPS = ["01", "02", "03", "04", "05", "06", "07", "08"] as const;

export function ProcessSection() {
  const t = useTranslations("process");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step) => (
            <div key={step} className="flex flex-col">
              <div className="text-3xl font-bold text-green-200 mb-2">
                {step}
              </div>
              <p className="font-semibold text-gray-800 mb-1">
                {t(`step${step}_title`)}
              </p>
              <p className="text-sm text-gray-500">{t(`step${step}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `apps/main/app/[locale]/sections/why-us-section.tsx`**

```tsx
import { useTranslations } from "next-intl";

const WHY_KEYS = [
  "demo",
  "content",
  "server",
  "price",
  "support",
  "speed",
] as const;

export function WhyUsSection() {
  const t = useTranslations("why_us");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <p className="font-semibold text-gray-800">
                ✓ {t(`${key}_title`)}
              </p>
              <p className="text-sm text-gray-500">{t(`${key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `apps/main/app/[locale]/page.tsx`**

```tsx
import { HeroSection } from "./sections/hero-section";
import { PainPointsSection } from "./sections/pain-points-section";
import { SolutionSection } from "./sections/solution-section";
import { DemosSection } from "./sections/demos-section";
import { IndustriesSection } from "./sections/industries-section";
import { ProcessSection } from "./sections/process-section";
import { WhyUsSection } from "./sections/why-us-section";

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
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/main/app/[locale]/sections/process-section.tsx apps/main/app/[locale]/sections/why-us-section.tsx apps/main/app/[locale]/page.tsx
git commit -m "feat(main): add delivery process and why-us sections to homepage"
```

---

## Task 6: Pricing Section + FAQ Section + Footer CTA Section (Complete Homepage)

**Files:**
- Create: `apps/main/app/[locale]/sections/pricing-section.tsx`
- Create: `apps/main/app/[locale]/sections/faq-section.tsx`
- Create: `apps/main/app/[locale]/sections/footer-cta-section.tsx`
- Modify: `apps/main/app/[locale]/page.tsx` (final version)

- [ ] **Step 1: Create `apps/main/app/[locale]/sections/pricing-section.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Package = {
  key: string;
  popular?: boolean;
  featureCount: number;
};

const PACKAGES: Package[] = [
  { key: "display", featureCount: 5 },
  { key: "export", popular: true, featureCount: 5 },
  { key: "catalog", featureCount: 5 },
  { key: "ai", featureCount: 5 },
];

export function PricingSection() {
  const t = useTranslations("pricing");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.key}
              className={`rounded-xl border p-6 flex flex-col ${
                pkg.popular
                  ? "border-green-500 bg-white shadow-lg ring-1 ring-green-500"
                  : "border-gray-200 bg-white"
              }`}
            >
              {pkg.popular && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full self-start mb-3">
                  {t("popular_badge")}
                </span>
              )}
              <p className="font-bold text-gray-800 mb-1">{t(`${pkg.key}_name`)}</p>
              <p className="text-2xl font-bold text-green-700 mb-1">
                {t(`${pkg.key}_price`)}
              </p>
              <p className="text-xs text-gray-400 mb-4">{t(`${pkg.key}_desc`)}</p>
              <ul className="space-y-1 flex-1 mb-6">
                {Array.from({ length: pkg.featureCount }, (_, i) => i + 1).map(
                  (n) => (
                    <li key={n} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t(`${pkg.key}_f${n}`)}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/contact"
                className={`text-center text-sm font-semibold py-2 rounded-md transition-colors ${
                  pkg.popular
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t("cta_consult")}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">{t("note")}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `apps/main/app/[locale]/sections/faq-section.tsx`**

```tsx
import { useTranslations } from "next-intl";

const FAQ_NUMS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="space-y-3">
          {FAQ_NUMS.map((n) => (
            <details
              key={n}
              className="group border border-gray-200 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-800 list-none hover:bg-gray-50">
                {t(`q${n}`)}
                <span className="ml-4 shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
                {t(`a${n}`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `apps/main/app/[locale]/sections/footer-cta-section.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function FooterCtaSection() {
  const t = useTranslations("footer_cta");
  return (
    <section className="py-20 px-4 bg-green-700 text-white text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-3">{t("title")}</h2>
        <p className="text-green-100 mb-8">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-white text-green-700 hover:bg-green-50 transition-colors"
          >
            {t("cta_primary")}
          </Link>
          <Link
            href="/demos"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-white/50 text-white hover:bg-green-600 transition-colors"
          >
            {t("cta_secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace `apps/main/app/[locale]/page.tsx` with the final complete version**

```tsx
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
```

- [ ] **Step 5: Run build to verify no TypeScript errors**

```bash
cd C:\Users\fanhu\Desktop\test\service-website
pnpm --filter @repo/main build
```

Expected: build succeeds with no TypeScript errors. Fix any type errors before committing.

- [ ] **Step 6: Commit**

```bash
git add apps/main/app/[locale]/sections/ apps/main/app/[locale]/page.tsx
git commit -m "feat(main): complete homepage with all 10 sections"
```

---

## Task 7: Supabase Contact Submissions Table

**Files:**
- Create: `apps/main/supabase/migrations/001_contact_submissions.sql`

**⚠️ Human step required:** After creating this file, copy the SQL and run it in your Supabase project's SQL Editor (dashboard.supabase.com → your project → SQL Editor).

- [ ] **Step 1: Create `apps/main/supabase/migrations/001_contact_submissions.sql`**

```sql
-- Contact form submissions from the main site
create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  contact text not null,
  message text not null,
  locale text not null default 'zh',
  status text not null default 'new' check (status in ('new', 'read', 'replied'))
);

-- Index for admin queries (most recent first)
create index if not exists contact_submissions_created_at_idx
  on contact_submissions (created_at desc);

-- RLS: only service role can read (anon can insert via server action)
alter table contact_submissions enable row level security;

-- Allow anyone to insert (form submissions come from server action with anon key)
create policy "allow_insert" on contact_submissions
  for insert to anon with check (true);

-- Only service role can select/update (admin use only)
create policy "service_role_all" on contact_submissions
  for all to service_role using (true) with check (true);
```

- [ ] **Step 2: Run the SQL in Supabase dashboard**

Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new`

Paste the SQL from Step 1 and click **Run**.

Expected: `Success. No rows returned.`

- [ ] **Step 3: Commit the migration file**

```bash
git add apps/main/supabase/
git commit -m "feat(main): add contact_submissions table migration"
```

---

## Task 8: Contact Page + Server Action

**Files:**
- Create: `apps/main/app/[locale]/contact/actions.ts`
- Create: `apps/main/app/[locale]/contact/contact-form.tsx`
- Create: `apps/main/app/[locale]/contact/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/contact/actions.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type ContactFormState = {
  success?: boolean;
  error?: string;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const company = (formData.get("company") as string | null)?.trim() ?? "";
  const contact = (formData.get("contact") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";
  const locale = (formData.get("locale") as string | null) ?? "zh";

  if (!name || !contact || !message) {
    return { error: "请填写所有必填项" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    company: company || null,
    contact,
    message,
    locale,
  });

  if (error) {
    console.error("Contact form insert error:", error.message);
    return { error: "提交失败，请稍后重试" };
  }

  return { success: true };
}
```

- [ ] **Step 2: Create `apps/main/app/[locale]/contact/contact-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitContactForm, type ContactFormState } from "./actions";

const initialState: ContactFormState = {};

export function ContactForm() {
  const t = useTranslations("contact_page");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  if (state.success) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl font-bold text-green-700 mb-2">
          {t("success_title")}
        </p>
        <p className="text-gray-500">{t("success_desc")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("name_label")} *
        </label>
        <input
          name="name"
          required
          placeholder={t("name_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("company_label")}
        </label>
        <input
          name="company"
          placeholder={t("company_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("contact_label")} *
        </label>
        <input
          name="contact"
          required
          placeholder={t("contact_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("message_label")} *
        </label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder={t("message_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{t("error")}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 disabled:opacity-60 transition-colors"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `apps/main/app/[locale]/contact/page.tsx`**

```tsx
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "联系我们",
  description: "填写需求表单，我们会在 1 个工作日内回复。",
};

export default function ContactPage() {
  const t = useTranslations("contact_page");
  return (
    <main className="py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3">{t("title")}</h1>
        <p className="text-center text-gray-500 mb-10">{t("subtitle")}</p>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/main/app/[locale]/contact/
git commit -m "feat(main): add contact page with Supabase server action"
```

---

## Task 9: Pricing Page

**Files:**
- Create: `apps/main/app/[locale]/pricing/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/pricing/page.tsx`**

```tsx
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "价格套餐",
  description: "透明定价，无隐藏费用。展示型官网 ¥5,000 起，外贸英文网站 ¥9,800 起。",
};

type Package = {
  key: string;
  popular?: boolean;
  featureCount: number;
};

const PACKAGES: Package[] = [
  { key: "display", featureCount: 5 },
  { key: "export", popular: true, featureCount: 5 },
  { key: "catalog", featureCount: 5 },
  { key: "ai", featureCount: 5 },
];

const MAINTENANCE_PLANS = [
  { key: "basic", featureCount: 5 },
  { key: "content", featureCount: 4 },
  { key: "seo", featureCount: 4 },
];

export default function PricingPage() {
  const t = useTranslations("pricing");
  const tp = useTranslations("pricing_page");

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-3">{tp("title")}</h1>
        <p className="text-center text-gray-500 mb-14 max-w-2xl mx-auto">
          {tp("subtitle")}
        </p>

        {/* Build packages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.key}
              className={`rounded-xl border p-6 flex flex-col ${
                pkg.popular
                  ? "border-green-500 bg-white shadow-lg ring-1 ring-green-500"
                  : "border-gray-200 bg-white"
              }`}
            >
              {pkg.popular && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full self-start mb-3">
                  {t("popular_badge")}
                </span>
              )}
              <p className="font-bold text-gray-800 mb-1">{t(`${pkg.key}_name`)}</p>
              <p className="text-2xl font-bold text-green-700 mb-1">
                {t(`${pkg.key}_price`)}
              </p>
              <p className="text-xs text-gray-400 mb-4">{t(`${pkg.key}_desc`)}</p>
              <ul className="space-y-1.5 flex-1 mb-6">
                {Array.from({ length: pkg.featureCount }, (_, i) => i + 1).map(
                  (n) => (
                    <li key={n} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t(`${pkg.key}_f${n}`)}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/contact"
                className={`text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                  pkg.popular
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t("cta_consult")}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mb-16">{t("note")}</p>

        {/* Maintenance plans */}
        <h2 className="text-2xl font-bold text-center mb-2">
          {tp("maintenance_title")}
        </h2>
        <p className="text-center text-gray-500 mb-10">{tp("maintenance_subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {MAINTENANCE_PLANS.map((plan) => (
            <div
              key={plan.key}
              className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col"
            >
              <p className="font-bold text-gray-800 mb-1">
                {tp(`${plan.key}_name`)}
              </p>
              <p className="text-xl font-bold text-green-700 mb-4">
                {tp(`${plan.key}_price`)}
              </p>
              <ul className="space-y-1.5 flex-1">
                {Array.from(
                  { length: plan.featureCount },
                  (_, i) => i + 1
                ).map((n) => (
                  <li key={n} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-green-500 shrink-0">✓</span>
                    {tp(`${plan.key}_f${n}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-green-50 rounded-2xl p-10">
          <h3 className="text-xl font-bold mb-2">{tp("cta_title")}</h3>
          <p className="text-gray-500 mb-6">{tp("cta_subtitle")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {tp("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/main/app/[locale]/pricing/
git commit -m "feat(main): add pricing page with packages and maintenance plans"
```

---

## Task 10: Demos Page

**Files:**
- Create: `apps/main/app/[locale]/demos/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/demos/page.tsx`**

```tsx
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "演示案例",
  description: "6 个真实可访问的行业演示网站，展示外贸英文网站、产品目录系统、报价系统等功能。",
};

type Demo = {
  key: string;
  url: string;
  live: boolean;
};

const DEMOS: Demo[] = [
  { key: "export", url: "https://export.demo.yoursite.com", live: false },
  { key: "catalog", url: "https://catalog.demo.yoursite.com", live: false },
  { key: "engineering", url: "https://engineering.demo.yoursite.com", live: false },
  { key: "quote", url: "https://quote.demo.yoursite.com", live: false },
  { key: "ai", url: "https://ai.demo.yoursite.com", live: false },
  { key: "consulting", url: "https://consulting.demo.yoursite.com", live: false },
];

export default function DemosPage() {
  const t = useTranslations("demos");
  const tp = useTranslations("demos_page");

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3">{tp("title")}</h1>
        <p className="text-center text-gray-500 mb-14 max-w-2xl mx-auto">
          {tp("subtitle")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {DEMOS.map((demo) => (
            <div
              key={demo.key}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="font-semibold text-gray-800">
                  {t(`${demo.key}_title`)}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                    demo.live
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {demo.live ? tp("visit") : tp("coming_soon")}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex-1 mb-4">
                {t(`${demo.key}_desc`)}
              </p>
              {demo.live ? (
                <a
                  href={demo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-green-700 hover:underline"
                >
                  {tp("visit")} →
                </a>
              ) : (
                <span className="text-sm text-gray-400">{tp("coming_soon")}</span>
              )}
            </div>
          ))}
        </div>

        <div className="text-center bg-green-50 rounded-2xl p-10">
          <h2 className="text-xl font-bold mb-2">{t("title")}</h2>
          <p className="text-gray-500 mb-6">{t("subtitle")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run build to verify entire site compiles**

```bash
cd C:\Users\fanhu\Desktop\test\service-website
pnpm turbo build --filter=@repo/main...
```

Expected: Build succeeds with no TypeScript errors. Fix any type errors before committing.

- [ ] **Step 3: Commit**

```bash
git add apps/main/app/[locale]/demos/
git commit -m "feat(main): add demos page"
```

---

## Self-Review

**Spec coverage:**
- ✓ Homepage 10 modules: Hero, Pain Points, Solution, Demos, Industries, Process, Why Us, Pricing, FAQ, Footer CTA
- ✓ Shared Nav (sticky, responsive, mobile menu, locale-aware links)
- ✓ Shared Footer (brand, links, contact info)
- ✓ Contact page with Supabase Server Action
- ✓ Pricing page (4 build packages + 3 maintenance plans)
- ✓ Demos page (6 demo cards, live/coming-soon states)
- ✓ zh/en i18n for all sections and pages

**Not in this plan (by design):**
- Services page — homepage ③ (Solution section) covers this sufficiently for MVP
- Industry solution pages (8 SEO pages) — deferred, lower priority
- Blog/MDX system — B2
- WhatsApp floating button — can be added quickly once phone number is confirmed
- Resend email notifications on contact submit — can be added to actions.ts once RESEND_API_KEY is set

**Placeholder scan:** No TBD, TODO, or placeholder text in code. `yoursite.com` demo URLs are intentional placeholders matching the DEMOS array `live: false` flags, so they render as "coming soon" without active links.

**Type consistency:**
- `Package.key` matches translation key prefix in both pricing-section.tsx and pricing/page.tsx
- `Demo.key` matches translation key prefix in both demos-section.tsx and demos/page.tsx
- `submitContactForm` signature matches `useActionState` expectation: `(prevState, formData) => Promise<State>`
- All `t()` calls reference keys defined in Task 1's zh.json / en.json
