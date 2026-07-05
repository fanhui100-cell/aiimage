import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    // 设计交付/参照（HTML/JSX 原型）只作参考，不进运行时打包，不纳入 lint。
    "docs/**",
    // stitch-export 是设计交付的页面源码副本（未跟踪、不进运行时打包），不纳入 lint。
    "stitch-export/**",
    // 一次性 CJS 数据脚本（require 工具，node/tsx 直跑，不进运行时打包），不纳入 lint。
    "scripts/**/*.cjs",
  ]),
  // R3F animation patterns: Three.js objects are intentionally mutated per-frame.
  {
    files: [
      "components/visual/**/*.tsx",
      "components/visual/**/*.ts",
      "components/lexiverse/**/*.tsx",
      "components/lexiverse/**/*.ts",
    ],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
  // react-hooks/purity incorrectly flags Date.now() / Math.random() inside event
  // handlers and setTimeout callbacks that are not part of render. Disable globally.
  {
    rules: {
      "react-hooks/purity": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      // Reading localStorage (external system) on mount is legitimate synchronization.
      // The rule is too strict for this well-established React pattern.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // scripts/** 是一次性 CLI 工具（数据生成/审计/迁移，tsx 直跑），不进运行时打包；
  // Supabase 动态查询结果用 any 是务实选择，放宽这两条以免污染 CI 主门禁。
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
    },
  },
]);

export default eslintConfig;
