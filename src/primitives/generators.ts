import { formatHex, oklch, parse, rgb } from 'culori';
import colors from 'tailwindcss/colors';

import {
    ColorValue, CoreConfig, MapParams, PaletteParams, RangeParams, StepsParams, SupportedColorSpace,
    TokenType
} from './types';

// ============================================================
// GENERATORS (PURE)
// ============================================================

type GeneratorOutput = Record<string, unknown>;

function uniqueSorted(numbers: number[]): number[] {
    return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

function generateSteps<T extends TokenType>(params: StepsParams<T>, core: CoreConfig): GeneratorOutput {
	const result: GeneratorOutput = {};
    const base = params.base ?? core.baseUnit;
    const steps = params.steps ?? core.baseSteps;
    const resolvedSteps = uniqueSorted(steps);

    for (const step of resolvedSteps) {
        if (base && typeof base === "object" && "unit" in base) {
            result[String(step)] = { value: step * base.value, unit: base.unit };
        } else {
            result[String(step)] = step;
        }
    }

    if (params.extend) Object.assign(result, params.extend);

    return result;
}

function generateRange(params: RangeParams): GeneratorOutput {
    const min = params.min ?? 0;
    const max = params.max ?? 100;
    const step = params.step ?? 1;
    const result: GeneratorOutput = {};

    for (let v = min; v <= max; v += step) {
        if (params.base && "unit" in params.base) {
            result[String(v)] = { value: v * params.base.value, unit: params.base.unit };
        } else {
            result[String(v)] = v;
        }
    }

    return result;
}

function generateMap<T extends TokenType>(params: MapParams<T>): GeneratorOutput {
	return { ...params.values };
}

function parseTailwindColor(value: string, colorSpace: SupportedColorSpace): ColorValue {
    const parsed = parse(value);
    if (!parsed) throw new Error(`Failed to parse color: ${value}`);
    
    const color = oklch(parsed);
    if (!color) throw new Error(`Failed to convert color to oklch: ${value}`);

    if (colorSpace === "oklch") {
        return {
            colorSpace: "oklch",
            components: [color.l, color.c, color.h ?? 0].map(v => Math.round(v * 10000) / 10000)							,
            alpha: color.alpha ?? 1,
            hex: formatHex(parsed)
        };
    }

    const converted = rgb(parsed);
    if (!converted) throw new Error(`Failed to convert color to rgb: ${value}`);
    return {
        colorSpace: "srgb",
        components: [converted.r, converted.g, converted.b].map(v => Math.round(v * 10000) / 10000),
        alpha: converted.alpha ?? 1,
        hex: formatHex(parsed)
    };
}

function generateColor(params: PaletteParams): GeneratorOutput {
    const result: GeneratorOutput = {};

    for (const [paletteName, scale] of Object.entries(colors)) {
        if (typeof scale === 'string') {
            if (paletteName === 'black' || paletteName === 'white') {
                result[paletteName] = parseTailwindColor(scale, params.colorSpace);
            }
            continue;
        }

        if (typeof scale !== 'object' || scale === null) continue;

        for (const [step, value] of Object.entries(scale)) {
            if (typeof value !== 'string') continue;
            result[`${paletteName}-${step}`] = parseTailwindColor(value, params.colorSpace);
        }
    }

    return result;
}

export { generateSteps, generateRange, generateMap, generateColor, type GeneratorOutput };