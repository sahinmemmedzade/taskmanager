const js = require("@eslint/js");

module.exports = [
  // .next və node_modules-u tamamilə ignore et
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },

  js.configs.recommended,

  // Test faylları
  {
    files: ["**/__tests__/**/*.{js,ts}", "**/*.test.{js,ts}"],
    languageOptions: {
      globals: {
        test: "readonly",
        expect: "readonly",
        describe: "readonly",
        it: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },

  // JS faylları (eslint.config.js, jest.config.js)
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
  },

  // TypeScript + TSX faylları
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),  // ← ən vacib hissə
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: "readonly",
        RequestInit: "readonly",
        Request: "readonly",
        Response: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        FormData: "readonly",
        navigator: "readonly",
        performance: "readonly",
        global: "readonly",
        sessionStorage: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "react/react-in-jsx-scope": "off",
    },
  },
];