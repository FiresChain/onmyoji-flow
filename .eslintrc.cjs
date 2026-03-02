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
      files: ["**/*.cjs"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
};
