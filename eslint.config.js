import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{ ignores: ["dist/**", "core/dist/**", "node_modules/**", "core/node_modules/**", "core/vendor/**", "core/index.cjs"] },
	{ files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", "core/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
	tseslint.configs.recommended,
	{ rules: {
		"@typescript-eslint/no-unused-vars": ["error", {
			"argsIgnorePattern": "^_",
			"varsIgnorePattern": "^_|^Ui$",
			"caughtErrorsIgnorePattern": "^_"
		}],
		"@typescript-eslint/no-explicit-any": "off",
		"indent": ["warn", "tab"],
	}}
]);
