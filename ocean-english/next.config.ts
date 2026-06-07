import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  // pdf-parse 2.x (pdfjs-dist 5.x) uses dynamic require() for its worker script.
  // Turbopack cannot statically analyze that expression and fails at runtime with
  // "Cannot find module as expression is too dynamic".
  // Marking these packages as server-side externals tells Next.js to skip bundling
  // them and use Node.js native require() instead, which resolves the path at runtime.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
