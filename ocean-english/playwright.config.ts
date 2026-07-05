import { defineConfig } from '@playwright/test'

// 界面优化5 阶段2 A7-3 — 学习闭环回归（spec 总报告 04 节验收标准）
// 跑法：cd ocean-english && npx playwright test
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  // 本版 Next 同一项目只允许一个 dev server：已开发着的 3000 直接复用
  webServer: {
    command: 'npx next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
