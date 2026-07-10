require("@rushstack/eslint-patch/modern-module-resolution");

const {
  createCoreDocumentRestrictedGlobalsRule,
  createStoreRestrictedGlobalsRule,
} = require("./eslint-rules/config/global-boundaries");

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  ignorePatterns: ["dist/", "dist-app/", "coverage/", "node_modules/"],
  overrides: [
    {
      files: ["**/*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    {
      files: ["src/**/*.{js,jsx,ts,tsx,vue}"],
      excludedFiles: ["src/__tests__/**"],
      rules: {
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-restricted-properties": [
          "error",
          {
            object: "localStorage",
            property: "clear",
            message:
              "Avoid localStorage.clear() in runtime code. Remove only owned keys explicitly.",
          },
          {
            object: "sessionStorage",
            property: "clear",
            message:
              "Avoid sessionStorage.clear() in runtime code. Remove only owned keys explicitly.",
          },
        ],
        "no-top-level-global-listener": "error",
      },
    },
    {
      files: ["src/**/*.{js,jsx,ts,tsx,vue}"],
      excludedFiles: ["src/__tests__/**"],
      rules: {
        "module-boundaries": "error",
      },
    },
    {
      files: ["src/**/*Store.{js,jsx,ts,tsx}", "src/**/*store.{js,jsx,ts,tsx}"],
      excludedFiles: ["src/__tests__/**"],
      rules: {
        "no-restricted-globals": createStoreRestrictedGlobalsRule(),
      },
    },
    {
      files: ["src/core/document/**/*.{js,jsx,ts,tsx}"],
      excludedFiles: ["src/__tests__/**"],
      rules: {
        "no-restricted-globals": createCoreDocumentRestrictedGlobalsRule(),
      },
    },
    {
      files: ["**/*.cjs"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
};
