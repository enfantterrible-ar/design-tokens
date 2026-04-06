
import { defineConfig } from '@terrazzo/cli';
import js from '@terrazzo/plugin-js';

import { getPathsFromRoot } from './terrazzo/helpers';
import { filterPrimitivesFromJS } from './terrazzo/plugin-filter-primitives-from-js';
import { generateJSON } from './terrazzo/plugin-generate-json';
import { tokenStudioPlugin } from './terrazzo/plugin-token-studio-transform';

export default defineConfig({
  tokens: [
    './layers/layer.primitives.json',
    ...await getPathsFromRoot('layers/base'),
    ...await getPathsFromRoot('layers/semantics')
  ],
  plugins: [
    /** @see https://terrazzo.app/docs */
    filterPrimitivesFromJS(),
    generateJSON(),
    tokenStudioPlugin(),
  ],
  outDir: './dist/',
  lint: {
    /** @see https://terrazzo.app/docs/linting */
    build: {
      enabled: true,
    },
    rules: {
      // core/valid-color is set to warn because it does not
      // properly resolves color values using JSON pointer syntax,
      // which is used in some tokens, specifically in the case of shadows,
      // which contains a more complex structure.
      'core/valid-color': 'warn',
      'core/valid-dimension': 'error',
      'core/valid-font-family': 'error',
      'core/valid-font-weight': 'error',
      'core/valid-duration': 'error',
      'core/valid-cubic-bezier': 'error',
      'core/valid-number': 'error',
      'core/valid-link': 'error',
      'core/valid-boolean': 'error',
      'core/valid-string': 'error',
      'core/valid-stroke-style': 'error',
      'core/valid-border': 'error',
      'core/valid-transition': 'error',
      'core/valid-shadow': 'error',
      'core/valid-gradient': 'error',
      'core/valid-typography': 'error',
      'core/consistent-naming': 'warn',
    },
  },
});