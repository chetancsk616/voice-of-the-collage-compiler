module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended', 'plugin:node/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-process-exit': 'off'
  }
}
