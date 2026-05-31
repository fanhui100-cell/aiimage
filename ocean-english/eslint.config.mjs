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
  // Disable React Compiler rules that conflict with standard Three.js/R3F animation patterns.
  // R3F useFrame callbacks legitimately read and mutate Three.js objects outside of render.
  {
    files: ["components/visual/**/*.tsx", "components/visual/**/*.ts"],
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
