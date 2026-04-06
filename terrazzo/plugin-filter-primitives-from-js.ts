import js from '@terrazzo/plugin-js';

import type { Plugin, BuildHookOptions } from '@terrazzo/parser';

export const filterPrimitivesFromJS = (): Plugin => ({
  name: 'filter-primitives-from-js',
  async build(args: BuildHookOptions) {
    let finalCount = 0;

    const proxiedResolver: typeof args.resolver = {
      ...args.resolver,
      apply: (input) => {
        const resolvedTokens = args.resolver.apply(input);

        const filtered = Object.fromEntries(
          Object.entries(resolvedTokens)
            .filter(([id]) => !id.startsWith("primitives."))
            .map(([id, token]) => {
              // Get the raw token from the AST
              const rawToken = args.tokens[id];
              const enrichedToken = { ...token };
              
              // Stitch metadata back if it exists
              if (rawToken?.$description) {
                enrichedToken.$description = rawToken.$description;
              }
              if (rawToken?.$extensions) {
                enrichedToken.$extensions = rawToken.$extensions;
              }
              
              return [id, enrichedToken];
            })
        );

        finalCount = Object.keys(filtered).length;
        return filtered;
      },
    };

    const jsInstance = js({
      filename: "tokens.js",
      properties: ["$value", "$type", "$description", "$extensions"], // Keep this here
    });

    if (jsInstance.build) {
      const result = await jsInstance.build({
        ...args,
        resolver: proxiedResolver
      });

      args.context.logger.info({
        group: 'plugin',
        label: 'filter-js',
        message: `tokens.js built with ${finalCount} public tokens (primitives excluded)`
      });

      return result;
    }
  },
});