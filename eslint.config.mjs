import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Layering: assets/styles → components/ui (shadcn) → design-system (product API)
 * → shared/ui (app composites) → modules. Only the design system may reach
 * into shadcn or Radix directly.
 */
const LAYER_BOUNDARIES = {
  files: ["src/app/**/*.{ts,tsx}", "src/modules/**/*.{ts,tsx}", "src/shared/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/components/ui/*"],
            message:
              "Import from '@/design-system' instead. Add a wrapper there if the primitive is missing.",
          },
          {
            group: ["radix-ui", "radix-ui/*", "@radix-ui/*"],
            message:
              "Radix belongs to the design system. Expose a component from '@/design-system' instead.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  LAYER_BOUNDARIES,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // PWA build artifacts
    "public/sw.js",
    "public/workbox-*.js",
    "public/swe-worker-*.js",
  ]),
]);

export default eslintConfig;
