module.exports = {
    env: {
      browser: true,
      es2021: true,
    },
    extends: ['eslint:recommended', 'plugin:svelte/recommended', 'prettier'],
    overrides: [
      {
        files: ['*.svelte'],
        processor: 'svelte/svelte',
      },
    ],
    plugins: ['svelte'],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      // Add custom rules if you want
    },
  };
  