import { readdir } from 'node:fs/promises';
import { get } from 'node:http';
import { join, relative } from 'node:path';

import { defineConfig } from '@terrazzo/cli';
import js from '@terrazzo/plugin-js';

// 1. Define your helper
const getPathsFromRoot = async (targetDir) => {
  const projectRoot = process.cwd(); 
  const absoluteTargetDir = join(projectRoot, targetDir);
  const entries = await readdir(absoluteTargetDir, { recursive: true, withFileTypes: true });

  return entries
    .filter(entry => entry.isFile())
    .map(entry => {
      const fullPath = join(entry.parentPath || entry.path, entry.name);
      const relPath = relative(projectRoot, fullPath);
      // Adding the ./ back in since it's cleaner for config files
      return relPath.startsWith('.') ? relPath : `./${relPath}`;
    });
};

// 2. Resolve the paths first
const semanticFiles = await getPathsFromRoot('layers/semantics');

const pluginJson = () => ({
  name: 'plugin-json',
  async transform({ tokens, setTransform }) {
    for (const [id, token] of Object.entries(tokens)) {
      setTransform(id, {
        format: 'json',
        localID: id,
        value: JSON.stringify(token.$value),
        mode: '.',
      });
    }
  },
  async build({ getTransforms, outputFile }) {
    const out = {};
    for (const token of getTransforms({ format: 'json', mode: '.' })) {
      const id = token.token.id;
      if (id.startsWith('primitives.color') || id.startsWith('primitives.')) continue;
      out[id] = {
        $type: token.token.$type,
        $value: JSON.parse(token.value),
      };
    }
    outputFile('tokens.json', JSON.stringify(out, null, 2));
  },
});

export default defineConfig({
  tokens: [
    './layers/tokens.primitives.json',
    './layers/tokens.palette.json',
    ...semanticFiles
  ],
  plugins: [
    /** @see https://terrazzo.app/docs */
    pluginJson(),
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