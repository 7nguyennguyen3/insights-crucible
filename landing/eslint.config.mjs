import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Your existing extended configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add a new object to override specific rules
  {
    rules: {
      // Disables the rule that warns about unescaped characters like apostrophes.
      "react/no-unescaped-entities": "off",

      // Disables the rule for unused variables in TypeScript files.
      "@typescript-eslint/no-unused-vars": "off",

      // Also disable the base ESLint rule for unused variables for consistency.
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
