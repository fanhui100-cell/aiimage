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
  ]),
  // R3F animation patterns: Three.js objects are intentionally mutated per-frame.
  {
    files: ["components/visual/**/*.tsx", "components/visual/**/*.ts"],
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
]);

export default eslintConfig;
