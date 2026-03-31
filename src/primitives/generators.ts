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

/**
 * Clamps a number to the decimal precision of a reference literal.
 * Ensures math noise like 0.30000000000000004 snaps back to 0.3.
 */
function clampToPrecision(target: number, reference: number): number {
    const s = String(reference);
    let precision = 0;

    if (s.includes('e')) {
        // Handle scientific notation: e.g., 1e-7 or 1.23e-4
        const [base, exp] = s.split('e');
        const baseDecimals = base.includes('.') ? base.split('.')[1].length : 0;
        precision = Math.abs(Number(exp)) + baseDecimals;
    } else if (s.includes('.')) {
        // Handle standard decimals: e.g., 0.03
        precision = s.split('.')[1].length;
    }

    // toFixed(precision) is the "clamp". 
    // parseFloat() removes any resulting trailing zeros (turning "1.200" into 1.2).
    return parseFloat(target.toFixed(precision));
}
function cleanNumber(num: number): number {
    // toPrecision(12) handles the noise at the 15th+ digit.
    // parseFloat() removes the trailing zeros that you (rightly) pointed out.
    return parseFloat(num.toPrecision(12));
}

function generateSteps<T extends TokenType>(params: StepsParams<T>, core: CoreConfig): GeneratorOutput {
	const result: GeneratorOutput = {};
    const base = params.base ?? core.baseUnit;
    const steps = params.steps ?? core.baseSteps;
    const resolvedSteps = uniqueSorted(steps);

    for (const step of resolvedSteps) {
        
        // Clamp the step itself to remove potential noise from uniqueSorted or previous math
        const key = String(step);
        console.log(`Generating step: ${key}`);

        if (base && typeof base === "object" && "unit" in base) {
            const calculatedValue = cleanNumber(step * base.value);
            result[key] = { value: calculatedValue, unit: base.unit };
        } else {
            result[key] = step;
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
        
        // Use the 'step' literal from config to clamp the current value 'v'
        const cleanedValue = cleanNumber(v);
        const key = String(cleanedValue);

        if (params.base && "unit" in params.base) {
            result[key] = { value: cleanedValue * params.base.value, unit: params.base.unit };
        } else {
            result[key] = cleanedValue;
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
            if (paletteName === 'black' || paletteName === 'white' || paletteName === 'transparent') {
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