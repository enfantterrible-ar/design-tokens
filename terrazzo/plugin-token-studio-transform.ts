import type { Plugin, BuildHookOptions } from '@terrazzo/parser';

// Utility to convert hex + alpha to rgba()
const hexToRgba = (hex: string, alpha?: number) => {
  const a = alpha !== undefined ? alpha : 1;
  if (a >= 1) return hex; 

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// 1. The Formatter
const formatForStudio = (token: any) => {
  const formatted = { ...token };

  if (typeof formatted.$value === 'string' && formatted.$value.startsWith('{')) {
    return formatted;
  }

  switch (formatted.$type) {
    case 'dimension':
      formatted.$value = formatted.$value.value === 0 
        ? "0" 
        : `${formatted.$value.value}${formatted.$value.unit}`;
      break;

    case 'color':
      formatted.$value = hexToRgba(formatted.$value.hex, formatted.$value.alpha);
      break;

    case 'typography':
      formatted.$value = {
        fontFamily: formatted.$value.fontFamily.join(', '),
        fontWeight: formatted.$value.fontWeight.toString(),
        lineHeight: formatted.$value.lineHeight.toString(),
        fontSize: `${formatted.$value.fontSize.value}${formatted.$value.fontSize.unit}`,
        letterSpacing: `${formatted.$value.letterSpacing.value}${formatted.$value.letterSpacing.unit}`
      };
      break;

    case 'shadow':
      formatted.$type = 'boxShadow';
      formatted.$value = formatted.$value.map((layer: any) => ({
        x: layer.offsetX.value === 0 ? "0" : `${layer.offsetX.value}${layer.offsetX.unit}`,
        y: layer.offsetY.value === 0 ? "0" : `${layer.offsetY.value}${layer.offsetY.unit}`,
        blur: layer.blur.value === 0 ? "0" : `${layer.blur.value}${layer.blur.unit}`,
        spread: layer.spread.value === 0 ? "0" : `${layer.spread.value}${layer.spread.unit}`,
        color: hexToRgba(layer.color.hex, layer.color.alpha),
        type: layer.inset ? 'innerShadow' : 'dropShadow'
      }));
      break;

    case 'fontFamily':
      formatted.$value = formatted.$value.join(', ');
      break;
  }

  return formatted;
};

// 2. The Unflatten Utility
const unflattenFirstLevel = (flatTokens: Record<string, any>) => {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(flatTokens)) {
    const firstDotIndex = key.indexOf('.');

    if (firstDotIndex === -1) {
      result[key] = value;
      continue;
    }

    const topLevelKey = key.substring(0, firstDotIndex);
    const remainingPath = key.substring(firstDotIndex + 1);

    if (!result[topLevelKey]) result[topLevelKey] = {};
    result[topLevelKey][remainingPath] = value;
  }

  return result;
};

// 3. The Plugin
export const tokenStudioPlugin = (): Plugin => ({
  name: 'token-studio-plugin',

  async build({ resolver, tokens: rawTokens, outputFile, context }: BuildHookOptions) {
    // 1. Get the exact permutations as the source of truth
    const permutations = resolver.listPermutations();

    for (const input of permutations) {
      const tokens = resolver.apply(input);
      const flatStudioTokens: Record<string, any> = {};

      for (const [id, token] of Object.entries(tokens)) {
        if (id.startsWith('primitives.')) continue;

        // ONLY grab the valid fields.
        const cleanToken: Record<string, any> = {
          $type: token.$type,
          $value: token.$value
        };

        // Stitch metadata back if it exists
        if (rawTokens[id]?.$description) cleanToken.$description = rawTokens[id].$description;
        if (rawTokens[id]?.$extensions) cleanToken.$extensions = rawTokens[id].$extensions;

        // Apply Token Studio formatting and store it in our temporary object
        flatStudioTokens[id] = formatForStudio(cleanToken);
      }

      // 2. Format for Token Studio (create Top-Level Sets)
      const nestedTokens = unflattenFirstLevel(flatStudioTokens);

      // 3. Exact same filename logic as generate-json
      const activeModifiers = Object.values(input).filter(val => val !== '.' && val !== '');
      const suffix = activeModifiers.length > 0 ? `-${activeModifiers.join('-')}` : '';
      const filename = `tokens${suffix}.tokens-studio.json`;

      // 4. Output the file
      outputFile(filename, JSON.stringify(nestedTokens, null, 2));

      context.logger.info({
        group: 'plugin',
        label: 'token-studio',
        message: `Generated ${filename}`
      });
    }
  }
});