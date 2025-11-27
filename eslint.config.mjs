import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable specific rules that are causing warnings
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "warn", // Change to "off" if you want to disable completely
      "@next/next/no-img-element": "off",
      "no-var": "off",
    },
  },
];

export default eslintConfig;
