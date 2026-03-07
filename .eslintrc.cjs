require("@rushstack/eslint-patch/modern-module-resolution");

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
        parser: false,
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    {
      files: ["src/**/*.{js,ts,vue}"],
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
      files: ["src/ts/useStore.ts"],
      rules: {
        "active-file-id-boundary": "error",
        "file-list-boundary": "error",
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
