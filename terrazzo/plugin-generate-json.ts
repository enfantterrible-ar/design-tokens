import type { Plugin } from '@terrazzo/parser';
import fs from 'node:fs';
import path from 'node:path';

export const generateJSON = (): Plugin => ({
  name: 'generate-json',
  
  async buildEnd(args) {
    // Resolving the absolute path to the file
    const artifactPath = path.resolve('./dist/tokens.js');
    
    try {
      // Importing the file directly
      const { resolver } = await import(
		/* @vite-ignore */
		artifactPath
	);

      const permutations = resolver.listPermutations();

      permutations.forEach((input: any) => {
        const tokens = resolver.apply(input);

        const activeModifiers = Object.values(input).filter(val => val !== '.' && val !== '');
        const suffix = activeModifiers.length > 0 ? `-${activeModifiers.join('-')}` : '';
        const filename = path.resolve(`./dist/tokens${suffix}.json`);

        fs.writeFileSync(filename, JSON.stringify(tokens, null, 2));

        args.context.logger.info({
          group: 'plugin',
          label: 'generate-json',
          message: `Generated tokens${suffix}.json`
        });
      });
    } catch (error) {
      args.context.logger.error({
        group: 'plugin',
        label: 'generate-json',
        message: `Failed to import artifact: ${error}`
      });
    }
  }
});