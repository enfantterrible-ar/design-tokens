import type { Plugin, BuildHookOptions } from '@terrazzo/parser';
import fs from 'node:fs';
import path from 'node:path';

export const generateJSON = (): Plugin => ({
  name: 'generate-json',
  enforce: 'post',
  
  async build(args: BuildHookOptions) {
    const outDir = path.resolve('./dist');
    
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const permutations = args.resolver.listPermutations();

    permutations.forEach((input: any) => {
      const tokens = args.resolver.apply(input);

      // Filter primitives and construct strict, clean token objects
      const filteredAndCleaned = Object.fromEntries(
        Object.entries(tokens)
          .filter(([id]) => !id.startsWith('primitives.'))
          .map(([id, token]: [string, any]) => {
            const rawToken = args.tokens[id];
            const cleanToken: Record<string, unknown> = {};

            // Strictly assign only the 4 allowed keys
            if (token.$type !== undefined) cleanToken.$type = token.$type;
            if (token.$value !== undefined) cleanToken.$value = token.$value;
            
            // Recover metadata from the AST
            if (rawToken?.$description !== undefined) cleanToken.$description = rawToken.$description;
            if (rawToken?.$extensions !== undefined) cleanToken.$extensions = rawToken.$extensions;

            return [id, cleanToken];
          })
      );

      const activeModifiers = Object.values(input).filter(val => val !== '.' && val !== '');
      const suffix = activeModifiers.length > 0 ? `-${activeModifiers.join('-')}` : '';
      const filename = path.resolve(outDir, `tokens${suffix}.dtcg.json`);

      fs.writeFileSync(filename, JSON.stringify(filteredAndCleaned, null, 2), 'utf-8');

      args.context.logger.info({
        group: 'plugin',
        label: 'generate-json',
        message: `Generated tokens${suffix}.dtcg.json`
      });
    });
  }
});