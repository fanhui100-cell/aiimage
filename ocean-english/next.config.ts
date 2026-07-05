import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  // A6：测验合并 — /lexiverse/quiz 永久重定向到全站唯一测验入口 /quiz（query 透传）
  async redirects() {
    return [
      { source: '/lexiverse/quiz', destination: '/quiz', permanent: true },
      // B7-4：旧词汇浏览器并入词库页「探索词典」tab
      { source: '/lexiverse/vocab', destination: '/dictionary?tab=explore', permanent: true },
    ]
  },
  // pdf-parse 2.x (pdfjs-dist 5.x) uses dynamic require() for its worker script.
  // Turbopack cannot statically analyze that expression and fails at runtime with
  // "Cannot find module as expression is too dynamic".
  // Marking these packages as server-side externals tells Next.js to skip bundling
  // them and use Node.js native require() instead, which resolves the path at runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
