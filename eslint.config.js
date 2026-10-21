import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'reports'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Browser code: Web APIs only, nothing from Node.
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['node:*'], message: 'Browser code: Web APIs only.' }] },
      ],
    },
  },
)
