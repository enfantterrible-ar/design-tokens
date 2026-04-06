import js from '@terrazzo/plugin-js';

import type { Plugin, BuildHookOptions } from '@terrazzo/parser';

export const filterPrimitivesFromJS = (): Plugin => ({
  name: 'filter-primitives-from-js',
  async build(args: BuildHookOptions) {
    let finalCount = 0;

    // 1. The Proxy Resolver
    const proxiedResolver: typeof args.resolver = {
      ...args.resolver,
      apply: (input) => {
        const resolvedTokens = args.resolver.apply(input);

        // 2. Filter logic
        const filtered = Object.fromEntries(
          Object.entries(resolvedTokens).filter(([id]) => !id.startsWith("primitives."))
        );

        // Update our counter
        finalCount = Object.keys(filtered).length;
        
        return filtered;
      },
    };

    // 3. Initialize the official plugin
    const jsInstance = js({
      filename: "tokens.ts",
      properties: ["$value", "$type", "jsonID"],
    });

    if (jsInstance.build) {
      const result = await jsInstance.build({
        ...args,
        resolver: proxiedResolver
      });

      // 4. Corrected Logger Path
      // It lives in args.context.logger
      args.context.logger.info({
        group: 'plugin', // Required by LogEntry
        label: 'filter-js', // Optional, helps identify the message
        message: `tokens.js built with ${finalCount} public tokens (primitives excluded)`
      });

      return result;
    }
  },
});